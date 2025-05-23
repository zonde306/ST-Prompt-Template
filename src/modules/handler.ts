// @ts-expect-error
import vm from 'vm-browserify';
import { GenerateData, Message, ChatData } from './defines';
import { eventSource, event_types, chat, messageFormatting, GenerateOptions, updateMessageBlock, substituteParams } from '../../../../../../script.js';
import { prepareContext, evalTemplate, getSyntaxErrorInfo, EvalTemplateOptions } from '../function/ejs';
import { STATE, checkAndSave } from '../function/variables';
import { getTokenCountAsync } from '../../../../../tokenizers.js';
import { extension_settings } from '../../../../../extensions.js';
import { getEnabledWorldInfoEntries, selectActivatedEntries, applyActivateWorldInfo, deactivateActivateWorldInfo } from '../function/worldinfo';
import { getCharaDefs } from '../function/characters';
import { settings } from './ui';
import { activateRegex, deactivateRegex } from '../function/regex';
import { deactivatePromptInjection } from '../function/inject';

let runID = 0;
let isFakeRun = false;

// just a randomly generated value
const regexFilterUUID = "a8ff1bc7-15f2-4122-b43b-ded692560538";

async function updateGenerate(data: GenerateData) {
    if(settings.enabled === false)
        return;

    // No longer available here
    deactivateRegex();
    deactivateActivateWorldInfo();

    if(settings.generate_enabled === false)
        return;

    STATE.isDryRun = false;
    const start = Date.now();

    const env = await prepareContext(65535, {
        runType: 'generate',
        runID: runID++,
        message_id: undefined,
        swipe_id: undefined,
        is_last: undefined,
        is_user: undefined,
        is_system: undefined,
        name: undefined,
    });

    const before = settings.generate_loader_enabled === false ? '' : await processSpecialEntities(env, '[GENERATE:BEFORE]');

    let prompts = before;
    for (const [idx, message] of data.messages.entries()) {
        const beforeMessage =  settings.generate_loader_enabled === false ? '' : await processSpecialEntities(env, `[GENERATE:${idx}:BEFORE]`);

        if(typeof message.content === 'string') {
            const prompt = await evalTemplateHandler(message.content, env, `message #${idx + 1}(${message.role})`);
            const afterMessage = settings.generate_loader_enabled === false ? '' : await processSpecialEntities(env, `[GENERATE:${idx}:AFTER]`, prompt || '');

            if (prompt != null) {
                message.content = beforeMessage + prompt + afterMessage;
                prompts += beforeMessage + prompt + afterMessage;
            }
        } else if (_.isArray(message.content)) {
            for(const content of message.content) {
                if(content.type === 'text') {
                    const prompt = await evalTemplateHandler(content.text, env, `message #${idx + 1}(${message.role})`);
                    const afterMessage = settings.generate_loader_enabled === false ? '' : await processSpecialEntities(env, `[GENERATE:${idx}:AFTER]`, prompt || '');

                    if (prompt != null) {
                        content.text = beforeMessage + prompt + afterMessage;
                        prompts += beforeMessage + prompt + afterMessage;
                    }
                }
            }
        }
    }

    const after = settings.generate_loader_enabled === false ? '' : await processSpecialEntities(env, '[GENERATE:AFTER]', prompts);
    prompts += after;

    data.messages[0].content = before + data.messages[0].content;
    data.messages[data.messages.length - 1].content += after;

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${data.messages.length} messages in ${end}ms`);

    await checkAndSave();
    updateTokens(prompts, 'send');

    // cleanup
    deactivateActivateWorldInfo();
    deactivateRegex();
    deactivatePromptInjection();
}

async function updateMessageRender(message_id: string, isDryRun?: boolean) {
    if(settings.enabled === false)
        return;
    if(settings.render_enabled === false)
        return;

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
    // don't render if the message is swping (with generating)
    if (!container?.text() || message.mes === message.swipes[message.swipe_id - 1]) {
        if(message.extra?.display_text) {
            message.extra.display_text = undefined;
            updateMessageBlock(message_idx, message, { rerenderMessage: true });
        }
        console.warn(`chat message #${message_id}.${message.swipe_id} is generating`);
        return;
    }

    // initialize at least once
    if (isDryRun && !message?.is_ejs_processed?.[message.swipe_id || 0])
        STATE.isDryRun = isDryRun = false;
    
    // allows access to current variables without updating them
    const env = await prepareContext(message_idx + Number(!!isDryRun), {
        runType: 'render',
        message_id: message_idx,
        swipe_id: message.swipe_id,
        runID: runID++,
        is_last: message_idx >= chat.length - 1,
        is_user: message.is_user,
        is_system: message.is_system,
        name: message.name,
    });

    let hasHTML = false;
    function escaper(markup: string): string {
        hasHTML = true;
        return messageFormatting(markup, message.name, message.is_system, message.is_user, message_idx);
    }

    const before = settings.render_loader_enabled === false ? '' : await processSpecialEntities(env, '[RENDER:BEFORE]', '', { escaper });

    if(!isDryRun && settings.raw_message_evaluation_enabled) {
        env.runType = 'render_permanent';
        const newContent = await evalTemplateHandler(message.mes, env, `chat #${message_idx}.${message.swipe_id} raw`);
        env.runType = 'render';
        if(newContent != null) {
            if(!message.extra)
                message.extra = {};

            // only modify display content
            message.extra.display_text = newContent;
            updateMessageBlock(message_idx, message, { rerenderMessage: true });
        } else if(message.extra?.display_text) {
            message.extra.display_text = undefined;
            updateMessageBlock(message_idx, message, { rerenderMessage: true });
        }
    } else if(message.extra?.display_text) {
        message.extra.display_text = undefined;
        updateMessageBlock(message_idx, message, { rerenderMessage: true });
    }

    const html = container.html();
    const content = settings.code_blocks_enabled === false ? escapePreContent(html) : cleanPreContent(html);

    let newContent = await evalTemplateHandler(removeHtmlTagsInsideBlock(content), env, `chat #${message_idx}.${message.swipe_id}`, {
        escaper,
        options: {
            openDelimiter: '&lt;',
            closeDelimiter: '&gt;',
        },
    });

    if(settings.code_blocks_enabled === false) {
        newContent = newContent?.replace(/(<pre\b[^>]*>)([\s\S]*?)(<\/pre>)/gi, (m, p1, p2, p3) => {
            return p1 + p2.replace(/#lt#/g, '&lt;').replace(/#gt#/g, '&gt;') + p3;
        }) ?? null;
    }

    const after = settings.render_loader_enabled === false ? '' : await processSpecialEntities(env, '[RENDER:AFTER]', newContent || '', { escaper });
    if(newContent != null)
        newContent = before + newContent + after;

    // update if changed
    if (newContent && newContent !== content)
        container.empty().append(newContent);

    if (hasHTML && isDryRun) {
        isFakeRun = true; // prevent multiple updates
        console.debug(`[HTML] rendering #${message_idx} messages`);
        if (message.is_user) {
            await eventSource.emit(event_types.USER_MESSAGE_RENDERED, message_idx);
        } else if (!message.is_system) {
            await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, message_idx);
        }
        isFakeRun = false;
    }

    if (!message.is_ejs_processed)
        message.is_ejs_processed = [];
    message.is_ejs_processed[message.swipe_id || 0] = true;

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing #${message_idx} messages in ${end}ms`);

    await checkAndSave();

    if (!isDryRun)
        updateTokens(container.text(), 'receive');
}

