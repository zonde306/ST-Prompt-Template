// @ts-expect-error
import vm from 'vm-browserify';
import { Message, GenerateAfterData, WorldInfoLoaded } from './defines';
import { eventSource, event_types, chat, messageFormatting, GenerateOptions, updateMessageBlock, substituteParams, this_chid, getCurrentChatId, appendMediaToMessage, addCopyToCodeBlocks } from '../../../../../../script.js';
import { prepareContext } from '../function/ejs';
import { STATE, checkAndSave, clonePreviousMessage } from '../function/variables';
import { extension_settings } from '../../../../../extensions.js';
import { getEnabledWorldInfoEntries, deactivateActivateWorldInfo, LoreBook, getEnabledLoreBooks, getActivatedWIEntries, isSpecialEntry, getWorldInfoEntries, isPreprocessingEntry } from '../function/worldinfo';
import { getCharacterDefine } from '../function/characters';
import { settings } from './ui';
import { activateRegex, deactivateRegex, applyRegex } from '../function/regex';
import { deactivatePromptInjection } from '../function/inject';
import { updateTokens, removeHtmlTagsInsideBlock, escapePreContent, cleanPreContent, escapeReasoningBlocks, unescapePreContent, unescapeHtmlEntities } from '../utils/prompts';
import { evalTemplateHandler, evaluateWIEntities, evalTemplateWI } from '../utils/evaluate';
import { updateReasoningUI } from '../../../../../reasoning.js';
import { handleInjectPrompt } from '../features/inject-prompt';
import { handleInitialVariables } from '../features/initial-variables';

let runID = 0;
let isFakeRun = false; // Avoid recursive processing
let isDryRun = false; // Is it preparation stage?
let generateBefore = '';

// just a randomly generated value
const regexFilterUUID = "a8ff1bc7-15f2-4122-b43b-ded692560538";

async function handleGenerateBefore(type: string, _data: GenerateOptions, dryRun: boolean) {
    if (settings.enabled === false)
        return;

    isDryRun = dryRun;
    if (dryRun)
        return;

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
        });

        generateBefore = await evaluateWIEntities(env, { decorator: '@@generate_before', comment: '[GENERATE:BEFORE]' });
    }

    // await applyActivateWorldInfo();
}

