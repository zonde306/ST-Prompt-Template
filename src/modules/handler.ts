// @ts-expect-error
import vm from 'vm-browserify';
import { Message, GenerateAfterData, WorldInfoLoaded } from './defines';
import { eventSource, event_types, chat, messageFormatting, GenerateOptions, updateMessageBlock, substituteParams, this_chid, getCurrentChatId, appendMediaToMessage, addCopyToCodeBlocks } from '../../../../../../script.js';
import { prepareContext } from '../function/ejs';
import { STATE, checkAndSave, clonePreviousMessage } from '../function/variables';
import { extension_settings } from '../../../../../extensions.js';
import { getEnabledWorldInfoEntries, deactivateActivateWorldInfo, LoreBook, getEnabledLoreBooks, getActivatedWIEntries, isSpecialEntry, getWorldInfoEntries, isPreprocessingEntry, WorldInfoEntry, isConditionFiltedEntry, isPrivateEntry } from '../function/worldinfo';
import { getCharacterDefine } from '../function/characters';
import { settings } from './ui';
import { activateRegex, deactivateRegex, applyRegex } from '../function/regex';
import { deactivatePromptInjection } from '../function/inject';
import { updateTokens, removeHtmlTagsInsideBlock, escapePreContent, cleanPreContent, escapeReasoningBlocks, unescapePreContent, unescapeHtmlEntities } from '../utils/prompts';
import { evalTemplateHandler, evaluateWIEntities, evalTemplateWI } from '../utils/evaluate';
import { updateReasoningUI } from '../../../../../reasoning.js';
import { handleInjectPrompt } from '../features/inject-prompt';
import { handleInitialVariables } from '../features/initial-variables';
import { FunctionSandbox } from '../3rdparty/vm-browserify';

let runID = 0;
let isFakeRun = false; // Avoid recursive processing
let isDryRun = false; // Is it preparation stage?
let generateBefore = '';
let generateType = '';

// just a randomly generated value
const regexFilterUUID = "a8ff1bc7-15f2-4122-b43b-ded692560538";

async function handleGenerateBefore(type: string, _data: GenerateOptions, dryRun: boolean) {
    if (settings.enabled === false)
        return;

    isDryRun = dryRun;
    if (dryRun)
        return;

    generateType = type;
    STATE.isInPlace = (type === 'swipe' || type === 'append' || type === 'continue' || type === 'appendFinal');
    console.debug(`[Prompt Template] start generate before on dryRun=${dryRun}, isInPlace=${STATE.isInPlace}`);

    deactivateRegex({ message: true });

    if (settings.generate_loader_enabled) {
        // Skip existing variables when generating in-place
        const env = await prepareContext(-1 - Number(STATE.isInPlace), {
            runType: 'generate',
            runID: runID++,
            message_id: undefined,
            swipe_id: undefined,
            is_last: undefined,
            is_user: undefined,
            is_system: undefined,
            name: undefined,
            isDryRun: false,
            generateType: generateType,
        });

        // [GENERATE:BEFORE] or @@generate_before
        const sandbox = settings.sandbox ? new FunctionSandbox() : null;
        try {
            generateBefore = await evaluateWIEntities(env, {
                decorator: '@@generate_before',
                comment: '[GENERATE:BEFORE]',
                sandbox,
            });
        } catch (error) {
            console.error('[Prompt Template] Error in generateBefore:', error);
            generateBefore = '';
            throw error;
        } finally {
            sandbox?.destroy();
        }
    } else {
        generateBefore = '';
    }

    // await applyActivateWorldInfo();
}