// export for command
export async function handlePreloadWorldInfo(chat_filename? : string, force: boolean = false) {
    if(settings.enabled === false)
        return;

    // clean old content
    deactivateRegex();
    deactivateActivateWorldInfo();

    if(settings.preload_worldinfo_enabled === false && !force)
        return;
    if(!chat_filename && !force)
        return;

    STATE.isDryRun = true;
    const start = Date.now();

    const worldInfoData = (await getEnabledWorldInfoEntries()).filter(data => !data.disable);

    const env = await prepareContext(65535, {
        runType: 'preparation',
        runID: runID++,
        message_id: undefined,
        swipe_id: undefined,
        is_last: undefined,
        is_user: undefined,
        is_system: undefined,
        name: undefined,
    });

    let prompts = '';

    if(settings.generate_loader_enabled)
        prompts += await processSpecialEntities(env, '[GENERATE:BEFORE]');

    for (const data of worldInfoData) {
        prompts += await evalTemplateHandler(
            substituteParams(data.content),
            _.merge(env, { world_info: data }),
            `worldinfo ${data.world}.${data.comment}`,

            // avoid massive cache invalidations
            { options: { cache: false } },
        );
    }

    const charaDef = getCharaDefs();
    if (charaDef?.description || charaDef?.scenario) {
        const content = (charaDef.description || '') + '\n---\n' + (charaDef.scenario || '');
        prompts += await evalTemplateHandler(content, env, `character ${charaDef.name}`);
    }

    if(settings.generate_loader_enabled)
        await processSpecialEntities(env, '[GENERATE:AFTER]', prompts);

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

async function handleWorldInfoActivation(_type: string, _options : GenerateOptions, dryRun: boolean) {
    if(settings.enabled === false)
        return;

    if(dryRun) return;
    await applyActivateWorldInfo(true);
}

async function handleWorldInfoActivate(data: ChatData) {
    if(settings.enabled === false)
        return;
    if(settings.world_active_enabled === false)
        return;

    if(!data.dryRun) return;

    STATE.isDryRun = true;
    const start = Date.now();

    const env = await prepareContext(65535, {
        runType: 'preparation',
        runID: runID++,
        message_id: undefined,
        swipe_id: undefined,
        is_last: undefined,
        is_user: undefined,
        is_system: undefined,
        name: undefined,
    });

    let prompts = settings.generate_loader_enabled === false ? '' : await processSpecialEntities(env, '[GENERATE:BEFORE]');
    for (const [idx, message] of data.chat.entries()) {
        const beforeMessage = settings.generate_loader_enabled === false ? '' : await processSpecialEntities(env, `[GENERATE:${idx}:BEFORE]`);

        if (typeof message.content === 'string') {
            const prompt = await evalTemplateHandler(message.content, env, `message #${idx + 1}(${message.role})`);
            const afterMessage = settings.generate_loader_enabled === false ? '' : await processSpecialEntities(env, `[GENERATE:${idx}:AFTER]`, prompt || '');
            prompts += beforeMessage + (prompt || '') + afterMessage;
        } else if (_.isArray(message.content)) {
            for(const content of message.content) {
                if(content.type === 'text') {
                    const prompt = await evalTemplateHandler(content.text, env, `message #${idx + 1}(${message.role})`);
                    const afterMessage = settings.generate_loader_enabled === false ? '' : await processSpecialEntities(env, `[GENERATE:${idx}:AFTER]`, prompt || '');
                    prompts += beforeMessage + (prompt || '') + afterMessage;
                }
            }
        }
    }

    if(settings.generate_loader_enabled)
        await processSpecialEntities(env, '[GENERATE:AFTER]', prompts);

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${data.chat.length} messages in ${end}ms`);
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
    opt: EvalTemplateOptions = {}):
    Promise<string | null> {
    try {
        return await evalTemplate(content, env, {
            ...opt,
            logging: false,
            options: {
                strict: settings.strict_enabled ?? false,
                debug: settings.debug_enabled ?? false,
                ...(opt.options || {}),
            },
        });
    } catch (err) {
        if(settings.debug_enabled) {
            const contentWithLines = content.split('\n').map((line, idx) => `${idx}: ${line}`).join('\n');
            console.debug(`[Prompt Template] handling ${where} errors:\n${contentWithLines}`);
        }

        if (err instanceof SyntaxError)
            err.message += getSyntaxErrorInfo(content);

        console.error(err);

        // @ts-expect-error
        toastr.error(err.message, `EJS Error`);
    }

    return null;
}

async function processSpecialEntities(env: Record<string, unknown>, prefix : string, keywords : string = '', options : EvalTemplateOptions = {}) {
    const worldInfoData = selectActivatedEntries((await getEnabledWorldInfoEntries()).filter(data => data.disable && data.comment.startsWith(prefix)), keywords, true, true);
    let prompt = '';
    for(const data of worldInfoData) {
        const result = await evalTemplateHandler(
            substituteParams(data.content),
            _.merge(env, { world_info: data }),
            `worldinfo ${data.world}.${data.comment}`,
            options,
        );
        if(result != null)
            prompt += result;
    }

    return prompt;
}

async function handleFilterInstall(_type: string, _options : GenerateOptions, dryRun: boolean) {
    if(settings.enabled === false)
        return;
    if(dryRun)
        return;

    const idx = extension_settings.regex.findIndex(x => x.id === regexFilterUUID);
    if(settings.filter_message_enabled && idx === -1) {
        activateRegex('/<%(?![%])([\\s\\S]*?)(?<!%)%>/g', '', { uuid: regexFilterUUID });
        console.debug('[Prompt Template] inject regex filter');
    } else if(!settings.filter_message_enabled && idx > -1) {
        deactivateRegex(regexFilterUUID);
        console.debug('[Prompt Template] remove regex filter');
    }
}

function cleanPreContent(html : string) {
    return html.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_preMatch, preContent : string) => {
        const cleanedContent = preContent.replace(/&lt;%([\s\S]*?)%&gt;/g, (_blockMatch, content : string) => {
            return `&lt;%${content.replace(/<[^>]+>/g, '')}%&gt;`;
        });
        return `<pre>${cleanedContent}</pre>`;
    });
}

function escapePreContent(html: string) {
    return html.replace(/(<pre\b[^>]*>)([\s\S]*?)(<\/pre>)/gi, (_m, p1, p2, p3) => {
        return p1 + p2.replace(/&lt;/g, '#lt#').replace(/&gt;/g, '#gt#') + p3;
    })
}

function removeHtmlTagsInsideBlock(text: string) {
    const result = text.replace(/&lt;%((?:[^%]|%[^>])*)%&gt;/g, (_match, content : string) => {
        const cleanedContent = content.replace(/<[^>]+>/g, '');
        return `&lt;%${cleanedContent}%&gt;`;
    });
    return result;
}

const MESSAGE_RENDER_EVENTS = [
    event_types.MESSAGE_UPDATED,
    event_types.MESSAGE_SWIPED,
    event_types.CHARACTER_MESSAGE_RENDERED,
    event_types.USER_MESSAGE_RENDERED,
];

export async function init() {
    eventSource.on(event_types.CHAT_COMPLETION_SETTINGS_READY, updateGenerate);
    eventSource.on(event_types.CHAT_CHANGED, handlePreloadWorldInfo);
    eventSource.on(event_types.GENERATION_AFTER_COMMANDS, handleWorldInfoActivation);
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, handleWorldInfoActivate);
    eventSource.on(event_types.GENERATION_AFTER_COMMANDS, handleFilterInstall);
    MESSAGE_RENDER_EVENTS.forEach(e => eventSource.on(e, updateMessageRender));
}

export async function exit() {
    eventSource.removeListener(event_types.CHAT_COMPLETION_SETTINGS_READY, updateGenerate);
    eventSource.removeListener(event_types.CHAT_CHANGED, handlePreloadWorldInfo);
    eventSource.removeListener(event_types.GENERATION_AFTER_COMMANDS, handleWorldInfoActivation);
    eventSource.removeListener(event_types.CHAT_COMPLETION_PROMPT_READY, handleWorldInfoActivate);
    eventSource.removeListener(event_types.GENERATION_AFTER_COMMANDS, handleFilterInstall);
    MESSAGE_RENDER_EVENTS.forEach(e => eventSource.removeListener(e, updateMessageRender));
}
