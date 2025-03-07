// @ts-expect-error
import vm from 'vm-browserify';
import _ from 'lodash';
import { ChatData, GenerateData, Message } from './defines';
import { eventSource, event_types, chat, saveChatConditional, messageFormatting } from '../../../../../script.js';
import { prepareContext, evalTemplate } from './function/ejs';
import { STATE } from './function/variables';

let fullChanged = false;
let runID = 0;
let isFakeRun = false;

async function checkAndSave() {
    if (STATE.isUpdated)
        await saveChatConditional();

    STATE.isUpdated = false;
}

async function updateGenerate(data: GenerateData) {
    STATE.isDryRun = false;
    let start = Date.now();

    const env = await prepareContext(65535, {
        runType: 'generate',
        runID: runID++
    });

    for (const [idx, message] of data.messages.entries()) {
        try {
            message.content = await evalTemplate(message.content, env);
        } catch (err) {
            console.debug(`[Prompt Template] handling prompt errors #${idx}:\n${message.content}`);
            console.error(err);
        }
    }

    let end = Date.now() - start;
    console.log(`[Prompt Template] processing ${data.messages.length} messages in ${end}ms`);

    await checkAndSave();
}

async function updatePromptPreparation(data: ChatData) {
    if (!fullChanged) return;
    STATE.isDryRun = true;
    let start = Date.now();

    const env = await prepareContext(65535, {
        runType: 'preparation',
        runID: runID++
    });

    for (const [idx, message] of data.chat.entries()) {
        try {
            message.content = await evalTemplate(message.content, env);
        } catch (err) {
            console.debug(`[Prompt Template] handling prompt errors #${idx}:\n${message.content}`);
            console.error(err);
        }
    }

    fullChanged = false;
    console.log('[Prompt Template] * UPDATE ALL MESSAGES *');
    for (const mes of $('div.mes[mesid]')) {
        const message_id = $(mes).attr('mesid');
        if (message_id)
            await updateMessageRender(message_id, true);
    }

    let end = Date.now() - start;
    console.log(`[Prompt Template] processing ${data.chat.length} messages in ${end}ms`);

    await checkAndSave();
}

async function updateMessageRender(message_id: string, isDryRun?: boolean) {
    if(isFakeRun) return;

    STATE.isDryRun = !!isDryRun;

    let start = Date.now();

    if (!message_id) {
        console.warn(`chat message message_id is empty`);
        return false;
    }

    const message_idx = parseInt(message_id);
    if (isNaN(message_idx) || message_idx < 0 || message_idx >= chat.length) {
        console.warn(`chat message #${message_id} invalid`);
        return false;
    }

    const message: Message = chat[message_idx];
    if (!message) {
        console.error(`chat message #${message_id} not found`);
        return false;
    }

    const container = $(`div.mes[mesid="${message_id}"]`)?.find('.mes_text');
    const html = container?.html();
    if (!html) {
        console.warn(`chat message #${message_id} container not found`);
        return false;
    }

    // allows access to current variables without updating them
    const env = await prepareContext(message_idx + Number(!!isDryRun), {
        runType: 'render',
        message_id: message_idx,
        swipe_id: message.swipe_id,
        runID: runID++,
        is_last: message_idx === chat.length - 1,
        is_user: message.is_user,
        is_system: message.is_system,
        name: message.name,
    });
    const content = html.replaceAll('&lt;%', '<%').replaceAll('%&gt;', '%>');
    let newContent = '';
    let hasHTML = false;

    try {
        newContent = await evalTemplate(
            content,
            env,
            (markup : string) => {
                hasHTML = true;
                return messageFormatting(markup, message.name, message.is_system, message.is_user, message_idx);
            },
        );
    } catch (err) {
        console.debug(`[Prompt Template] handling chat message errors #${content}:\n${content}`);
        console.error(err);
        return false;
    }

    // update if changed
    if (newContent !== content)
        container.empty().append(newContent);

    if(hasHTML && isDryRun) {
        isFakeRun = true;
        console.debug(`[HTML] rendering #${message_idx} messages`);
        if(message.is_user) {
            await eventSource.emit(event_types.USER_MESSAGE_RENDERED, message_idx);
        } else if(!message.is_system) {
            await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, message_idx);
        }
        isFakeRun = false;
    }

    let end = Date.now() - start;
    console.log(`[Prompt Template] processing #${message_idx} messages in ${end}ms`);

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
