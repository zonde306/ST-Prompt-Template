// @ts-expect-error
import vm from 'vm-browserify';
import _ from 'lodash';
import { GenerateData, Message } from './defines';
import { eventSource, event_types, chat, saveChatConditional, messageFormatting } from '../../../../../script.js';
import { prepareContext, evalTemplate, getSyntaxErrorInfo, escape } from './function/ejs';
import { STATE } from './function/variables';
import { getTokenCountAsync } from '../../../../tokenizers.js';
import { extension_settings } from '../../../../extensions.js';
import { getEnabledWorldInfoEntries, selectActivatedEntries } from './function/worldinfo';
import { getCharaDefs } from './function/characters';

let runID = 0;
let isFakeRun = false;

async function updateGenerate(data: GenerateData) {
    STATE.isDryRun = false;
    const start = Date.now();

    const env = await prepareContext(65535, {
        runType: 'generate',
        runID: runID++
    });

    const before = await processSpecialEntities(env, '[GENERATE:BEFORE]');

    let prompts = before;
    for (const [idx, message] of data.messages.entries()) {
        const prompt = await evalTemplateHandler(message.content, env, `message #${idx + 1}(${message.role})`);
        if (prompt) {
            message.content = prompt;
            prompts += prompt;
        }
    }

    const after = await processSpecialEntities(env, '[GENERATE:AFTER]', prompts);
    prompts += after;

    data.messages[0].content = before + data.messages[0].content;
    data.messages[data.messages.length - 1].content += after;

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${data.messages.length} messages in ${end}ms`);

    await checkAndSave();
    updateTokens(prompts, 'send');
}

async function updateMessageRender(message_id: string, isDryRun?: boolean) {
    if (isFakeRun) return;

    STATE.isDryRun = !!isDryRun;

    const start = Date.now();

    if (message_id === '' || message_id === undefined || message_id === null) {
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

    if (isDryRun) {
        if (message?.is_initial?.[message_idx]) {
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

    let hasHTML = false;
    function escaper(markup: string): string {
        hasHTML = true;
        return messageFormatting(markup, message.name, message.is_system, message.is_user, message_idx);
    }

    const before = await processSpecialEntities(env, '[RENDER:BEFORE]', '', escaper);
    const content = html.replaceAll('&lt;%', '<%').replaceAll('%&gt;', '%>');
    let newContent = await evalTemplateHandler(content, env, `chat #${message_idx}`, escaper);

    const after = await processSpecialEntities(env, '[RENDER:AFTER]', newContent || '', escaper);
    if(newContent)
        newContent = before + newContent + after;

    // update if changed
    if (newContent && newContent !== content)
        container.empty().append(newContent);

    if (hasHTML && isDryRun) {
        isFakeRun = true;
        console.debug(`[HTML] rendering #${message_idx} messages`);
        if (message.is_user) {
            await eventSource.emit(event_types.USER_MESSAGE_RENDERED, message_idx);
        } else if (!message.is_system) {
            await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, message_idx);
        }
        isFakeRun = false;
    }

    if (!message.is_initial)
        message.is_initial = [];
    message.is_initial[message.swipe_id || 0] = true;

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing #${message_idx} messages in ${end}ms`);

    await checkAndSave();

    if (!isDryRun)
        updateTokens(container.text(), 'receive');
}

async function handlePreloadWorldInfo(chat_filename? : string) {
    if(!chat_filename) return;
    STATE.isDryRun = true;
    const start = Date.now();

    const worldInfoData = (await getEnabledWorldInfoEntries()).filter(data => !data.disable);

    const env = await prepareContext(65535, {
        runType: 'preparation',
        runID: runID++
    });

    for (const data of worldInfoData) {
        await evalTemplateHandler(data.content, env, `worldinfo ${data.world}.${data.comment}`);
    }

    const charaDef = getCharaDefs();
    if (charaDef?.description || charaDef?.scenario) {
        const content = (charaDef.description || '') + '\n---\n' + (charaDef.scenario || '');
        await evalTemplateHandler(content, env, `character ${charaDef.name}`);
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

async function checkAndSave() {
    if (STATE.isUpdated)
        await saveChatConditional();

    STATE.isUpdated = false;
}

function updateTokens(prompts: string, type: 'send' | 'receive') {
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

async function evalTemplateHandler(content: string,
    env: Record<string, unknown>,
    where: string = '',
    escaper: ((markup: string) => string) = escape):
    Promise<string | null> {
    try {
        return await evalTemplate(content, env, escaper);
    } catch (err) {
        const contentWithLines = content.split('\n').map((line, idx) => `${idx}: ${line}`).join('\n');
        console.debug(`[Prompt Template] handling ${where} errors:\n${contentWithLines}`);

        if (err instanceof SyntaxError)
            err.message += getSyntaxErrorInfo(content);

        console.error(err);

        // @ts-expect-error
        toastr.error(err.message, `EJS Error`);
    }

    return null;
}

async function processSpecialEntities(env: Record<string, unknown>, prefix : string, keywords : string = '', escaper: ((markup: string) => string) = escape) {
    const worldInfoData = selectActivatedEntries((await getEnabledWorldInfoEntries()).filter(data => data.disable && data.comment.startsWith(prefix)), keywords, true);
    let prompt = '';
    for(const data of worldInfoData) {
        const result = await evalTemplateHandler(data.content, env, `worldinfo ${data.world}.${data.comment}`, escaper);
        if(result)
            prompt += result;
    }

    return prompt;
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
