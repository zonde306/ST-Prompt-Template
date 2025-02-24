// @ts-expect-error
import vm from 'vm-browserify';
import _ from 'lodash';
import { diffChars } from 'diff';
import { ChatData, GenerateData, Message } from './defines';
import { eventSource, event_types, chat, saveChatConditional } from '../../../../../script.js';
import { prepareContext, evalTemplate } from './function/ejs';
import { STATE } from './function/variables';

let fullChanged = false;
let runID = 0;

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

async function checkAndSave() {
    if(STATE.isUpdated)
        await saveChatConditional();

    STATE.isUpdated = false;
}

async function updateGenerate(data : GenerateData) {
    STATE.isDryRun = false;

    const env = await prepareContext(65535, { runType: 'generate', runID: runID++ });
    for(const [idx, message] of data.messages.entries()) {
        try {
            let newContent = await evalTemplate(message.content, env);
            if(newContent !== message.content) {
                console.debug(`update generate prompt #${idx}:`);
                logDifference(message.content, newContent);
            }
            message.content = newContent;
        } catch(err) {
            console.debug(`handling prompt errors #${idx}`);
            console.error(err);
        }
    }

    await checkAndSave();
}

async function updatePromptPreparation(data: ChatData) {
    STATE.isDryRun = true;

    const env = await prepareContext(65535, { runType: 'preparation', runID: runID++ });
    for(const [idx, message] of data.chat.entries()) {
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

    if(fullChanged) {
        fullChanged = false;
        console.log('* UPDATE ALL MESSAGES *');
        for(const mes of $('div.mes[mesid]')) {
            const message_id = $(mes).attr('mesid');
            if(message_id)
                await updateMessageRender(message_id);
        }
    }

    await checkAndSave();
}

async function updateMessageRender(message_id : string) {
    STATE.isDryRun = false;

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

    const env = await prepareContext(message_idx, {
        runType: 'render',
        message_id: message_idx,
        swipe_id: message.swipe_id,
        runID: runID++,
    });
    const content = html.replaceAll('&lt;%', '<%').replaceAll('%&gt;', '%>');
    let newContent = '';
    
    try {
        newContent = await evalTemplate(content, env);
        if(newContent !== content) {
            console.debug(`update chat message #${message_idx}:`);
            logDifference(content, newContent);
        }
    } catch(err) {
        console.debug(`handling chat message errors #${content}`);
        console.error(err);
        return false;
    }

    if(newContent !== content)
        container.empty().append(newContent);

    await checkAndSave();
    return true;
}

const MESSAGE_RENDER_EVENTS = [
    event_types.MESSAGE_SWIPED,
    event_types.MESSAGE_UPDATED,
    event_types.CHARACTER_MESSAGE_RENDERED,
    event_types.USER_MESSAGE_RENDERED,
];

export async function init() {
    eventSource.on(event_types.CHAT_COMPLETION_SETTINGS_READY, updateGenerate);
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, updatePromptPreparation);
    eventSource.on(event_types.CHAT_CHANGED, () => fullChanged = true);
    MESSAGE_RENDER_EVENTS.forEach(e => eventSource.on(e, updateMessageRender));
}

export async function exit() {
    eventSource.removeListener(event_types.CHAT_COMPLETION_SETTINGS_READY, updateGenerate);
    eventSource.removeListener(event_types.CHAT_COMPLETION_PROMPT_READY, updatePromptPreparation);
    MESSAGE_RENDER_EVENTS.forEach(e => eventSource.removeListener(e, updateMessageRender));
}
