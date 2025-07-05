import { loadWorldInfo, parseRegexFromString, world_info_case_sensitive, world_info_match_whole_words, world_info_logic, world_info_use_group_scoring, DEFAULT_WEIGHT, METADATA_KEY, selected_world_info, world_info, DEFAULT_DEPTH, world_info_position } from '../../../../../world-info.js';
import { substituteParams, chat_metadata, this_chid, characters, eventSource, event_types } from '../../../../../../script.js';
import { power_user } from '../../../../../power-user.js';
import { getCharaFilename } from '../../../../../utils.js';
import { getGroupMembers } from '../../../../../group-chats.js';

export interface WorldInfoData {
    uid: number;
    key: string[];
    keysecondary: string[];
    comment: string;            // title
    content: string;
    constant: boolean;
    vectorized: boolean;
    selective: boolean;
    selectiveLogic: number;
    addMemo: boolean;
    order: number;
    position: number;
    disable: boolean;
    excludeRecursion: boolean;
    preventRecursion: boolean;
    delayUntilRecursion: boolean;
    probability: number;
    useProbability: boolean;
    depth: number;
    group: string;
    groupOverride: boolean;
    groupWeight: number;
    scanDepth: number | null;
    caseSensitive: boolean | null;
    matchWholeWords: null | number;
    useGroupScoring: boolean | null;
    automationId: string;
    role: null | number;
    sticky: number;
    cooldown: number;
    delay: number;
    displayIndex: number;
    world: string;
}

export interface WorldInfo {
    entries: Record<string, WorldInfoData>;
}

export interface WorldinfoForceActivate {
    world: string;
    uid: string | number;
}

export interface ActivateWorldInfoCondition {
    withConstant?: boolean; 
    withDisabled?: boolean;
    onlyDisabled?: boolean;
}

let activatedWorldEntries = new Map<string, WorldinfoForceActivate>();

export async function activateWorldInfo(world : string, uid : string | RegExp | number) {
    const entry = await getWorldInfoEntry(world, uid);
    if(entry)
        activatedWorldEntries.set(`${world}.${uid}`, entry);
    return entry;
}

export async function activateWorldInfoByKeywords(
    keywords: string | string[],
    condition: ActivateWorldInfoCondition = {}
) {
    const entries = await getEnabledWorldInfoEntries();
    const activated = selectActivatedEntries(entries, keywords, condition);
    activated.forEach(x => activatedWorldEntries.set(`${x.world}.${x.uid}`, x));
    return activated;
}

export async function applyActivateWorldInfo(deactivate : boolean = true) {
    await eventSource.emit(event_types.WORLDINFO_FORCE_ACTIVATE, activatedWorldEntries.values());
    if(deactivate)
        deactivateActivateWorldInfo();
}

export function deactivateActivateWorldInfo() {
    activatedWorldEntries.clear();
}

export async function getWorldInfoData(name: string): Promise<WorldInfoData[]> {
    // @ts-expect-error
    const lorebook: WorldInfo | null = await loadWorldInfo(name || characters[this_chid]?.data?.extensions?.world || power_user.persona_description_lorebook || chat_metadata[METADATA_KEY] || '');
    if (!lorebook)
        return [];

    const entries = Object.values(lorebook.entries).map(({ uid, ...rest }) => ({ ...rest, uid: Number(uid), world: name }));
    return entries.sort(getWorldInfoSorter(entries));
}

export async function getWorldInfoTitles(name: string): Promise<string[]> {
    return (await getWorldInfoData(name)).map(data => data.comment);
}

export async function getWorldInfoEntry(name: string, title: string | RegExp | number): Promise<WorldInfoData | null> {
    for (const data of await getWorldInfoData(name))
        // @ts-expect-error
        if (data.comment === title || data.uid === title || data.comment.match(title))   // String.match(number) will returns null
            return data;

    return null;
}

export async function getWorldInfoEntryContent(name: string, title: string | RegExp | number): Promise<string | null> {
    const data = await getWorldInfoEntry(name, title);
    if (!data) return null;

    return data.content;
}

