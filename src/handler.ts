// @ts-expect-error
import vm from 'vm-browserify';
import _ from 'lodash';
import { diffLines } from 'diff';
import { ChatData, Message } from './defines';
import { eventSource, event_types, chat, saveChatDebounced, messageFormatting } from '../../../../../script.js';
import { saveMetadataDebounced } from '../../../../extensions.js';
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

async function updateChat(data : ChatData) {
    const env = await prepareGlobals();

    let err = false;
    for(const message of data.chat) {
        try {
            let newContent = await evalTemplate(message.content, env);
            if(newContent !== message.content) {
                console.debug('update chat message:');
                logDifference(message.content, newContent);
            }
            message.content = newContent;
        } catch(err) {
            // console.error(`error for chat message ${message.content}`);
            console.error(err);
            err = true;
        }
    }

    if(err) return;
    saveMetadataDebounced();
    saveChatDebounced();
}

async function updateMessage(message_id : string) {
    const message_idx = parseInt(message_id);
    if(isNaN(message_idx) || message_idx < 0 || message_idx >= chat.length) {
        console.error(`message ${message_id} invalid`);
        return;
    }

    const message : Message = chat[message_idx];
    if(!message) {
        console.error(`message ${message_id} not found`);
        return;
    }

    // without current message
    const env = await prepareGlobals(message_idx);

    try {
        let newContent = await evalTemplate(message.mes, env);
        if(newContent !== message.mes) {
            console.debug('update message:');
            logDifference(message.mes, newContent);
        }
        message.mes = newContent;
    } catch(err) {
        // console.error(`error for message ${message.mes}`);
        console.error(err);
        return;
    }

    saveMetadataDebounced();
    saveChatDebounced();

    const div = $(`div.mes[mesid = "${message_id}"]`);
    if(div) {
        div.find('.mes_text').
        empty().
        append(messageFormatting(message.mes, message.name, message.is_system, message.is_user, message_idx));
    }
}

export async function init() {
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, updateChat);
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, updateMessage);
    eventSource.on(event_types.USER_MESSAGE_RENDERED, updateMessage);
    eventSource.on(event_types.CHAT_CHANGED, updateMessage);
    eventSource.on(event_types.MESSAGE_SWIPED, updateMessage);
    eventSource.on(event_types.MESSAGE_EDITED, updateMessage);

    try {
        await test();
    } catch(err) {
        console.error('test fail: ', err);
    }
}

export async function exit() {
    eventSource.removeListener(event_types.CHAT_COMPLETION_PROMPT_READY, updateChat);
    eventSource.removeListener(event_types.CHARACTER_MESSAGE_RENDERED, updateMessage);
    eventSource.removeListener(event_types.USER_MESSAGE_RENDERED, updateMessage);
    eventSource.removeListener(event_types.CHAT_CHANGED, updateMessage);
    eventSource.removeListener(event_types.MESSAGE_SWIPED, updateMessage);
    eventSource.removeListener(event_types.MESSAGE_EDITED, updateMessage);
}

async function test() {
    console.log('ST-Prompt-Template start test.');
    const env = await prepareGlobals();
    env.variables.name = 'world';
    console.log(await evalTemplate('Hello, <%= variables.name %>!', env));
    console.log('ST-Prompt-Template test end.');
}