async function handleWorldInfoLoaded(data: WorldInfoLoaded) {
    if (settings.enabled === false)
        return;

    // for preprocessing
    const env = await prepareContext(-1 - Number(STATE.isInPlace), {
        runType: 'generate',
        runID: runID++,
        message_id: undefined,
        swipe_id: undefined,
        is_last: undefined,
        is_user: undefined,
        is_system: undefined,
        name: undefined,
        isDryRun: false,
        generateType: generateType,
    });

    const sandbox = settings.sandbox ? new FunctionSandbox() : null;
    const applyDecorators = async function(type: 'characterLore' | 'globalLore' | 'personaLore' | 'chatLore') {
        // reverse to avoid index change
        for (let i = data[type].length - 1; i >= 0; i--) {
            const entry = data[type][i];
            if (isSpecialEntry(entry)) {
                data[type].splice(i, 1);
                console.debug(`[Prompt Template] Remove ${type} of ${entry.world}/${entry.comment}/${entry.uid} from context when SpecialEntry`);
            } else if (await isConditionFiltedEntry(env, entry, { sandbox })) {
                data[type].splice(i, 1);
                console.debug(`[Prompt Template] Remove ${type} of ${entry.world}/${entry.comment}/${entry.uid} from context when ConditionFiltedEntry`);
            } else if (isPreprocessingEntry(entry)) {
                try {
                    const [ content, key, keysecondary ] = await evalTemplateWI(data[type][i], env, { sandbox });
                    data[type][i] = { ...entry, content, key, keysecondary};
                    console.debug(`[Prompt Template] Preprocess ${type} of ${entry.world}/${entry.comment}/${entry.uid}`);
                    if(settings.debug_enabled)
                        console.debug(content);
                } catch (error) {
                    console.error('[Prompt Template] Error in preprocess:', error);
                    throw error;
                } finally {
                    sandbox?.destroy();
                }
            } else if (isPrivateEntry(entry)) {
                entry.content = `<% (()=>{%>${entry.content}<%})(); %>`;
                console.debug(`[Prompt Template] Mark ${type} of ${entry.world}/${entry.comment}/${entry.uid} as private`);
            }
        }
    };

    // filter special entries
    await applyDecorators('characterLore');
    await applyDecorators('globalLore');
    await applyDecorators('personaLore');
    await applyDecorators('chatLore');

    const removeDuplicate = function(entry: WorldInfoEntry, type: 'characterLore' | 'globalLore' | 'personaLore' | 'chatLore'): string | null {
        const idx = data[type].findIndex(e => e.world === entry.world && e.uid == entry.uid);
        if (idx > -1) {
            data[type].splice(idx, 1);
            console.debug(`[Prompt Template] Remove duplicate ${type} of ${entry.world}/${entry.comment}/${entry.uid} from context when FORCE ACTIVATE WI`);
            return type;
        }

        return null;
    }

    // remove duplicate entry when force activate
    for (const entry of getActivatedWIEntries()) {
        let position = 'chatLore';
        position = removeDuplicate(entry, 'characterLore') ?? position;
        position = removeDuplicate(entry, 'globalLore') ?? position;
        position = removeDuplicate(entry, 'personaLore') ?? position;
        position = removeDuplicate(entry, 'chatLore') ?? position;

        // @ts-expect-error: 7053
        data[position].push(entry);
        console.debug(`[Prompt Template] Inject ${entry.world}/${entry.comment}/${entry.uid} to context as ${position}`);
    }
}