export async function getWorldInfoActivatedEntries(name: string,
    keywords: string | string[],
    condition: ActivateWorldInfoCondition = {}) {
    const entries = await getWorldInfoData(name);
    if (!entries) return [];
    return selectActivatedEntries(entries, keywords, condition);
}

export function selectActivatedEntries(
    entries: WorldInfoData[],
    keywords: string | string[],
    condition: ActivateWorldInfoCondition = {}) : WorldInfoData[] {
    const { withConstant, withDisabled, onlyDisabled } = condition;
    let activated: Set<WorldInfoData> = new Set<WorldInfoData>();
    keywords = _.castArray(keywords).join('\n\n');
    for (const data of entries) {
        if(!withConstant && data.constant)
            continue;
        if(onlyDisabled && !data.disable)
            continue;
        if(!withDisabled && !onlyDisabled && data.disable)
            continue;

        // unsupported
        if(data.vectorized)
            continue;

        if(data.useProbability && data.probability < _.random(1, 100))
            continue;

        if(data.constant) {
            // Constant entries are always activated
            activated.add(data);
            continue;
        }

        const matchedKey = data.key.map(k => substituteParams(k)).find(k => matchKeys(keywords, k, data));
        if (!matchedKey)
            continue;

        const hasSecondaryKey = data.selective && _.isArray(data.keysecondary) && data.keysecondary.length > 0;
        if (!hasSecondaryKey) {
            // No secondary key required
            activated.add(data);
            continue;
        }

        const selectiveLogic = data.selectiveLogic ?? 0;
        let hasAnyMatch = false;
        let hasAllMatch = true;
        for (const secondary of data.keysecondary) {
            const secondarySubstituted = substituteParams(secondary);
            const hasSecondaryMatch = secondarySubstituted && matchKeys(keywords, secondarySubstituted.trim(), data);

            if (hasSecondaryMatch) hasAnyMatch = true;
            if (!hasSecondaryMatch) hasAllMatch = false;

            // Activates the entry only if the primary key and Any one of the optional filter keys are in scanned context.
            if (selectiveLogic === world_info_logic.AND_ANY && hasSecondaryMatch) {
                activated.add(data);
                break;
            }

            // Prevents activation of the entry despite primary key trigger, if all of the optional filters are in scanned context.
            if (selectiveLogic === world_info_logic.NOT_ALL && !hasSecondaryMatch) {
                activated.add(data);
                break;
            }
        }

        // Activates the entry only if the primary key and None of the optional filter keys are in scanned context.
        if (selectiveLogic === world_info_logic.NOT_ANY && !hasAnyMatch) {
            activated.add(data);
            continue;
        }

        // Activates the entry only if the primary key and ALL of the optional filter keys are present.
        if (selectiveLogic === world_info_logic.AND_ALL && hasAllMatch) {
            activated.add(data);
            continue;
        }
    }

    if (activated.size === 0)
        return [];

    const grouped = _.groupBy(Array.from(activated), data => data.group);
    const ungrouped = grouped[''] || [];
    if (ungrouped.length > 0 && _.size(grouped) <= 1) {
        // No grouping required
        return ungrouped.sort(getWorldInfoSorter(ungrouped));
    }

    let matched: WorldInfoData[] = [];
    for (const [group, datas] of _.entries(grouped)) {
        if (group === '') continue;

        if(datas.length === 1) {
            matched.push(datas[0]);
            continue;
        }

        // Group prioritization
        const usePrioritize = datas.filter(data => data.groupOverride);
        if (usePrioritize.length > 0) {
            const orders = datas.map(data => data.order);
            const top = _.min(orders);
            if (top) {
                matched.push(datas[Math.max(orders.findIndex(order => order <= top), 0)]);
                continue;
            }
        }

        // Use Group Scoring
        const useScores = datas.filter(data => data.useGroupScoring ?? world_info_use_group_scoring);
        if (useScores.length > 0) {
            const scores = datas.map(data => getScore(keywords, data));
            const top = _.max(scores);
            if (top) {
                matched.push(datas[Math.max(scores.findIndex(score => score >= top), 0)]);
                continue;
            }
        }

        // Use random with weights
        const useWeights = datas.filter(data => !data.groupOverride && !data.useGroupScoring);
        if(useWeights.length > 0) {
            const weights = datas.map(data => data.groupWeight ?? DEFAULT_WEIGHT);
            const totalWeight = _.sum(weights);
            let rollValue = _.random(1, totalWeight);
            const winner = weights.findIndex(weight => (rollValue -= weight) <= 0);
            if(winner >= 0)
                matched.push(datas[winner]);
        }
    }

    const unsorted = _.concat(ungrouped, matched);
    return unsorted.sort(getWorldInfoSorter(unsorted));
}