async function handleWorldInfoLoaded(data: WorldInfoLoaded) {
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
    });

    // filter special entries
    for (let i = data.characterLore.length - 1; i >= 0; i--) {
        const entry = data.characterLore[i];
        if (isSpecialEntry(entry)) {
            data.characterLore.splice(i, 1);
            console.debug(`[Prompt Template] Remove chara lore of ${entry.world}/${entry.comment}/${entry.uid} from context when SpecialEntry`);
        } else if (isPreprocessingEntry(entry)) {
            const [ content, key, keysecondary ] = await evalTemplateWI(data.characterLore[i], env);
            data.characterLore[i] = { ...entry, content, key, keysecondary};
            console.debug(`[Prompt Template] Preprocess chara lore of ${entry.world}/${entry.comment}/${entry.uid}`);
            if(settings.debug_enabled)
                console.debug(content);
        }
    }
    for (let i = data.globalLore.length - 1; i >= 0; i--) {
        const entry = data.globalLore[i];
        if (isSpecialEntry(entry)) {
            data.globalLore.splice(i, 1);
            console.debug(`[Prompt Template] Remove global lore of ${entry.world}/${entry.comment}/${entry.uid} from context when SpecialEntry`);
        } else if (isPreprocessingEntry(entry)) {
            const [ content, key, keysecondary ] = await evalTemplateWI(data.globalLore[i], env);
            data.globalLore[i] = { ...entry, content, key, keysecondary };
            console.debug(`[Prompt Template] Preprocess global lore of ${entry.world}/${entry.comment}/${entry.uid}`);
            if(settings.debug_enabled)
                console.debug(content);
        }
    }
    for (let i = data.personaLore.length - 1; i >= 0; i--) {
        const entry = data.personaLore[i];
        if (isSpecialEntry(entry)) {
            data.personaLore.splice(i, 1);
            console.debug(`[Prompt Template] Remove persona lore of ${entry.world}/${entry.comment}/${entry.uid} from context when SpecialEntry`);
        } else if (isPreprocessingEntry(entry)) {
            const [ content, key, keysecondary ] = await evalTemplateWI(data.personaLore[i], env);
            data.personaLore[i] = { ...entry, content, key, keysecondary };
            console.debug(`[Prompt Template] Preprocess persona lore of ${entry.world}/${entry.comment}/${entry.uid}`);
            if(settings.debug_enabled)
                console.debug(content);
        }
    }
    for (let i = data.chatLore.length - 1; i >= 0; i--) {
        const entry = data.chatLore[i];
        if (isSpecialEntry(entry)) {
            data.chatLore.splice(i, 1);
            console.debug(`[Prompt Template] Remove chat lore of ${entry.world}/${entry.comment}/${entry.uid} from context when SpecialEntry`);
        } else if (isPreprocessingEntry(entry)) {
            const [ content, key, keysecondary ] = await evalTemplateWI(data.chatLore[i], env);
            data.chatLore[i] = { ...entry, content, key, keysecondary };
            console.debug(`[Prompt Template] Preprocess chat lore of ${entry.world}/${entry.comment}/${entry.uid}`);
            if(settings.debug_enabled)
                console.debug(content);
        }
    }

    // remove duplicate entry when force activate
    for (const entry of getActivatedWIEntries()) {
        let position = 'chatLore';
        let idx = data.characterLore.findIndex(e => e.world === entry.world && e.uid == entry.uid);
        if (idx > -1) {
            data.characterLore.splice(idx, 1);
            console.debug(`[Prompt Template] Remove duplicate chara lore of ${entry.world}/${entry.comment}/${entry.uid} from context when FORCE ACTIVATE WI`);
            position = 'characterLore';
        }

        idx = data.globalLore.findIndex(e => e.world === entry.world && e.uid == entry.uid);
        if (idx > -1) {
            data.globalLore.splice(idx, 1);
            console.debug(`[Prompt Template] Remove duplicate global lore of ${entry.world}/${entry.comment}/${entry.uid} from context when FORCE ACTIVATE WI`);
            position = 'globalLore';
        }

        idx = data.personaLore.findIndex(e => e.world === entry.world && e.uid == entry.uid);
        if (idx > -1) {
            data.personaLore.splice(idx, 1);
            console.debug(`[Prompt Template] Remove duplicate persona lore of ${entry.world}/${entry.comment}/${entry.uid} from context when FORCE ACTIVATE WI`);
            position = 'personaLore';
        }

        idx = data.chatLore.findIndex(e => e.world === entry.world && e.uid == entry.uid);
        if (idx > -1) {
            data.chatLore.splice(idx, 1);
            console.debug(`[Prompt Template] Remove duplicate chat lore of ${entry.world}/${entry.comment}/${entry.uid} from context when FORCE ACTIVATE WI`);
            position = 'chatLore';
        }

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
    });

    let prompts = generateBefore;
    for (const [idx, message] of chat.entries()) {
        // Before a specific message
        const beforeMessage = settings.generate_loader_enabled === false
            ? ''
            : await evaluateWIEntities(env, { comment: `[GENERATE:${idx}:BEFORE]`, entries: worldEntries });

        if (typeof message.content === 'string') { // Plain text message
            const prompt = await evalTemplateHandler(
                applyRegex(env, message.content, { generate: true, role: message.role }),
                env,
                `message #${idx + 1}(${message.role})`,
                {
                    options: {
                        filename: `generate/${getCurrentChatId()}/${idx}`,
                        cache: settings.cache_enabled === 1, // enable for all
                    }
                }
            );

            // After a specific message
            const afterMessage = settings.generate_loader_enabled === false
                ? ''
                : await evaluateWIEntities(env, { comment: `[GENERATE:${idx}:AFTER]`, content: prompt, entries: worldEntries });

            if (prompt != null) {
                message.content = beforeMessage + prompt + afterMessage;
                prompts += beforeMessage + prompt + afterMessage;
            }
        } else if (_.isArray(message.content)) { // Text mixed with attachments messages
            for (const content of message.content) {
                // OAI format
                if (content.type === 'text') {
                    const prompt = await evalTemplateHandler(
                        applyRegex(env, content.text, { generate: true, role: message.role }),
                        env,
                        `message #${idx + 1}(${message.role})`,
                        {
                            options: {
                                filename: `generate/${getCurrentChatId()}/${idx}`,
                                cache: settings.cache_enabled === 1, // enable for all
                            }
                        }
                    );

                    // After a specific message
                    const afterMessage = settings.generate_loader_enabled === false
                        ? ''
                        : await evaluateWIEntities(env, { comment: `[GENERATE:${idx}:AFTER]`, content: prompt, entries: worldEntries });

                    if (prompt != null) {
                        content.text = beforeMessage + prompt + afterMessage;
                        prompts += beforeMessage + prompt + afterMessage;
                    }
                }
            }
        }
    }

    const after = settings.generate_loader_enabled === false
        ? ''
        : await evaluateWIEntities(env, { decorator: '@@generate_after', comment: '[GENERATE:AFTER]', content: prompts, entries: worldEntries });

    prompts += after;

    if (typeof data.prompt === 'string') {
        data.prompt = generateBefore + chat[0].content + after;
    } else {
        chat[0].content = generateBefore + chat[0].content;
        chat[chat.length - 1].content += after;
    }

    if (settings.inject_loader_enabled) {
        // Inject prompt
        await handleInjectPrompt(data, env);
    }

    generateBefore = '';

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${chat.length} messages in ${end}ms`);

    await checkAndSave();
    updateTokens(prompts, 'send');

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

    if (isFakeRun) return;

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
    if (!container?.text() || !message.mes || message.mes === '...' || message.mes === message.swipes?.[message.swipe_id - 1]) {
        console.info(`[Prompt Template] chat message #${message_id}.${message.swipe_id} is generating`);
        return;
    }

    // initialize at least once
    if (isDryRun && !message?.is_ejs_processed?.[message.swipe_id || 0])
        STATE.isDryRun = isDryRun = false;

    // for Array.slice
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
    });

    function escaper(markup: string): string {
        return messageFormatting(markup, message.name, message.is_system, message.is_user, message_idx);
    }

    const worldEntries = await getEnabledWorldInfoEntries();

    const before = settings.render_loader_enabled === false
        ? ''
        : await evaluateWIEntities(env, { escaper, msgId: message_idx, decorator: '@@render_before', comment: '[RENDER:BEFORE]', entries: worldEntries });

    if (!isDryRun && settings.raw_message_evaluation_enabled) {
        env.runType = 'render_permanent';
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
                }
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
        opts
    );

    if (settings.code_blocks_enabled === false) {
        // unpatch
        newContent = unescapePreContent(newContent);
    }

    const after = settings.render_loader_enabled === false
        ? ''
        : await evaluateWIEntities(env, { escaper, msgId: message_idx, decorator: '@@render_after', comment: '[RENDER:AFTER]', content: newContent, entries: worldEntries });

    if (newContent != null)
        newContent = before + newContent + after;

    // update if changed
    if (newContent && newContent !== content) {
        container.html(newContent);
        updateReasoningUI(parent);
        addCopyToCodeBlocks(parent);
        appendMediaToMessage(message, parent);
    }

    if (newContent?.includes('<pre>') && isDryRun) {
        isFakeRun = true; // prevent multiple updates
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
    });

    await handleInitialVariables(env, worldEntries);

    let prompts = '';
    console.log(`[Prompt Template] *** EVALUATING ${enabledWorldInfo.length} WORLD INFO ***`);
    console.debug(enabledWorldInfo);

    if (settings.generate_loader_enabled)
        prompts += await evaluateWIEntities(env, { decorator: '@@generate_before', comment: '[GENERATE:BEFORE]', entries: worldEntries, preload: true });

    for (const data of enabledWorldInfo) {
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
                }
            }
        );
    }

    if (settings.generate_loader_enabled)
        await evaluateWIEntities(env, { decorator: '@@generate_after', comment: '[GENERATE:AFTER]', content: prompts, entries: worldEntries, preload: true });

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
    });

    console.debug(worldInfoData);
    await handleInitialVariables(env, await getWorldInfoEntries(world));

    let prompts = '';

    if (settings.generate_loader_enabled)
        prompts += await evaluateWIEntities(env, { decorator: '@@generate_before', comment: '[GENERATE:BEFORE]', entries: worldInfoEntries });

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

    if (settings.generate_loader_enabled)
        await evaluateWIEntities(env, { decorator: '@@generate_after', comment: '[GENERATE:AFTER]', content: prompts, entries: worldInfoEntries });

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${worldInfoData.length} world info in ${end}ms`);
}

async function handleFilterInstall(_type: string, _options: GenerateOptions, dryRun: boolean) {
    if (settings.enabled === false)
        return;
    if (dryRun)
        return;

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

async function handleCustomGenerate(data: { message: string }, generationId: string) {
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
    });

    const newContent = await evalTemplateHandler(
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
            }
        }
    );
    
    if (newContent != null) {
        data.message = newContent;
    }

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing #${generationId} custom generate in ${end}ms`);
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
    eventSource.makeFirst(event_types.CHAT_CHANGED, handlePreloadWorldInfo);
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
    eventSource.on('js_generation_before_end', handleCustomGenerate);
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
}
