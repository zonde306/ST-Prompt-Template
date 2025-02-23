// @ts-expect-error
import vm from 'vm-browserify';
import _ from 'lodash';
import { diffChars } from 'diff';
import { GenerateData, Message } from './defines';
import { eventSource, event_types, chat } from '../../../../../script.js';
import { prepareGlobals, evalTemplate } from './function/ejs';

function logDifference(a : string, b : string, unchanged : boolean = false) {
    const diff = diffChars(a, b);
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

async function updateChatPrompt(data : GenerateData) {
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

async function updateMessageRender(message_id : string, env? : Record<string, unknown>) {
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

    const container = $(`div.mes[mesid="${message_id}"]`)?.find('.mes_text');
    const html = container?.html();
    if(!html) {
        console.warn(`chat message #${message_id} container not found`);
        return false;
    }

    env = env || await prepareGlobals(message_idx);
    const content = html.replaceAll('&lt;%', '<%').replaceAll('%&gt;', '%>');
    let newContent = '';
    
    try {
        newContent = await evalTemplate(content, env);
        if(newContent !== content) {
            console.debug(`update chat message #${message_idx}:`);
            logDifference(content, newContent);
        }
    } catch(err) {
        console.debug(`handling chat message errors #${message.mes}`);
        console.error(err);
        return false;
    }

    if(newContent !== content)
        container.empty().append(newContent);

    return true;
}

const MESSAGE_RENDER_EVENTS = [
    event_types.MESSAGE_SWIPED,
    event_types.MESSAGE_UPDATED,
    event_types.CHARACTER_MESSAGE_RENDERED,
    event_types.USER_MESSAGE_RENDERED,
];

export async function init() {
    eventSource.on(event_types.CHAT_COMPLETION_SETTINGS_READY, updateChatPrompt);
    MESSAGE_RENDER_EVENTS.forEach(e => eventSource.on(e, updateMessageRender));
}

export async function exit() {
    eventSource.removeListener(event_types.CHAT_COMPLETION_SETTINGS_READY, updateChatPrompt);
    MESSAGE_RENDER_EVENTS.forEach(e => eventSource.removeListener(e, updateMessageRender));
}
