// @ts-expect-error
import vm from 'vm-browserify';
import { Message, GenerateAfterData, CombinedPromptData } from './defines';
import { eventSource, event_types, chat, messageFormatting, GenerateOptions, updateMessageBlock, substituteParams, this_chid, getCurrentChatId } from '../../../../../../script.js';
import { prepareContext } from '../function/ejs';
import { STATE, checkAndSave } from '../function/variables';
import { extension_settings } from '../../../../../extensions.js';
import { getEnabledWorldInfoEntries, applyActivateWorldInfo, deactivateActivateWorldInfo, WorldInfo as WorldInfoData, getEnabledLoreBooks } from '../function/worldinfo';
import { getCharaDefs } from '../function/characters';
import { settings } from './ui';
import { activateRegex, deactivateRegex, deactivateMessageRegex, applyMessageRegex } from '../function/regex';
import { deactivatePromptInjection } from '../function/inject';
import { updateTokens, removeHtmlTagsInsideBlock, escapePreContent, cleanPreContent, escapeReasoningBlocks, unescapePreContent } from '../utils/prompts';
import { evalTemplateHandler, processWorldinfoEntities } from '../utils/evaluate';

let runID = 0;
let isFakeRun = false;
let isDryRun = false;

// just a randomly generated value
const regexFilterUUID = "a8ff1bc7-15f2-4122-b43b-ded692560538";

