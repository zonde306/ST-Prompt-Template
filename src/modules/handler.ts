// @ts-expect-error
import vm from 'vm-browserify';
import { Message, GenerateAfterData, CombinedPromptData } from './defines';
import { eventSource, event_types, chat, messageFormatting, GenerateOptions, updateMessageBlock, substituteParams, this_chid, getCurrentChatId, appendMediaToMessage, addCopyToCodeBlocks } from '../../../../../../script.js';
import { prepareContext } from '../function/ejs';
import { STATE, checkAndSave } from '../function/variables';
import { extension_settings } from '../../../../../extensions.js';
import { getEnabledWorldInfoEntries, applyActivateWorldInfo, deactivateActivateWorldInfo, WorldInfo as WorldInfoData, getEnabledLoreBooks } from '../function/worldinfo';
import { getCharaDefs } from '../function/characters';
import { settings } from './ui';
import { activateRegex, deactivateRegex, applyRegex } from '../function/regex';
import { deactivatePromptInjection } from '../function/inject';
import { updateTokens, removeHtmlTagsInsideBlock, escapePreContent, cleanPreContent, escapeReasoningBlocks, unescapePreContent } from '../utils/prompts';
import { evalTemplateHandler, processWorldinfoEntities } from '../utils/evaluate';
import { updateReasoningUI } from '../../../../../reasoning.js';

let runID = 0;
let isFakeRun = false;
let isDryRun = false;

// just a randomly generated value
const regexFilterUUID = "a8ff1bc7-15f2-4122-b43b-ded692560538";