function transformString(str: string, entry: WorldInfoData) {
    const caseSensitive = entry.caseSensitive ?? world_info_case_sensitive;
    return caseSensitive ? str : str.toLowerCase();
}

function matchKeys(haystack: string, needle: string, entry: WorldInfoData) {
    const keyRegex = parseRegexFromString(needle);
    if (keyRegex) {
        return keyRegex.test(haystack);
    }

    haystack = transformString(haystack, entry);
    const transformedString = transformString(needle, entry);
    const matchWholeWords = entry.matchWholeWords ?? world_info_match_whole_words;

    if (matchWholeWords) {
        const keyWords = transformedString.split(/\s+/);

        if (keyWords.length > 1) {
            return haystack.includes(transformedString);
        }
        else {
            const regex = new RegExp(`(?:^|\\W)(${_.escapeRegExp(transformedString)})(?:$|\\W)`);
            if (regex.test(haystack)) {
                return true;
            }
        }
    } else {
        return haystack.includes(transformedString);
    }

    return false;
}

function getScore(haystack: string, entry: WorldInfoData) {
    const bufferState = haystack;
    let numberOfPrimaryKeys = 0;
    let numberOfSecondaryKeys = 0;
    let primaryScore = 0;
    let secondaryScore = 0;

    if (Array.isArray(entry.key)) {
        numberOfPrimaryKeys = entry.key.length;
        for (const key of entry.key) {
            if (matchKeys(bufferState, key, entry)) {
                primaryScore++;
            }
        }
    }

    if (Array.isArray(entry.keysecondary)) {
        numberOfSecondaryKeys = entry.keysecondary.length;
        for (const key of entry.keysecondary) {
            if (matchKeys(bufferState, key, entry)) {
                secondaryScore++;
            }
        }
    }

    if (!numberOfPrimaryKeys) {
        return 0;
    }

    if (numberOfSecondaryKeys > 0) {
        switch (entry.selectiveLogic) {
            case world_info_logic.AND_ANY:
                return primaryScore + secondaryScore;
            case world_info_logic.AND_ALL:
                return secondaryScore === numberOfSecondaryKeys ? primaryScore + secondaryScore : primaryScore;
        }
    }

    return primaryScore;
}