async function handleGenerating(data: GenerateAfterData) {
    if(isDryRun)
        return;
    if(settings.enabled === false)
        return;

    const chat = typeof data.prompt === 'string' ? [{ role: '', content: data.prompt }] : data.prompt;

    // No longer available here
    deactivateRegex();
    deactivateActivateWorldInfo();

    if(settings.generate_enabled === false)
        return;

    STATE.isDryRun = false;
    const start = Date.now();
    console.log(`[Prompt Template] start generating ${chat.length} messages`);

    const env = await prepareContext(65535, {
        runType: 'generate',
        runID: runID++,
        message_id: undefined,
        swipe_id: undefined,
        is_last: undefined,
        is_user: undefined,
        is_system: undefined,
        name: undefined,
        isDryRun: false,
    });

    const before = settings.generate_loader_enabled === false ? '' : await processWorldinfoEntities(env, '[GENERATE:BEFORE]');

    let prompts = before;
    for (const [idx, message] of chat.entries()) {
        const beforeMessage =  settings.generate_loader_enabled === false ? '' : await processWorldinfoEntities(env, `[GENERATE:${idx}:BEFORE]`);

        if(typeof message.content === 'string') {
            const prompt = await evalTemplateHandler(
                message.content,
                env,
                `message #${idx + 1}(${message.role})`,
                {
                    options: {
                        filename: `generate/${getCurrentChatId()}/${idx}`,
                        cache: settings.cache_enabled === 1, // enable for all
                    }
                }
            );
            const afterMessage = settings.generate_loader_enabled === false ? '' : await processWorldinfoEntities(env, `[GENERATE:${idx}:AFTER]`, prompt || '');

            if (prompt != null) {
                message.content = beforeMessage + prompt + afterMessage;
                prompts += beforeMessage + prompt + afterMessage;
            }
        } else if (_.isArray(message.content)) {
            for(const content of message.content) {
                if(content.type === 'text') {
                    const prompt = await evalTemplateHandler(
                        content.text,
                        env,
                        `message #${idx + 1}(${message.role})`,
                        {
                            options: {
                                filename: `generate/${getCurrentChatId()}/${idx}`,
                                cache: settings.cache_enabled === 1, // enable for all
                            }
                        }
                    );
                    const afterMessage = settings.generate_loader_enabled === false ? '' : await processWorldinfoEntities(env, `[GENERATE:${idx}:AFTER]`, prompt || '');

                    if (prompt != null) {
                        content.text = beforeMessage + prompt + afterMessage;
                        prompts += beforeMessage + prompt + afterMessage;
                    }
                }
            }
        }
    }

    const after = settings.generate_loader_enabled === false ? '' : await processWorldinfoEntities(env, '[GENERATE:AFTER]', prompts);
    prompts += after;

    if(typeof data.prompt === 'string') {
        data.prompt = before + chat[0].content + after;
    } else {
        chat[0].content = before + chat[0].content;
        chat[chat.length - 1].content += after;
    }

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${chat.length} messages in ${end}ms`);

    await checkAndSave();
    updateTokens(prompts, 'send');

    // cleanup
    deactivateActivateWorldInfo();
    deactivateRegex();
    deactivatePromptInjection();
}

async function handleMessageRender(message_id: string, _type?: string, isDryRun?: boolean) {
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
    if (!container?.text() || !message.mes || message.mes === '...' || message.mes === message.swipes?.[message.swipe_id - 1]) {
        console.info(`chat message #${message_id}.${message.swipe_id} is generating`);
        return;
    }

    // initialize at least once
    if (isDryRun && !message?.is_ejs_processed?.[message.swipe_id || 0])
        STATE.isDryRun = isDryRun = false;
    
    const env = await prepareContext(message_idx + 1, {
        runType: 'render',
        message_id: message_idx,
        swipe_id: message.swipe_id,
        runID: runID++,
        is_last: message_idx >= chat.length - 1,
        is_user: message.is_user,
        is_system: message.is_system,
        name: message.name,
        isDryRun: isDryRun,
    });

    let hasHTML = false;
    function escaper(markup: string): string {
        hasHTML = true;
        return messageFormatting(markup, message.name, message.is_system, message.is_user, message_idx);
    }

    const before = settings.render_loader_enabled === false ? '' : await processWorldinfoEntities(env, '[RENDER:BEFORE]', '', { escaper });

    if(!isDryRun && settings.raw_message_evaluation_enabled) {
        env.runType = 'render_permanent';
        const newContent = await evalTemplateHandler(
            escapeReasoningBlocks(applyMessageRegex(message.mes)),
            env,
            `chat #${message_idx}.${message.swipe_id} raw`,
            {
                options: {
                    filename: `render_permanent/${getCurrentChatId()}/${message_id}/${message.swipe_id}`,
                    cache: false, // evaluate only once, no caching required
                }
            }
        );
        deactivateMessageRegex();
        env.runType = 'render';
        if(newContent != null) {
            // Permanent modification
            message.mes = newContent;
            updateMessageBlock(message_idx, message, { rerenderMessage: true });
        }
    }

    const html = container.html();

    // patch
    const content = settings.code_blocks_enabled === false ? escapePreContent(html) : cleanPreContent(html);
    const opts = {
        escaper,
        options: {
            openDelimiter: '&lt;',
            closeDelimiter: '&gt;',
            filename: `render/${getCurrentChatId()}/${message_id}/${message.swipe_id}`,
            cache: settings.cache_enabled === 1, // enable for all
        },
    };

    let newContent = await evalTemplateHandler(
        escapeReasoningBlocks(removeHtmlTagsInsideBlock(content), opts),
        env,
        `chat #${message_idx}.${message.swipe_id}`,
        opts
    );

    if(settings.code_blocks_enabled === false) {
        // unpatch
        newContent = unescapePreContent(newContent);
    }

    const after = settings.render_loader_enabled === false ? '' : await processWorldinfoEntities(env, '[RENDER:AFTER]', newContent || '', { escaper });
    if(newContent != null)
        newContent = before + newContent + after;

    // update if changed
    if (newContent && newContent !== content)
        container.empty().append(newContent);

    if (hasHTML && isDryRun) {
        isFakeRun = true; // prevent multiple updates
        console.debug(`[HTML] rendering #${message_idx} message`);
        if (message.is_user) {
            await eventSource.emit(event_types.USER_MESSAGE_RENDERED, message_id);
        } else if (!message.is_system) {
            await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, message_id, _type);
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
    deactivatePromptInjection();

    if(settings.preload_worldinfo_enabled === false && !force)
        return;
    if(!chat_filename && !force)
        return;

    STATE.isDryRun = true;
    const start = Date.now();

    console.log(`[Prompt Template] *** PRELOADING WORLD INFO ***`);
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
        isDryRun: true,
    });

    let prompts = '';
    console.log(`[Prompt Template] *** EVALUATING ${worldInfoData.length} WORLD INFO ***`);

    if(settings.generate_loader_enabled)
        prompts += await processWorldinfoEntities(env, '[GENERATE:BEFORE]');

    for (const data of worldInfoData) {
        prompts += await evalTemplateHandler(
            substituteParams(data.content),
            _.merge(env, { world_info: data }),
            `worldinfo ${data.world}.${data.comment}`,
            {
                options: {
                    filename: `worldinfo/${data.world}/${data.uid}-${data.comment}`,
                    cache: settings.cache_enabled === 1 || settings.cache_enabled === 2, // enable for all or worldinfo
                }
            },
        );
    }

    const charaDef = getCharaDefs();
    if (charaDef?.description || charaDef?.scenario) {
        const content = (charaDef.description || '') + '\n---\n' + (charaDef.scenario || '');
        prompts += await evalTemplateHandler(
            content,
            env,
            `character ${charaDef.name}`,
            {
                options: {
                    filename: `character/${charaDef.name}`,
                    cache: settings.cache_enabled === 1, // enable for all
                }
            }
        );
    }

    if(settings.generate_loader_enabled)
        await processWorldinfoEntities(env, '[GENERATE:AFTER]', prompts);

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${worldInfoData.length} world info in ${end}ms`);

    // avoid multiple updates
    if(chat.length > 1) {
        console.log('[Prompt Template] *** UPDATE ALL MESSAGES ***');
        for (const mes of $('div.mes[mesid]')) {
            const message_id = $(mes).attr('mesid');
            if (message_id) {
                await handleMessageRender(message_id, 'preload', true);
            }
        }
    }
}

async function handleRefreshWorldInfo(name: string, data: WorldInfoData) {
    if(settings.enabled === false)
        return;
    if(settings.preload_worldinfo_enabled === false)
        return;
    if(!this_chid)
        return;

    const start = Date.now();
    
    const enabled = getEnabledLoreBooks();
    if(!enabled.includes(name))
        return;

    const worldInfoData = Object.values(data.entries).filter(data => !data.disable);

    const env = await prepareContext(65535, {
        runType: 'preparation',
        runID: runID++,
        message_id: undefined,
        swipe_id: undefined,
        is_last: undefined,
        is_user: undefined,
        is_system: undefined,
        name: undefined,
        isDryRun: true,
    });

    let prompts = '';

    if(settings.generate_loader_enabled)
        prompts += await processWorldinfoEntities(env, '[GENERATE:BEFORE]');

    for (const data of worldInfoData) {
        prompts += await evalTemplateHandler(
            substituteParams(data.content),
            _.merge(env, { world_info: data }),
            `worldinfo ${data.world}.${data.comment}`,
            {
                options: {
                    filename: `worldinfo/${data.world}/${data.uid}-${data.comment}`,
                    cache: settings.cache_enabled === 1 || settings.cache_enabled === 2, // enable for all or worldinfo
                }
            },
        );
    }

    if(settings.generate_loader_enabled)
        await processWorldinfoEntities(env, '[GENERATE:AFTER]', prompts);

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${worldInfoData.length} world info in ${end}ms`);
}