async function handleGenerateAfter(data: GenerateAfterData, dryRun?: boolean) {
    isDryRun = dryRun ?? isDryRun;

    if (isDryRun)
        return;

    if (settings.enabled === false)
        return;

    // OAI/non-OAI have different formats
    const chat = typeof data.prompt === 'string' ? [{ role: '', content: data.prompt }] : data.prompt;

    // Only Format Prompt
    deactivateRegex({ basic: true });
    deactivateActivateWorldInfo();

    if (settings.generate_enabled === false)
        return;

    STATE.isDryRun = false;
    const start = Date.now();
    console.log(`[Prompt Template] start generate after ${chat.length} messages`);
    const worldEntries = await getEnabledWorldInfoEntries();

    // Skip existing variables when generating in-place
    const env = await prepareContext(-1 - Number(STATE.isInPlace), {
        runType: 'generate',
        runID: runID++,
        message_id: undefined,
        swipe_id: undefined,
        is_last: undefined,
        is_user: undefined,
        is_system: undefined,
        name: undefined,
        isDryRun: false,
        generateType: generateType,
    });

    const sandbox = settings.sandbox ? new FunctionSandbox() : null;
    let collectPrompts = generateBefore;

    try {
        for (const [idx, message] of chat.entries()) {
            // [GENERATE:x:BEFORE] or @@generate_before x
            const beforeMessage = settings.generate_loader_enabled === false
                ? ''
                : await evaluateWIEntities(env, {
                    comment: `[GENERATE:${idx}:BEFORE]`,
                    decorator: `@@generate_before ${idx}`,
                    entries: worldEntries,
                    buffer: collectPrompts,
                });

            // Plain text message
            if (typeof message.content === 'string') {
                // Processing
                const prompt = await evalTemplateHandler(
                    applyRegex(env, message.content, { generate: true, role: message.role }),
                    env,
                    `message #${idx + 1}(${message.role})`,
                    {
                        options: {
                            filename: `generate/${getCurrentChatId()}/${idx}`,
                            cache: settings.cache_enabled === 1, // enable for all
                        },
                        sandbox
                    }
                );

                // [GENERATE:x:AFTER] or @@generate_after x
                const afterMessage = settings.generate_loader_enabled === false
                    ? ''
                    : await evaluateWIEntities(env, {
                        comment: `[GENERATE:${idx}:AFTER]`,
                        decorator: `@@generate_after ${idx}`,
                        content: prompt,
                        entries: worldEntries,
                        buffer: collectPrompts + beforeMessage + prompt,
                    });

                if (prompt != null) {
                    message.content = beforeMessage + prompt + afterMessage;
                    collectPrompts += beforeMessage + prompt + afterMessage;
                }
            // Text mixed with attachments messages
            } else if (_.isArray(message.content)) {
                for (const content of message.content) {
                    // OAI format
                    if (content.type === 'text') {
                        // Processing
                        const prompt = await evalTemplateHandler(
                            applyRegex(env, content.text, { generate: true, role: message.role }),
                            env,
                            `message #${idx + 1}(${message.role})`,
                            {
                                options: {
                                    filename: `generate/${getCurrentChatId()}/${idx}`,
                                    cache: settings.cache_enabled === 1, // enable for all
                                },
                                sandbox
                            }
                        );

                        // [GENERATE:x:AFTER] or @@generate_after x
                        const afterMessage = settings.generate_loader_enabled === false
                            ? ''
                            : await evaluateWIEntities(env, {
                                comment: `[GENERATE:${idx}:AFTER]`,
                                decorator: `@@generate_after ${idx}`,
                                content: prompt,
                                entries: worldEntries,
                                buffer: collectPrompts + beforeMessage + prompt,
                                sandbox,
                            });

                        if (prompt != null) {
                            content.text = beforeMessage + prompt + afterMessage;
                            collectPrompts += beforeMessage + prompt + afterMessage;
                        }
                    }
                }
            }
        }

        // [GENERATE:AFTER] or @@generate_after
        const after = settings.generate_loader_enabled === false
            ? ''
            : await evaluateWIEntities(env, {
                decorator: '@@generate_after',
                comment: '[GENERATE:AFTER]',
                content: collectPrompts,
                entries: worldEntries,
                buffer: generateBefore + collectPrompts,
                sandbox,
            });
        
        collectPrompts += after;

        if (typeof data.prompt === 'string') {
            data.prompt = generateBefore + chat[0].content + after;
        } else {
            chat[0].content = generateBefore + chat[0].content;
            chat[chat.length - 1].content += after;
        }

        if (settings.inject_loader_enabled) {
            // @INJECT xxx
            await handleInjectPrompt(data, env, { sandbox });
        }
    } catch (error) {
        console.error('[Prompt Template] Error processing prompt:', error);
        throw error;
    } finally {
        sandbox?.destroy();
    }

    generateBefore = '';

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${chat.length} messages in ${end}ms`);

    await checkAndSave();
    updateTokens(collectPrompts, 'send');

    // cleanup
    deactivateActivateWorldInfo();
    deactivateRegex({ generate: true, basic: true });
    deactivatePromptInjection();
    STATE.isInPlace = false;
}

async function handleMessageRender(message_id: string, type?: string, isDryRun?: boolean) {
    if (settings.enabled === false)
        return;
    if (settings.render_enabled === false)
        return;

    // Prevent infinite recursion
    if (isFakeRun) return;

    // Is it just a re-render?
    STATE.isDryRun = !!isDryRun;

    const start = Date.now();

    const message_idx = parseInt(message_id);
    if (isNaN(message_idx) || message_idx < 0 || message_idx >= chat.length) {
        console.warn(`[Prompt Template] chat message #${message_id} invalid`);
        return;
    }

    if(settings.depth_limit > -1 && chat.length - message_idx - 1 > settings.depth_limit) {
        console.debug(`[Prompt Template] Reached message limit ${settings.depth_limit} of message ${message_id}`);
        return;
    }

    const message: Message = chat[message_idx];
    if (!message) {
        console.error(`[Prompt Template] chat message #${message_id} not found`);
        return;
    }

    const parent = $(`div.mes[mesid="${message_id}"]`);
    const container = parent?.find('.mes_text');
    // don't render if the message is swping (with generating)
    if (!container?.text() || !message.mes || message.mes === '...' || message.mes === message.swipes?.[message.swipe_id! - 1]) {
        console.info(`[Prompt Template] chat message #${message_id}.${message.swipe_id} is generating`);
        return;
    }

    // initialize at least once
    if (isDryRun && !message?.is_ejs_processed?.[message.swipe_id || 0])
        STATE.isDryRun = isDryRun = false;

    const env = await prepareContext(message_idx, {
        runType: 'render',
        message_id: message_idx,
        swipe_id: message.swipe_id,
        runID: runID++,
        is_last: message_idx >= chat.length - 1,
        is_user: message.is_user,
        is_system: message.is_system,
        name: message.name,
        isDryRun: isDryRun,
        generateType: '',
    });

    // Use messageFormatting to convert the content into HTML code within `<%= ... %>`
    function escaper(markup: string): string {
        return messageFormatting(markup, message.name ?? '', !!message.is_system, !!message.is_user, message_idx);
    }

    const worldEntries = await getEnabledWorldInfoEntries();
    const sandbox = settings.sandbox ? new FunctionSandbox() : null;
    let newContent = null;
    let content = null;

    try {
        // [RENDER:BEFORE] or @@render_before
        const before = settings.render_loader_enabled === false
            ? ''
            : await evaluateWIEntities(env, {
                escaper,
                msgId: message_idx,
                decorator: '@@render_before',
                comment: '[RENDER:BEFORE]',
                entries: worldEntries,
                sandbox
            });

        if (!isDryRun && settings.raw_message_evaluation_enabled) {
            env.runType = 'render_permanent';
            // Execute and overwrite the original message, avoiding secondary execution.
            const newContent = await evalTemplateHandler(
                escapeReasoningBlocks(applyRegex(
                    env,
                    message.mes,
                    {
                        message: true,
                        user: message.is_user,
                        assistant: !message.is_user && !message.is_system,
                        system: message.is_system,
                        depth: chat.length - message_idx - 1,
                        before: true,
                        after: false,
                        html: false,
                    }
                )),
                env,
                `chat #${message_idx}.${message.swipe_id} raw`,
                {
                    options: {
                        filename: `render_permanent/${getCurrentChatId()}/${message_id}/${message.swipe_id}`,
                        cache: false, // evaluate only once, no caching required
                    },
                    sandbox
                }
            );
            env.runType = 'render';
            if (newContent != null) {
                // Permanent modification
                message.mes = newContent;
                updateMessageBlock(message_idx, message, { rerenderMessage: true });
            }
        }

        const html = container.html();

        // Patch the code within the `<pre>` tags by deleting or escaping it.
        content = settings.code_blocks_enabled === false ? escapePreContent(html) : cleanPreContent(html);

        const opts = {
            escaper,
            options: {
                openDelimiter: '&lt;',
                closeDelimiter: '&gt;',
                filename: `render/${getCurrentChatId()}/${message_id}/${message.swipe_id}`,
                cache: settings.cache_enabled === 1, // enable for all
            },
        };

        newContent = await evalTemplateHandler(
            escapeReasoningBlocks(unescapeHtmlEntities(removeHtmlTagsInsideBlock(applyRegex(
                env,
                content,
                {
                    message: true,
                    user: message.is_user,
                    assistant: !message.is_user && !message.is_system,
                    system: message.is_system,
                    worldinfo: false,
                    depth: chat.length - message_idx - 1,
                    before: false,
                    html: true,
                }
            ))),
                opts
            ),
            env,
            `chat #${message_idx}.${message.swipe_id}`,
            { ...opts, sandbox }
        );

        if (settings.code_blocks_enabled === false) {
            // Undo changes to the code within the `<pre>` tags.
            newContent = unescapePreContent(newContent);
        }

        // [RENDER:AFTER] or @@render_after
        const after = settings.render_loader_enabled === false
            ? ''
            : await evaluateWIEntities(env, {
                escaper,
                msgId: message_idx,
                decorator: '@@render_after',
                comment: '[RENDER:AFTER]',
                content: newContent,
                entries: worldEntries,
                sandbox,
            });

        if (newContent != null)
            newContent = before + newContent + after;
    } catch(error) {
        console.error(`Error processing message #${message_idx}:`, error);
        newContent = null;
    } finally {
        sandbox?.destroy();
    }

    // update if changed
    if (newContent && newContent !== content) {
        container.html(newContent);
        updateReasoningUI(parent);
        addCopyToCodeBlocks(parent);
        appendMediaToMessage(message, parent);
    }

    // Because the `<pre>` tag has been modified, and other extensions need to access it, a re-rendering is required to display the new content.
    if (newContent?.includes('<pre>') && isDryRun) {
        isFakeRun = true; // Prevent infinite recursion
        console.debug(`[HTML] rendering #${message_idx} message`);
        if (message.is_user) {
            await eventSource.emit(event_types.USER_MESSAGE_RENDERED, message_id);
        } else if (!message.is_system) {
            await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, message_id, type);
        }
        isFakeRun = false;
    }

    if (!message.is_ejs_processed)
        message.is_ejs_processed = [];
    message.is_ejs_processed[message.swipe_id || 0] = true;

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing #${message_idx} messages in ${end}ms`);

    if (!isDryRun) {
        await checkAndSave();
        updateTokens(container.text(), 'receive');
    }
}