async function handleGenerating(data: GenerateAfterData) {
    if (isDryRun)
        return;
    if (settings.enabled === false)
        return;

    const chat = typeof data.prompt === 'string' ? [{ role: '', content: data.prompt }] : data.prompt;

    // No longer available here
    deactivateRegex({ basic: true });
    deactivateActivateWorldInfo();

    if (settings.generate_enabled === false)
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
        const beforeMessage = settings.generate_loader_enabled === false ? '' : await processWorldinfoEntities(env, `[GENERATE:${idx}:BEFORE]`);

        if (typeof message.content === 'string') {
            const prompt = await evalTemplateHandler(
                applyRegex.call(env, message.content, { generate: true }, { role: message.role, worldinfo: false }),
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
            for (const content of message.content) {
                if (content.type === 'text') {
                    const prompt = await evalTemplateHandler(
                        applyRegex.call(env, content.text, { generate: true }, { role: message.role, worldinfo: false }),
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

    if (typeof data.prompt === 'string') {
        data.prompt = before + chat[0].content + after;
    } else {
        chat[0].content = before + chat[0].content;
        chat[chat.length - 1].content += after;
    }

    // Inject prompt
    // TODO: Colddown and sticky
    if (settings.generate_loader_enabled !== false) {
        // get All INJECT 世界书条目（只获取关闭的条目）
        const injectWorldInfoData = (await getEnabledWorldInfoEntries()).filter(x => x.comment.startsWith('@INJECT') && x.disable);
        if (injectWorldInfoData && injectWorldInfoData.length > 0) {
            console.log('[Prompt Template] Found inject entries:', injectWorldInfoData.length);
            
            // probability simulation: filter out non-triggered entries
            const triggeredEntries: any[] = [];
            for (const entry of injectWorldInfoData) {
                if (entry.useProbability) {
                    // generate a random number between 1 and 100
                    const randomValue = Math.floor(Math.random() * 100) + 1;
                    if (randomValue <= entry.probability) {
                        triggeredEntries.push(entry);
                        console.log(`[Prompt Template] Probability triggered: ${entry.comment} (${entry.probability}% chance, rolled ${randomValue})`);
                    } else {
                        console.log(`[Prompt Template] Probability failed: ${entry.comment} (${entry.probability}% chance, rolled ${randomValue})`);
                    }
                } else {
                    // entries without probability are added directly
                    triggeredEntries.push(entry);
                }
            }
            
            console.log(`[Prompt Template] After probability check: ${triggeredEntries.length}/${injectWorldInfoData.length} entries triggered`);
            
            // use triggered entries
            const finalInjectWorldInfoData = triggeredEntries;
            

            // define inject type
            interface InjectInstruction {
                type: 'pos' | 'target' | 'regex';
                role: 'user' | 'assistant' | 'system';
                content: string;
                originalData: any;
                order: number;  // order worldinfo parameter for sorting
                // pos parameters
                pos?: number;
                // target parameters
                target?: string;
                targetIndex?: number;
                targetAt?: 'before' | 'after';
                // regex parameters
                regex?: string;
                regexAt?: 'before' | 'after';
            }

            // get inject instructions
            const injectInstructions: InjectInstruction[] = [];

            for (const worldInfo of finalInjectWorldInfoData) {
                const comment = worldInfo.comment;

                // get role
                const roleMatch = comment.match(/role=(\w+)/);
                const roleRaw = roleMatch ? roleMatch[1] : 'system';
                const role: 'user' | 'assistant' | 'system' = (roleRaw === 'user' || roleRaw === 'assistant' || roleRaw === 'system') ? roleRaw : 'system';

                // evaluate content
                const content = await evalTemplateHandler(
                    applyRegex.call(env, substituteParams(worldInfo.content), { generate: true }, { role: role, worldinfo: false }),
                    _.merge(env, { world_info: worldInfo }),
                    `inject ${worldInfo.world}.${worldInfo.comment}`,
                    {
                        options: {
                            filename: `inject/${worldInfo.world}/${worldInfo.uid}-${worldInfo.comment}`,
                            cache: settings.cache_enabled === 1,
                        }
                    }
                );

                if (content == null || !content.trim()) {
                    console.warn(`[Prompt Template] Empty inject content: ${comment} from`, worldInfo);
                    continue;
                }

                // mode 1: pos inject
                const posMatch = comment.match(/pos=(\d+)/);
                if (posMatch) {
                    const pos = parseInt(posMatch[1]);
                    injectInstructions.push({
                        type: 'pos',
                        pos: pos,
                        role: role,
                        content: content,
                        order: worldInfo.order || 0,
                        originalData: worldInfo
                    });
                    console.log(`[Prompt Template] Parsed pos inject: pos=${pos}, role=${role}, order=${worldInfo.order || 0}, content=${content}`);
                    continue;
                }

                // mode 2: target inject
                const targetMatch = comment.match(/target=(\w+)/);
                if (targetMatch) {
                    const target = targetMatch[1];
                    const indexMatch = comment.match(/index=(-?\d+)/);
                    const atMatch = comment.match(/at=(before|after)/);

                    injectInstructions.push({
                        type: 'target',
                        target: target,
                        targetIndex: indexMatch ? parseInt(indexMatch[1]) : 1,
                        targetAt: atMatch ? atMatch[1] as 'before' | 'after' : 'before',
                        role: role,
                        content: content,
                        order: worldInfo.order || 0,
                        originalData: worldInfo
                    });
                    console.log(`[Prompt Template] Parsed target inject: target=${target}, index=${indexMatch ? indexMatch[1] : 1}, at=${atMatch ? atMatch[1] : 'before'}, role=${role}, order=${worldInfo.order || 0}, content=${content}`);
                    continue;
                }

                // mode 3: regex inject
                // support: regex='pattern', regex="pattern", or regex=pattern
                const regexMatch = comment.match(/regex=(?:"([^"]*)"|'([^']*)'|(\S+))/);
                if (regexMatch) {
                    const regexRaw = regexMatch[1] || regexMatch[2] || regexMatch[3];
                    if (!regexRaw) {
                        console.warn(`[Prompt Template] Empty regex pattern: ${comment}`);
                        continue;
                    }

                    // remove double quotes or single quotes (if exist)
                    const regex = regexRaw.replace(/^["']|["']$/g, '');
                    const atMatch = comment.match(/at=(before|after)/);

                    injectInstructions.push({
                        type: 'regex',
                        regex: regex,
                        regexAt: atMatch ? atMatch[1] as 'before' | 'after' : 'before',
                        role: role,
                        content: content,
                        order: worldInfo.order || 0,
                        originalData: worldInfo
                    });
                    console.log(`[Prompt Template] Parsed regex inject: regex=${regex}, at=${atMatch ? atMatch[1] : 'before'}, role=${role}, order=${worldInfo.order || 0}, content=${content}`);
                    continue;
                }

                // Invalid inject format
                console.warn(`[Prompt Template] Invalid inject format: ${comment} from`, worldInfo);
            }

            // group by type and output statistics
            const posInstructions = injectInstructions.filter(i => i.type === 'pos');
            const targetInstructions = injectInstructions.filter(i => i.type === 'target');
            const regexInstructions = injectInstructions.filter(i => i.type === 'regex');

            console.log(`[Prompt Template] Injection instructions parsed:`);
            console.log(`  - pos mode: ${posInstructions.length}`);
            console.log(`  - target mode: ${targetInstructions.length}`);
            console.log(`  - regex mode: ${regexInstructions.length}`);
            console.log(`  - total: ${injectInstructions.length}`);

            // implement specific injection logic
            if (injectInstructions.length > 0) {
                console.log('[Prompt Template] Starting injection process...');
                // @ts-ignore
                const promptArraylog = Array.from(data.prompt) as Array<{
                    role: string,
                    content: string,
                    original_index?: number,
                    role_specific_index?: number
                }>;
                console.log('[Prompt Template] data before injection:', promptArraylog);

                // @ts-ignore
                const promptArray = Array.from(data.prompt) as Array<{
                    role: string,
                    content: string,
                    original_index?: number,
                    role_specific_index?: number
                }>;

                // assign original_index and role_specific_index
                let user_next_index = 1;
                let assistant_next_index = 1;
                let system_next_index = 1;
                for (let i = 0; i < promptArray.length; i++) {
                    promptArray[i].original_index = i + 1; // 1-based index
                    switch (promptArray[i].role) {
                        case 'user':
                            promptArray[i].role_specific_index = user_next_index;
                            user_next_index++;
                            break;
                        case 'assistant':
                            promptArray[i].role_specific_index = assistant_next_index;
                            assistant_next_index++;
                            break;
                        case 'system':
                            promptArray[i].role_specific_index = system_next_index;
                            system_next_index++;
                            break;
                    }
                }

                // create a unified queue with absolute position
                const positionBasedQueue: Array<{ instruction: InjectInstruction; finalPos: number }> = [];

                // parse 'target' instructions
                for (const instruction of targetInstructions) {
                    // default target index is 1
                    let targetOccurrence = instruction.targetIndex || 1;

                    if (targetOccurrence < 0) {
                        const totalCount = promptArray.filter(msg => msg.role === instruction.target).length;
                        // convert to positive index
                        // e.g., total=5, index=-1 -> 5 + (-1) + 1 = 5 (the 5th)
                        // e.g., total=5, index=-2 -> 5 + (-2) + 1 = 4 (the 4th)
                        targetOccurrence = totalCount + targetOccurrence + 1;
                    }

                    // find target message
                    const targetMessage = promptArray.find(msg =>
                        msg.role === instruction.target &&
                        msg.role_specific_index === targetOccurrence
                    );

                    // if target message is found, add to queue
                    if (targetMessage && targetMessage.original_index !== undefined) {
                        const originalPos = targetMessage.original_index;
                        const finalPos = instruction.targetAt === 'before' ? originalPos : originalPos + 1;
                        positionBasedQueue.push({ instruction, finalPos });
                        console.log(`[Prompt Template] Target position calculated: ${instruction.target}[${targetOccurrence}] -> pos ${finalPos}`);
                    } else {
                        console.warn(`[Prompt Template] Target not found: ${instruction.target}[${targetOccurrence}]`, instruction);
                    }
                }

                // parse 'pos' instructions
                for (const instruction of posInstructions) {
                    // handle pos=0 as special case (insert at beginning)
                    if (instruction.pos === 0) {
                        positionBasedQueue.push({ instruction, finalPos: 0 });
                        console.log(`[Prompt Template] Pos position calculated: pos 0 (special case for pos=0)`);
                        continue;
                    }
                    
                    // default pos is 1 (1-based index)
                    let finalPos = instruction.pos || 1;
                    if (finalPos < 0) {
                        // convert negative index to absolute position from the end
                        finalPos = promptArray.length + finalPos + 1;
                        // ensure it is not less than 1
                        // e.g., total=5, pos=-1 -> 5 + (-1) + 1 = 5 (the 5th)
                        // e.g., total=5, pos=-2 -> 5 + (-2) + 1 = 4 (the 4th)
                        finalPos = Math.max(1, finalPos);
                    }
                    // convert from 1-based to 0-based for array insertion
                    const arrayPos = finalPos - 1;
                    positionBasedQueue.push({ instruction, finalPos: arrayPos });
                    console.log(`[Prompt Template] Pos position calculated: pos ${arrayPos} (from 1-based ${finalPos})`);
                }

                // sort by finalPos, then by order (ascending), then by type priority
                positionBasedQueue.sort((a, b) => {
                    if (a.finalPos !== b.finalPos) {
                        return b.finalPos - a.finalPos;
                    }

                    // if finalPos is the same, sort by order (ascending) 
                    // smaller order should be placed first
                    // but we are inserting from back to front, so we need to reverse the order
                    const aOrder = a.instruction.order ?? Infinity;
                    const bOrder = b.instruction.order ?? Infinity;
                    if (aOrder !== bOrder) {
                        console.log(`[Prompt Template] Order comparison: ${a.instruction.originalData?.comment} (order=${aOrder}) vs ${b.instruction.originalData?.comment} (order=${bOrder}) -> ${aOrder < bOrder ? 'A first' : 'B first'}`);
                        return bOrder - aOrder;
                    }

                    // if order is the same, 'pos' type is prior to 'target' type
                    // we want 'pos' to be placed after 'target' to be executed first (because we are traversing from back to front)
                    const aIsPos = a.instruction.type === 'pos';
                    const bIsPos = b.instruction.type === 'pos';

                    if (aIsPos && !bIsPos) {
                        return -1; // a(pos) should be placed after b(target) to be executed first
                    }
                    if (!aIsPos && bIsPos) {
                        return 1; // b(pos) should be placed after a(target)
                    }

                    // if type is the same, keep original order (stable)
                    return 0;
                });

                // add debug info
                console.log('[Prompt Template] Position-based queue after sorting:');
                for (let i = 0; i < positionBasedQueue.length; i++) {
                    const item = positionBasedQueue[i];
                    console.log(`  ${i}: ${item.instruction.originalData?.comment} (pos=${item.finalPos}, order=${item.instruction.order}, type=${item.instruction.type})`);
                }

                // inject from back to front
                for (const { instruction, finalPos } of positionBasedQueue) {
                    const injectMessage = { role: instruction.role, content: instruction.content };
                    promptArray.splice(finalPos, 0, injectMessage);
                    console.log(`[Prompt Template] Position-based message inserted: role=${instruction.role} at final pos ${finalPos}`);
                }

                // parse 'regex' instructions
                const regexBasedQueue: Array<{ instruction: InjectInstruction; finalPos: number }> = [];

                for (const instruction of regexInstructions) {
                    try {
                        const regex = new RegExp(instruction.regex || '');
                        const matchIndex = promptArray.findIndex(msg => regex.test(msg.content));

                        if (matchIndex !== -1) {
                            const finalPos = instruction.regexAt === 'before' ? matchIndex : matchIndex + 1;
                            regexBasedQueue.push({ instruction, finalPos });
                            console.log(`[Prompt Template] Regex position calculated: regex="${instruction.regex}" -> pos ${finalPos}`);
                        } else {
                            console.warn(`[Prompt Template] Regex match not found: "${instruction.regex}"`);
                        }
                    } catch (error) {
                        console.error(`[Prompt Template] Invalid regex "${instruction.regex}":`, error);
                    }
                }

                // sort by finalPos, then by order (ascending)
                regexBasedQueue.sort((a, b) => {
                    if (a.finalPos !== b.finalPos) {
                        return b.finalPos - a.finalPos;
                    }

                    // if finalPos is the same, sort by order (ascending)
                    // smaller order should be placed first
                    // but we are inserting from back to front, so we need to reverse the order
                    const aOrder = a.instruction.order;
                    const bOrder = b.instruction.order;
                    return bOrder - aOrder;
                });

                for (const { instruction, finalPos } of regexBasedQueue) {
                    const injectMessage = { role: instruction.role, content: instruction.content };
                    promptArray.splice(finalPos, 0, injectMessage);
                    console.log(`[Prompt Template] Regex-based message inserted: role=${instruction.role} at final pos ${finalPos}`);
                }

                // remove all temporary auxiliary properties
                for (const item of promptArray) {
                    delete item.original_index;
                    delete item.role_specific_index;
                }

                // update original data.prompt object
                data.prompt = promptArray;
            }
        }
    }

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${chat.length} messages in ${end}ms`);

    await checkAndSave();
    updateTokens(prompts, 'send');

    // cleanup
    deactivateActivateWorldInfo();
    deactivateRegex({ generate: true, basic: true });
    deactivatePromptInjection();
}

async function handleMessageRender(message_id: string, type?: string, isDryRun?: boolean) {
    if (settings.enabled === false)
        return;
    if (settings.render_enabled === false)
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

    const parent = $(`div.mes[mesid="${message_id}"]`);
    const container = parent?.find('.mes_text');
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

    if (!isDryRun && settings.raw_message_evaluation_enabled) {
        env.runType = 'render_permanent';
        const newContent = await evalTemplateHandler(
            escapeReasoningBlocks(applyRegex.call(
                env,
                message.mes,
                {
                    message: true
                },
                {
                    user: message.is_user,
                    assistant: !message.is_user && !message.is_system,
                    system: message.is_system,
                    worldinfo: false,
                    depth: chat.length - message_idx - 1,
                    raw: true,
                    display: false,
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
        deactivateRegex({ message: true });
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
        escapeReasoningBlocks(removeHtmlTagsInsideBlock(applyRegex.call(
            env,
            content,
            { message: true },
            {
                user: message.is_user,
                assistant: !message.is_user && !message.is_system,
                system: message.is_system,
                worldinfo: false,
                depth: chat.length - message_idx - 1,
                raw: false,
                display: true,
            }
        )),
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

    const after = settings.render_loader_enabled === false ? '' : await processWorldinfoEntities(env, '[RENDER:AFTER]', newContent || '', { escaper });
    if (newContent != null)
        newContent = before + newContent + after;

    // update if changed
    if (newContent && newContent !== content) {
        container.html(newContent);
        updateReasoningUI(parent);
        addCopyToCodeBlocks(parent);
        appendMediaToMessage(message, parent);
    }

    if (hasHTML && isDryRun) {
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

    await checkAndSave();

    if (!isDryRun)
        updateTokens(container.text(), 'receive');
}

// export for command
export async function handlePreloadWorldInfo(chat_filename?: string, force: boolean = false) {
    if (settings.enabled === false)
        return;

    // clean old content
    deactivateRegex({ basic: true, message: true, generate: true });
    deactivateActivateWorldInfo();
    deactivatePromptInjection(999);

    if (settings.preload_worldinfo_enabled === false && !force)
        return;
    if (!chat_filename && !force)
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

    if (settings.generate_loader_enabled)
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

    if (settings.generate_loader_enabled)
        await processWorldinfoEntities(env, '[GENERATE:AFTER]', prompts);

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${worldInfoData.length} world info in ${end}ms`);

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

async function handleRefreshWorldInfo(name: string, data: WorldInfoData) {
    if (settings.enabled === false)
        return;
    if (settings.preload_worldinfo_enabled === false)
        return;
    if (!this_chid)
        return;

    const start = Date.now();

    const enabled = getEnabledLoreBooks();
    if (!enabled.includes(name))
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

    if (settings.generate_loader_enabled)
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

    if (settings.generate_loader_enabled)
        await processWorldinfoEntities(env, '[GENERATE:AFTER]', prompts);

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${worldInfoData.length} world info in ${end}ms`);
}

async function handleWorldInfoActivation(_type: string, _options: GenerateOptions, dryRun: boolean) {
    if (settings.enabled === false)
        return;

    if (dryRun) return;
    await applyActivateWorldInfo(true);
}

async function handleActivator(data: GenerateAfterData) {
    if (!isDryRun)
        return;
    if (settings.enabled === false)
        return;
    if (settings.world_active_enabled === false)
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
            for (const content of message.content) {
                if (content.type === 'text') {
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

    if (settings.generate_loader_enabled)
        await processWorldinfoEntities(env, '[GENERATE:AFTER]', prompts);

    const end = Date.now() - start;
    console.log(`[Prompt Template] processing ${chat.length} messages in ${end}ms`);
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