export function getEnabledLoreBooks(
    chara : boolean = true, global : boolean = true,
    persona : boolean = true, charaExtra : boolean = true,
    chat: boolean = true) : string[] {
    let results : string[] = [];

    if (chara) {
        // @ts-expect-error
        const charaWorld : string = characters[this_chid]?.data?.extensions?.world;
        if (charaWorld && !selected_world_info.includes(charaWorld))
            results.push(charaWorld);

        for(const member of getGroupMembers()) {
            // @ts-expect-error
            const world = member?.data?.extensions?.world;
            if (world && !selected_world_info.includes(world))
                results.push(world);
        }
    }

    if (global) {
        for (const world of selected_world_info) {
            results.push(world as string);
        }
    }

    if (persona) {
        // @ts-expect-error
        const chatWorld : string = chat_metadata[METADATA_KEY];
        const personaWorld : string = power_user.persona_description_lorebook;
        if(personaWorld && personaWorld !== chatWorld && !selected_world_info.includes(personaWorld))
            results.push(personaWorld);
    }

    if (charaExtra) {
        // @ts-expect-error: 2345
        const fileName = getCharaFilename(this_chid);
        if (fileName) {
            // @ts-expect-error
            const extraCharLore = world_info.charLore?.find((e) => e.name === fileName);
            if (extraCharLore && _.isArray(extraCharLore.extraBooks)) {
                // @ts-expect-error
                const primaryBook : string = characters[this_chid]?.data?.extensions?.world;
                for(const book of extraCharLore.extraBooks) {
                    if (book !== primaryBook && !selected_world_info.includes(book))
                        results.push(book);
                }
            }
        }

        for(const member of getGroupMembers()) {
            // @ts-expect-error: 2339
            const chid = characters.findIndex(ch => ch.avatar === member.avatar);
            const file = getCharaFilename(chid);
            if (file) {
                // @ts-expect-error
                const extraCharLore = world_info.charLore?.find((e) => e.name === file);
                if (extraCharLore && _.isArray(extraCharLore.extraBooks)) {
                    // @ts-expect-error
                    const primaryBook : string = member?.data?.extensions?.world;
                    for(const book of extraCharLore.extraBooks) {
                        if (book !== primaryBook && !selected_world_info.includes(book))
                            results.push(book);
                    }
                }
            }
        }
    }

    if (chat) {
        // @ts-expect-error
        const chatWorld : string = chat_metadata[METADATA_KEY];
        if (chatWorld && !selected_world_info.includes(chatWorld))
            results.push(chatWorld);
    }

    return results;
}

export async function getEnabledWorldInfoEntries(
    chara : boolean = true, global : boolean = true,
    persona : boolean = true, charaExtra : boolean = true,
    chat: boolean = true) : Promise<WorldInfoData[]> {
    
    let results : WorldInfoData[] = [];
    const lorebooks = getEnabledLoreBooks(chara, global, persona, charaExtra, chat);
    for (const book of lorebooks) {
        const worldInfo = await getWorldInfoData(book);
        if (worldInfo?.length > 0) {
            results = results.concat(worldInfo);
        }
    }
    
    return results.sort(getWorldInfoSorter(results));
}

// guess
const DEPTH_MAPPING = {
    [world_info_position.before]: 4, // Before Char Defs
    [world_info_position.after]: 3, // After Char Defs
    [world_info_position.EMTop]: 2, // Before Example Messages
    [world_info_position.EMBottom]: 1, // After Example Messages
    [world_info_position.ANTop]: 1, // Top of Author's Note
    [world_info_position.ANBottom]: -1, // Bottom of Author's Note
};

function getWorldInfoSorter(entries: WorldInfoData[]) {
    return (a: WorldInfoData, b: WorldInfoData) => worldInfoSorter(a, b, Math.max(...entries.map(x => x.position === world_info_position.atDepth ? x.depth : 0)));
}

function worldInfoSorter(a: WorldInfoData, b: WorldInfoData, top: number = DEFAULT_DEPTH) {
    function calcDepth(entry: WorldInfoData) {
        const offset = DEPTH_MAPPING[entry.position];

        // absolute depth
        if(offset == null)
            return entry.depth ?? DEFAULT_DEPTH;

        // relative to AN
        if(entry.position === world_info_position.ANTop || entry.position === world_info_position.ANBottom) {
            // @ts-expect-error: 2339
            switch(chat_metadata.note_position) {
                case 0:
                case 2:
                    // After Main Prompt / Story String
                    return offset + top + DEPTH_MAPPING[world_info_position.before] + 2;
                case 1:
                    // In-chat @ Depth
                    // @ts-expect-error: 2339
                    return (chat_metadata.note_depth ?? DEFAULT_DEPTH) + (entry.depth ?? DEFAULT_DEPTH);
            }
        }

        // relative to chat history with preset
        return offset + top;
    }

    // Sort by depth (desc), then order (asc), then uid (desc)
    return calcDepth(b) - calcDepth(a) ||
        a.order - b.order ||
        b.uid - a.uid;
    
    // return a.position - b.position || a.order - b.order || (b.depth || DEFAULT_DEPTH) - (a.depth || DEFAULT_DEPTH) || a.uid - b.uid;
}
