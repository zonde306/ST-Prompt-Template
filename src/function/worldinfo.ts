import { loadWorldInfo, parseRegexFromString, world_info_case_sensitive, world_info_match_whole_words, world_info_logic, world_info_use_group_scoring, DEFAULT_WEIGHT, METADATA_KEY, selected_world_info, world_info } from '../../../../../world-info.js';
import { substituteParams, chat_metadata, this_chid } from '../../../../../../script.js';
import { power_user } from '../../../../../power-user.js';
import { getCharaFilename } from '../../../../../utils.js';

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

export async function getWorldInfoData(name: string): Promise<WorldInfoData[]> {
    // @ts-expect-error
    const lorebook: WorldInfo | null = await loadWorldInfo(name);
    if (!lorebook)
        return [];

    return _.values(lorebook.entries).map(({ uid, ...rest }) => ({ ...rest, uid: Number(uid), world: name })).sort((a, b) => a.order - b.order);
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
    keywords: string | string[], withConstant : boolean = false,
    withDisabled: boolean = false) {
    const entries = await getWorldInfoData(name);
    if (!entries) return [];
    return selectActivatedEntries(entries, keywords, withConstant, withDisabled);
}

export function selectActivatedEntries(
    entries: WorldInfoData[],
    keywords: string | string[],
    withConstant : boolean = true,
    withDisabled: boolean = false) {
    let activated: Set<WorldInfoData> = new Set<WorldInfoData>();
    keywords = _.castArray(keywords).join('\n\n');
    for (const data of entries) {
        if(data.constant && !withConstant)
            continue;
        if(data.disable && !withDisabled)
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
        return ungrouped.sort((a, b) => a.order - b.order);
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

    return _.concat(ungrouped, matched).sort((a, b) => a.order - b.order);
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

export async function getEnabledWorldInfoEntries(
    chara : boolean = true, global : boolean = true,
    persona : boolean = true, charaExtra : boolean = true) : Promise<WorldInfoData[]> {
    let results : WorldInfoData[] = [];
    if (chara) {
        // @ts-expect-error
        const chatWorld : string = chat_metadata[METADATA_KEY];
        if (chatWorld && !selected_world_info.includes(chatWorld)) {
            const worldInfo = await getWorldInfoData(chatWorld);
            if (worldInfo.length > 0) {
                results = results.concat(worldInfo);
            }
        }
    }

    if (global) {
        for (const world of selected_world_info) {
            const worldInfo = await getWorldInfoData(world);
            if (worldInfo.length > 0) {
                results = results.concat(worldInfo);
            }
        }
    }

    if (persona) {
        // @ts-expect-error
        const chatWorld : string = chat_metadata[METADATA_KEY];
        const personaWorld : string = power_user.persona_description_lorebook;
        if(personaWorld && personaWorld !== chatWorld && !selected_world_info.includes(personaWorld)) {
            const worldInfo = await getWorldInfoData(personaWorld);
            if (worldInfo.length > 0) {
                results = results.concat(worldInfo);
            }
        }
    }

    if (charaExtra) {
        const fileName = getCharaFilename(this_chid);
        if (fileName) {
            // @ts-expect-error
            const extraCharLore = world_info.charLore?.find((e) => e.name === fileName);
            if (extraCharLore && ~_.isArray(extraCharLore.extraBooks)) {
                // @ts-expect-error
                const primaryBook : string = chat_metadata[METADATA_KEY];
                for(const book of extraCharLore.extraBooks) {
                    if (book !== primaryBook && !selected_world_info.includes(book)) {
                        const worldInfo = await getWorldInfoData(book);
                        if (worldInfo.length > 0) {
                            results = results.concat(worldInfo);
                        }
                    }
                }
            }
        }
    }

    return results.sort((a, b) => a.order - b.order);
}
