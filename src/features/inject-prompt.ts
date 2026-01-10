import { getEnabledWorldInfoEntries } from "../function/worldinfo";
import { evalTemplateHandler } from "../utils/evaluate";
import { applyRegex } from "../function/regex";
import { settings } from "../modules/ui";
import { substituteParams } from "../../../../../../script.js";
import { GenerateAfterData } from "../modules/defines";
import { EvalTemplateOptions } from "../function/ejs";

// TODO: Colddown and sticky
export async function handleInjectPrompt(data: GenerateAfterData, env: Record<string, unknown>, options: EvalTemplateOptions = {}) {
    // get All INJECT 世界书条目（只获取关闭的条目）
    const injectWorldInfoData = (await getEnabledWorldInfoEntries())
        .filter(x =>
            x.comment.startsWith('@INJECT') &&
            (x.disable === settings.invert_enabled || x.decorators.includes('@@always_enabled')) &&
            !x.decorators.includes('@@only_preload')
        );

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
                applyRegex(env, substituteParams(worldInfo.content), { generate: true, role: role, worldinfo: true }),
                _.merge(env, { world_info: worldInfo }),
                `inject ${worldInfo.world}.${worldInfo.comment}`,
                {
                    ...options,
                    options: {
                        filename: `inject/${worldInfo.world}/${worldInfo.uid}-${worldInfo.comment}`,
                        cache: settings.cache_enabled === 1,
                        ...options.options,
                    },
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