// export for command
export async function handlePreloadWorldInfo(chat_filename?: string, force: boolean = false) {
    if (settings.enabled === false)
        return;

    // Complete cleanup
    deactivateRegex({ basic: true, message: true, generate: true }, 999);
    deactivateActivateWorldInfo();
    deactivatePromptInjection(999);

    if (settings.preload_worldinfo_enabled === false && !force)
        return;
    if (!chat_filename && !force)
        return;

    STATE.isDryRun = true;
    const start = Date.now();

    console.log(`[Prompt Template] *** PRELOADING WORLD INFO ***`);
    const worldEntries = await getEnabledWorldInfoEntries();
    const enabledWorldInfo = worldEntries
        .filter(data =>
            !data.disable &&
            !data.decorators.includes('@@dont_preload') &&
            !isSpecialEntry(data, true)
        );

    const env = await prepareContext(-1, {
        runType: 'preparation',
        runID: runID++,
        message_id: undefined,
        swipe_id: undefined,
        is_last: undefined,
        is_user: undefined,
        is_system: undefined,
        name: undefined,
        isDryRun: true,
        generateType: '',
    });

    const sandbox = settings.sandbox ? new FunctionSandbox() : null;

    try {
        await handleInitialVariables(env, worldEntries, { sandbox });

        let prompts = '';
        console.log(`[Prompt Template] *** EVALUATING ${enabledWorldInfo.length} WORLD INFO ***`);
        console.debug(enabledWorldInfo);

        // Although it's not currently being generated, some work items require it.
        // [GENERATE:BEFORE] or @@generate_before
        if (settings.generate_loader_enabled) {
            prompts += await evaluateWIEntities(
                env,
                {
                    decorator: '@@generate_before',
                    comment: '[GENERATE:BEFORE]',
                    entries: worldEntries, preload: true,
                    sandbox,
                }
            );
        }

        for (const data of enabledWorldInfo) {
            prompts += await evalTemplateHandler(
                substituteParams(data.content),
                _.merge(env, { world_info: data }),
                `worldinfo ${data.world}.${data.comment}`,
                {
                    options: {
                        filename: `worldinfo/${data.world}/${data.uid}-${data.comment}`,
                        cache: settings.cache_enabled === 1 || settings.cache_enabled === 2, // enable for all or worldinfo
                    },
                    sandbox
                },
            );
        }

        const charaDef = getCharacterDefine();
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
                    },
                    sandbox
                }
            );
        }

        // [GENERATE:AFTER] or @@generate_after
        if (settings.generate_loader_enabled) {
            await evaluateWIEntities(
                env,
                {
                    decorator: '@@generate_after',
                    comment: '[GENERATE:AFTER]',
                    content: prompts,
                    entries: worldEntries,
                    preload: true,
                    sandbox,
                });
        }
    } catch(error) {
        console.error('[Prompt Template] Error processing world info:', error);
        throw error;
    } finally {
        sandbox?.destroy();
    }

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${enabledWorldInfo.length} world info in ${end}ms`);

    // avoid multiple updates
    if (chat.length > 1) {
        console.log('[Prompt Template] *** UPDATE ALL MESSAGES ***');
        for (const mes of $('div.mes[mesid]')) {
            const message_id = $(mes).attr('mesid');
            if (message_id) {
                await handleMessageRender(message_id, 'preload', true);
            }
        }
    }
}

async function handleRefreshWorldInfo(world: string, _data: LoreBook) {
    if (settings.enabled === false)
        return;
    if (settings.preload_worldinfo_enabled === false)
        return;
    if (!this_chid)
        return;

    const start = Date.now();
    console.log(`[Prompt Template] *** REFRESHING WORLD INFO: ${world} ***`);

    const enabled = getEnabledLoreBooks();
    if (!enabled.includes(world))
        return;

    const worldInfoEntries = await getWorldInfoEntries(world);
    console.debug(worldInfoEntries);

    const worldInfoData = worldInfoEntries
        .filter(data =>
            !data.disable &&
            !data.decorators.includes('@@dont_preload') &&
            !isSpecialEntry(data, true)
        );
    
    const env = await prepareContext(-1, {
        runType: 'preparation',
        runID: runID++,
        message_id: undefined,
        swipe_id: undefined,
        is_last: undefined,
        is_user: undefined,
        is_system: undefined,
        name: undefined,
        isDryRun: true,
        generateType: '',
    });

    const sandbox = settings.sandbox ? new FunctionSandbox() : null;

    try {
        await handleInitialVariables(env, await getWorldInfoEntries(world), { sandbox });

        let prompts = '';

        if (settings.generate_loader_enabled) {
            prompts += await evaluateWIEntities(
                env,
                {
                    decorator: '@@generate_before',
                    comment: '[GENERATE:BEFORE]',
                    entries: worldInfoEntries,
                    sandbox,
                }
            );
        }

        for (const data of worldInfoData) {
            prompts += await evalTemplateHandler(
                substituteParams(data.content),
                _.merge(env, { world_info: data }),
                `worldinfo ${data.world}.${data.comment}`,
                {
                    options: {
                        filename: `worldinfo/${data.world}/${data.uid}-${data.comment}`,
                        cache: settings.cache_enabled === 1 || settings.cache_enabled === 2, // enable for all or worldinfo
                    },
                    sandbox
                },
            );
        }

        if (settings.generate_loader_enabled) {
            await evaluateWIEntities(
                env,
                {
                    decorator: '@@generate_after',
                    comment: '[GENERATE:AFTER]',
                    content: prompts,
                    entries: worldInfoEntries,
                    sandbox,
                }
            );
        }
    } catch(error) {
        console.error('[Prompt Template] Error processing world info:', error);
        throw error;
    } finally {
        sandbox?.destroy();
    }

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${worldInfoData.length} world info in ${end}ms`);
}

