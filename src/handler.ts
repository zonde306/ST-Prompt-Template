// @ts-expect-error
import vm from 'vm-browserify';
import _ from 'lodash';
import { GenerateData, Message } from './defines';
import { eventSource, event_types, chat, saveChatConditional, messageFormatting } from '../../../../../script.js';
import { prepareContext, evalTemplate, getSyntaxErrorInfo } from './function/ejs';
import { STATE } from './function/variables';
import { getTokenCountAsync } from '../../../../tokenizers.js';
import { extension_settings } from '../../../../extensions.js';
import { getEnabledWorldInfoEntries } from './function/worldinfo';

let runID = 0;
let isFakeRun = false;

async function checkAndSave() {
    if (STATE.isUpdated)
        await saveChatConditional();

    STATE.isUpdated = false;
}

function updateTokens(prompts : string, type: 'send' | 'receive') {
    window.setTimeout(() => {
        getTokenCountAsync(prompts).then(count => {
            console.log(`[Prompt Template] processing ${type} result: ${count} tokens and ${prompts.length} chars`);
            switch (type) {
                case 'send':
                    // @ts-expect-error
                    extension_settings.variables.global.LAST_SEND_TOKENS = count;
                    // @ts-expect-error
                    extension_settings.variables.global.LAST_SEND_CHARS = prompts.length;
                    break;
                case 'receive':
                    // @ts-expect-error
                    extension_settings.variables.global.LAST_RECEIVE_TOKENS = count;
                    // @ts-expect-error
                    extension_settings.variables.global.LAST_RECEIVE_CHARS = prompts.length;
                    break;
            }
        });
    });
}

async function updateGenerate(data: GenerateData) {
    STATE.isDryRun = false;
    const start = Date.now();

    const env = await prepareContext(65535, {
        runType: 'generate',
        runID: runID++
    });

    let prompts = '';
    for (const [idx, message] of data.messages.entries()) {
        try {
            message.content = await evalTemplate(message.content, env);
            prompts += message.content;
        } catch (err) {
            const contentWithLines = message.content.split('\n').map((line, idx) => `${idx}: ${line}`).join('\n');
            console.debug(`[Prompt Template] handling prompt errors #${idx}:\n${contentWithLines}`);

            if(err instanceof SyntaxError)
                err.message += getSyntaxErrorInfo(message.content);

            console.error(err);

            // @ts-expect-error
            toastr.error(err.message, `EJS Error #${idx}`);
        }
    }

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${data.messages.length} messages in ${end}ms`);

    await checkAndSave();
    updateTokens(prompts, 'send');
}

async function updateMessageRender(message_id: string, isDryRun?: boolean) {
    if(isFakeRun) return;

    STATE.isDryRun = !!isDryRun;

    const start = Date.now();

    if (!message_id) {
        console.warn(`chat message message_id is empty`);
        return;
    }

    const message_idx = parseInt(message_id);
    if (isNaN(message_idx) || message_idx < 0 || message_idx >= chat.length) {
        console.warn(`chat message #${message_id} invalid`);
        return;
    }

    const message: Message = chat[message_idx];
    if (!message) {
        console.error(`chat message #${message_id} not found`);
        return;
    }

    const container = $(`div.mes[mesid="${message_id}"]`)?.find('.mes_text');
    const html = container?.html();
    if (!html) {
        console.warn(`chat message #${message_id} container not found`);
        return;
    }

    if(isDryRun) {
        if(message?.is_initial?.[message_idx]) {
            console.info(`chat message #${message_id} is initialized, skipping`);
            return;
        }
        STATE.isDryRun = isDryRun = false;
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
        const contentWithLines = content.split('\n').map((line, idx) => `${idx}: ${line}`).join('\n');
        console.debug(`[Prompt Template] handling chat message errors #${message_idx}:\n${contentWithLines}`);

        if(err instanceof SyntaxError)
            err.message += getSyntaxErrorInfo(content);

        console.error(err);

        // @ts-expect-error
        toastr.error(err.message, `EJS Error #${message_idx}`);
        return;
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

    if(!message.is_initial)
        message.is_initial = [];
    message.is_initial[message.swipe_id || 0] = true;
    
    const end = Date.now() - start;
    console.log(`[Prompt Template] processing #${message_idx} messages in ${end}ms`);

    await checkAndSave();

    if(!isDryRun)
        updateTokens(container.text(), 'receive');
}

async function handlePreloadWorldInfo() {
    STATE.isDryRun = true;
    const start = Date.now();

    const worldInfoData = (await getEnabledWorldInfoEntries()).filter(data => !data.disable);

    const env = await prepareContext(65535, {
        runType: 'preparation',
        runID: runID++
    });

    for(const data of worldInfoData) {
        try {
            await evalTemplate(data.content, env);
        } catch (err) {
            const contentWithLines = data.content.split('\n').map((line, idx) => `${idx}: ${line}`).join('\n');
            console.debug(`[Prompt Template] handling preload errors #${data.world}.${data.comment}:\n${contentWithLines}`);

            if(err instanceof SyntaxError)
                err.message += getSyntaxErrorInfo(data.content);

            console.error(err);

            // @ts-expect-error
            toastr.error(err.message, `EJS Error #${data.world}.${data.comment}`);
            return;
        }
    }

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${worldInfoData.length} world info in ${end}ms`);

    console.log('[Prompt Template] *** UPDATE ALL MESSAGES ***');
    for (const mes of $('div.mes[mesid]')) {
        const message_id = $(mes).attr('mesid');
        if (message_id) {
            await updateMessageRender(message_id, true);
        }
    }
}

const MESSAGE_RENDER_EVENTS = [
    event_types.MESSAGE_SWIPED,
    event_types.MESSAGE_UPDATED,
    event_types.CHARACTER_MESSAGE_RENDERED,
    event_types.USER_MESSAGE_RENDERED,
];

export async function init() {
    eventSource.on(event_types.CHAT_COMPLETION_SETTINGS_READY, updateGenerate);
    eventSource.on(event_types.CHAT_CHANGED, handlePreloadWorldInfo);
    MESSAGE_RENDER_EVENTS.forEach(e => eventSource.on(e, updateMessageRender));
}

export async function exit() {
    eventSource.removeListener(event_types.CHAT_COMPLETION_SETTINGS_READY, updateGenerate);
    eventSource.removeListener(event_types.CHAT_CHANGED, handlePreloadWorldInfo);
    MESSAGE_RENDER_EVENTS.forEach(e => eventSource.removeListener(e, updateMessageRender));
}