async function handleWorldInfoActivation(_type: string, _options : GenerateOptions, dryRun: boolean) {
    if(settings.enabled === false)
        return;

    if(dryRun) return;
    await applyActivateWorldInfo(true);
}

async function handleActivator(data: GenerateAfterData) {
    if(!isDryRun)
        return;
    if(settings.enabled === false)
        return;
    if(settings.world_active_enabled === false)
        return;

    const chat = typeof data.prompt === 'string' ? [{ role: '', content: data.prompt }] : data.prompt;

    STATE.isDryRun = true;
    const start = Date.now();
    console.log(`[Prompt Template] start activator ${chat.length} messages`);

    const env = await prepareContext(65535, {
        runType: 'preparation',
        runID: runID++,
        message_id: undefined,
        swipe_id: undefined,
        is_last: undefined,
        is_user: undefined,
        is_system: undefined,
        name: undefined,
        isDryRun: true,
    });

    let prompts = settings.generate_loader_enabled === false ? '' : await processWorldinfoEntities(env, '[GENERATE:BEFORE]');
    for (const [idx, message] of chat.entries()) {
        const beforeMessage = settings.generate_loader_enabled === false ? '' : await processWorldinfoEntities(env, `[GENERATE:${idx}:BEFORE]`);

        if (typeof message.content === 'string') {
            const prompt = await evalTemplateHandler(
                message.content,
                env,
                `message #${idx + 1}(${message.role})`,
                {
                    options: {
                        filename: `generate/${getCurrentChatId()}/${idx}`,
                        cache: settings.cache_enabled === 1, // enable for all
                    }
                }
            );
            const afterMessage = settings.generate_loader_enabled === false ? '' : await processWorldinfoEntities(env, `[GENERATE:${idx}:AFTER]`, prompt || '');
            prompts += beforeMessage + (prompt || '') + afterMessage;
        } else if (_.isArray(message.content)) {
            for(const content of message.content) {
                if(content.type === 'text') {
                    const prompt = await evalTemplateHandler(
                        content.text,
                        env,
                        `message #${idx + 1}(${message.role})`,
                        {
                            options: {
                                filename: `generate/${getCurrentChatId()}/${idx}`,
                                cache: settings.cache_enabled === 1, // enable for all
                            }
                        }
                    );
                    const afterMessage = settings.generate_loader_enabled === false ? '' : await processWorldinfoEntities(env, `[GENERATE:${idx}:AFTER]`, prompt || '');
                    prompts += beforeMessage + (prompt || '') + afterMessage;
                }
            }
        }
    }

    if(settings.generate_loader_enabled)
        await processWorldinfoEntities(env, '[GENERATE:AFTER]', prompts);

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${chat.length} messages in ${end}ms`);
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

const MESSAGE_RENDER_EVENTS = [
    event_types.MESSAGE_UPDATED,
    event_types.MESSAGE_SWIPED,
    event_types.CHARACTER_MESSAGE_RENDERED,
    event_types.USER_MESSAGE_RENDERED,
    // event_types.MESSAGE_DELETED,
];

export async function init() {
    eventSource.makeFirst(event_types.CHAT_CHANGED, handlePreloadWorldInfo);
    eventSource.on(event_types.GENERATION_AFTER_COMMANDS, handleWorldInfoActivation);
    eventSource.on(event_types.GENERATION_AFTER_COMMANDS, handleFilterInstall);
    eventSource.on(event_types.WORLDINFO_UPDATED, handleRefreshWorldInfo);
    eventSource.on(event_types.GENERATE_AFTER_COMBINE_PROMPTS,
        (data: CombinedPromptData) => {
            isDryRun = data.dryRun;
            console.log(`[Prompt Template] dry run: ${isDryRun}`);
        }
    );
    eventSource.on(event_types.GENERATE_AFTER_DATA, handleActivator);
    eventSource.on(event_types.GENERATE_AFTER_DATA, handleGenerating);
    MESSAGE_RENDER_EVENTS.forEach(e => eventSource.on(e, handleMessageRender));
}

export async function exit() {
    eventSource.removeListener(event_types.CHAT_CHANGED, handlePreloadWorldInfo);
    eventSource.removeListener(event_types.GENERATION_AFTER_COMMANDS, handleWorldInfoActivation);
    eventSource.removeListener(event_types.GENERATION_AFTER_COMMANDS, handleFilterInstall);
    eventSource.removeListener(event_types.WORLDINFO_UPDATED, handleRefreshWorldInfo);
    eventSource.removeListener(event_types.GENERATE_AFTER_DATA, handleActivator);
    eventSource.removeListener(event_types.GENERATE_AFTER_DATA, handleGenerating);
    MESSAGE_RENDER_EVENTS.forEach(e => eventSource.removeListener(e, handleMessageRender));
}