async function handleFilterInstall(_type: string, _options: GenerateOptions, dryRun: boolean) {
    if (settings.enabled === false)
        return;
    if (dryRun)
        return;

    // Remove all `<% ... %>` blocks from the chat messages.
    const idx = extension_settings.regex.findIndex(x => x.id === regexFilterUUID);
    if (settings.filter_message_enabled && idx === -1) {
        activateRegex('/<%(?![%])([\\s\\S]*?)(?<!%)%>/g', '', { uuid: regexFilterUUID });
        console.debug('[Prompt Template] inject regex filter');
    } else if (!settings.filter_message_enabled && idx > -1) {
        deactivateRegex({ uuid: regexFilterUUID });
        console.debug('[Prompt Template] remove regex filter');
    }
}

async function handleMessageCreated(message_id: number, type?: string) {
    if(type === 'append' ||
        type === 'continue' ||
        type === 'appendFinal' ||
        type === 'first_message' ||
        type === 'impersonate')
        return;
    
    clonePreviousMessage(message_id);
}

async function handleCustomGenerated(data: { message: string }, generationId: string) {
    if (settings.enabled === false)
        return;
    if (settings.render_enabled === false)
        return;
    if(settings.raw_message_evaluation_enabled === false)
        return;

    const start = Date.now();

    const env = await prepareContext(undefined, {
        runID: runID++,
        message_id: undefined,
        swipe_id: undefined,
        is_last: undefined,
        is_user: undefined,
        is_system: undefined,
        name: undefined,
        isDryRun: false,
        generateType: 'custom',
    });

    let newContent = null;
    const sandbox = settings.sandbox ? new FunctionSandbox() : null;
    try {
        newContent = await evalTemplateHandler(
            escapeReasoningBlocks(applyRegex(
                env,
                data.message,
                {
                    message: true,
                    user: false,
                    assistant: true,
                    system: false,
                    depth: 0,
                    before: true,
                    after: false,
                    html: false,
                }
            )),
            env,
            `custom #${generationId}`,
            {
                options: {
                    filename: `custom/${getCurrentChatId()}`,
                    cache: false, // evaluate only once, no caching required
                },
                sandbox,
            }
        );
    } catch(error) {
        console.error('[Prompt Template] Error processing custom generate:', error);
        throw error;
    } finally {
        sandbox?.destroy();
    }
    
    if (newContent != null) {
        data.message = newContent;
    }

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing #${generationId} custom generate in ${end}ms`);
}

