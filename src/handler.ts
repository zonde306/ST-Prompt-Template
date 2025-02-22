// @ts-expect-error
import vm from 'vm-browserify';
import _ from 'lodash';
import { diffLines } from 'diff';
import { GenerateData, Message } from './defines';
import { eventSource, event_types, chat, messageFormatting } from '../../../../../script.js';
import { prepareGlobals, evalTemplate } from './function/ejs';

function logDifference(a : string, b : string, unchanged : boolean = false) {
    const diff = diffLines(a, b);
    for(const part of diff) {
        if(part.added) {
            console.debug(`+ ${part.value}`);
        } else if(part.removed) {
            console.debug(`- ${part.value}`);
        } else if(unchanged) {
            console.debug(`  ${part.value}`);
        }
    }
}

async function updateChat(data : GenerateData) {
    const env = await prepareGlobals();

    for(const [idx, message] of data.messages.entries()) {
        try {
            let newContent = await evalTemplate(message.content, env);
            if(newContent !== message.content) {
                console.debug(`update prompt #${idx}:`);
                logDifference(message.content, newContent);
            }
            message.content = newContent;
        } catch(err) {
            console.debug(`handling prompt errors #${idx}`);
            console.error(err);
        }
    }
}

async function updateMessage(message_id : string, env? : Record<string, unknown>) {
    if(!message_id) {
        console.warn(`chat message message_id is empty`);
        return false;
    }
    const message_idx = parseInt(message_id);
    if(isNaN(message_idx) || message_idx < 0 || message_idx >= chat.length) {
        console.warn(`chat message #${message_id} invalid`);
        return false;
    }

    const message : Message = chat[message_idx];
    if(!message) {
        console.error(`chat message #${message_id} not found`);
        return false;
    }

    env = env || await prepareGlobals(message_idx);

    try {
        let newContent = await evalTemplate(message.mes, env);
        if(newContent !== message.mes) {
            console.debug(`update chat message #${message_idx}:`);
            logDifference(message.mes, newContent);
        }
        message.mes = newContent;
    } catch(err) {
        console.debug(`handling chat message errors #${message.mes}`);
        console.error(err);
        return false;
    }

    const div = $(`div.mes[mesid = "${message_id}"]`);
    if(div) {
        div.find('.mes_text').
        empty().
        append(messageFormatting(message.mes, message.name, message.is_system, message.is_user, message_idx));
    }

    return true;
}

/*
async function updateMessageAll() {
    const env = await prepareGlobals(0);
    for(const message_id in chat) {
        await updateMessage(message_id, env);
    }
}
*/

export async function init() {
    eventSource.on(event_types.CHAT_COMPLETION_SETTINGS_READY, updateChat);
    eventSource.on(event_types.MESSAGE_RECEIVED, updateMessage);
    eventSource.on(event_types.MESSAGE_UPDATED, updateMessage);
    // eventSource.on(event_types.CHAT_CHANGED, updateMessageAll);

    try {
        await test();
    } catch(err) {
        console.error('test fail: ', err);
    }
}

export async function exit() {
    eventSource.removeListener(event_types.CHAT_COMPLETION_SETTINGS_READY, updateChat);
    eventSource.removeListener(event_types.MESSAGE_RECEIVED, updateMessage);
    eventSource.removeListener(event_types.MESSAGE_UPDATED, updateMessage);
    // eventSource.removeListener(event_types.CHAT_CHANGED, updateMessageAll);
}

async function test() {
    console.log('ST-Prompt-Template start test.');
    const env = await prepareGlobals();
    env.variables.name = 'world';
    console.log(await evalTemplate('Hello, <%= variables.name %>!', env));
    console.log('ST-Prompt-Template test end.');
}