async function handleSwipeDeleted(messageId: number, swipeId: number) {
    // comparing `undefined` with any other type always returns false, so there shouldn't be any errors.
    const message = chat[messageId] as Message;
    // @ts-expect-error: 18048
    if(message?.variables?.length > message?.swipes?.length) {
        message.variables?.splice(swipeId, 1);
    }
    if(message?.variables_initialized?.[swipeId])
        message.variables_initialized = message.variables_initialized.splice(swipeId, 1);
    if(message?.is_ejs_processed?.[swipeId])
        message.is_ejs_processed = message.is_ejs_processed.splice(swipeId, 1);
}

const MESSAGE_RENDER_EVENTS = [
    event_types.MESSAGE_UPDATED,
    event_types.MESSAGE_SWIPED,
    // event_types.CHARACTER_MESSAGE_RENDERED,
    event_types.USER_MESSAGE_RENDERED,
    // event_types.MESSAGE_DELETED,
];

const MESSAGE_CREATED = [
    event_types.MESSAGE_SENT,
    event_types.MESSAGE_RECEIVED,
    event_types.MESSAGE_SWIPED,
];

export async function init() {
    eventSource.makeLast(event_types.CHAT_CHANGED, handlePreloadWorldInfo);
    eventSource.on(event_types.GENERATION_AFTER_COMMANDS, handleFilterInstall);
    eventSource.on(event_types.WORLDINFO_UPDATED, handleRefreshWorldInfo);
    eventSource.on(event_types.GENERATION_AFTER_COMMANDS, handleGenerateBefore);
    eventSource.on(event_types.GENERATE_AFTER_DATA, handleGenerateAfter);
    MESSAGE_RENDER_EVENTS.forEach(e => eventSource.on(e, handleMessageRender));
    eventSource.on(event_types.WORLDINFO_ENTRIES_LOADED, handleWorldInfoLoaded);
    MESSAGE_CREATED.forEach(e => eventSource.on(e, handleMessageCreated));

    // REQUIRED BY: https://discord.com/channels/1291925535324110879/1374352724245614662/1418480720682287197
    eventSource.makeFirst(event_types.CHARACTER_MESSAGE_RENDERED, handleMessageRender);

    // compatible with https://github.com/N0VI028/JS-Slash-Runner/blob/b07d3e78ce75b541ce0ead3ba3c92acbb99ad59e/src/function/generate/responseGenerator.ts#L156
    eventSource.on('js_generation_before_end', handleCustomGenerated);

    eventSource.on(event_types.MESSAGE_SWIPE_DELETED, handleSwipeDeleted);
}

export async function exit() {
    eventSource.removeListener(event_types.CHAT_CHANGED, handlePreloadWorldInfo);
    eventSource.removeListener(event_types.WORLDINFO_UPDATED, handleRefreshWorldInfo);
    eventSource.removeListener(event_types.GENERATION_AFTER_COMMANDS, handleGenerateBefore);
    eventSource.removeListener(event_types.GENERATE_AFTER_DATA, handleGenerateAfter);
    MESSAGE_RENDER_EVENTS.forEach(e => eventSource.removeListener(e, handleMessageRender));
    eventSource.removeListener(event_types.WORLDINFO_ENTRIES_LOADED, handleWorldInfoLoaded);
    MESSAGE_CREATED.forEach(e => eventSource.removeListener(e, handleMessageCreated));
    eventSource.removeListener(event_types.CHARACTER_MESSAGE_RENDERED, handleMessageRender);
    eventSource.removeListener(event_types.MESSAGE_SWIPE_DELETED, handleSwipeDeleted);
}
