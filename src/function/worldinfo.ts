import { loadWorldInfo, parseRegexFromString, world_info_case_sensitive, world_info_match_whole_words, world_info_logic, world_info_use_group_scoring, DEFAULT_WEIGHT, METADATA_KEY, selected_world_info, world_info, DEFAULT_DEPTH, world_info_position, world_names } from '../../../../../world-info.js';
import { substituteParams, chat_metadata, this_chid, characters, eventSource, event_types } from '../../../../../../script.js';
import { power_user } from '../../../../../power-user.js';
import { getCharaFilename } from '../../../../../utils.js';
import { getGroupMembers } from '../../../../../group-chats.js';
import { settings } from '../modules/ui';
import { EvalTemplateOptions } from './ejs';
import { evalTemplateHandler } from '../utils/evaluate';

const KNOWN_DECORATORS = [
    '@@activate',
    '@@dont_activate',
    '@@message_formatting',
    '@@generate_before',
    '@@generate_after',
    '@@render_before',
    '@@render_after',
    '@@dont_preload',
    '@@initial_variables',
    '@@always_enabled',
    '@@only_preload',
    '@@iframe',
    '@@preprocessing',
    '@@if',
    '@@private',
];

interface WorldInfoExtension {
    position: number;
    exclude_recursion: boolean;
    display_index: number;
    probability: number;
    useProbability: boolean;
    depth: number;
    selectiveLogic: number;
    group: string;
    group_override: boolean;
    group_weight: number;
    prevent_recursion: boolean;
    delay_until_recursion: boolean;
    scan_depth: number | null;
    match_whole_words: boolean | null;
    use_group_scoring: boolean | null;
    case_sensitive: boolean | null;
    automation_id: string;
    role: null | number;
    vectorized: boolean;
    sticky: number;
    cooldown: number;
    delay: number;
    match_persona_description: boolean;
    match_character_description: boolean;
    match_character_personality: boolean;
    match_character_depth_prompt: boolean;
    match_scenario: boolean;
    match_creator_notes: boolean;
    ignoreBudget: boolean;
}

interface WorldInfoFilter {
    isExclude: boolean;
    names: string[];
    tags: string[];
}

export interface WorldInfoEntry {
    uid: number;
    key: string[];
    keysecondary: string[];
    comment: string; // Title/Memo
    content: string;
    constant: boolean; // 🔵 Constant
    vectorized: boolean; // 🔗 Vectorized
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
    decorators: string[]; // A list of identifiers starting with @@ extracted from `content`
    extensions: WorldInfoExtension;
    hash: number | undefined; // getStringHash(JSON.stringify(entry))
    triggers: string[];

    // Filter to Characters or Tags
    characterFilter: WorldInfoFilter;
    characterFilterNames: string[];
    characterFilterTags: string[];
    characterFilterExclude: boolean;
    
    // Additional Matching Sources
    matchPersonaDescription: boolean;
    matchCharacterDescription: boolean;
    matchCharacterPersonality: boolean;
    matchCharacterDepthPrompt: boolean;
    matchScenario: boolean;
    matchCreatorNotes: boolean;
    ignoreBudget: boolean;
}

export interface LoreBook {
    entries: Record<string, WorldInfoEntry>;
}

export interface ActivateWorldInfoCondition {
    constant?: boolean; 
    disabled?: boolean;
    vectorized?: boolean;
}

let activatedWorldEntries = new Map<string, WorldInfoEntry>();

/**
 * Activate the specified WI entry
 * @param world lore book
 * @param uid WI name/uid
 * @param force force activation entry
 * @returns WI entry
 */
export async function activateWorldInfo(world : string | RegExp | number, uid: string | RegExp | number, force?: boolean): Promise<WorldInfoEntry | null>;

/**
 * Activate the specified WI entry
 * @param uid WI name/uid
 * @param force force activation entry
 * @returns WI entry
 */
export async function activateWorldInfo(uid: string | RegExp | number, force?: boolean): Promise<WorldInfoEntry | null>;

export async function activateWorldInfo(world : string | RegExp | number, uid?: string | RegExp | number | boolean, force?: boolean): Promise<WorldInfoEntry | null> {
    // @ts-expect-error: overload
    const entry = await getWorldInfoEntry(world, typeof uid === 'boolean' ? undefined : uid);
    if(entry) {
        force = typeof uid === 'boolean' ? uid : force;
        activatedWorldEntries.set(`${world}.${uid}`, {
            ...entry,
            disable: false,
            constant: force ? true : entry.constant,
            cooldown: force ? 0 : entry.cooldown,
            delay: force ? 0 : entry.delay,
            vectorized: force ? false : entry.vectorized,
            delayUntilRecursion: force ? false : entry.vectorized,
            triggers: force ? [] : entry.triggers,
            hash: force ? Math.random() + 1 : undefined, // fuck the hash
            content: force ? entry.content.replace("@@dont_activate", "") : entry.content,
            ignoreBudget: force || entry.ignoreBudget,
            group: force ? "" : entry.group,
        });
        if(settings.debug_enabled) {
            if(uid != null && typeof uid !== 'boolean')
                console.log(`[Prompt Template] Activated WI entry ${world}.${uid} (force: ${force}`);
            else
                console.log(`[Prompt Template] Activated WI entry ${world} (force: ${force}`);
        }
    }
    return entry;
}

/**
 * Activate WI entries by keywords, from all activatable WIs
 * @param keywords Content used for activation (e.g. prompts)
 * @param condition Activation conditions
 * @returns WI entry
 */
export async function activateWorldInfoByKeywords(
    keywords: string | string[],
    condition: ActivateWorldInfoCondition & { force?: boolean } = {}
) {
    const entries = await getEnabledWorldInfoEntries();
    const activated = selectActivatedEntries(entries, keywords, condition);
    activated.forEach(x => activateWorldInfo(x.world, x.uid, condition.force));
    return activated;
}

export async function applyActivateWorldInfo() {
    await eventSource.emit(event_types.WORLDINFO_FORCE_ACTIVATE, activatedWorldEntries.values().filter(e => e.hash));
}

export function deactivateActivateWorldInfo() {
    activatedWorldEntries.clear();
}

export function getActivatedWIEntries(): WorldInfoEntry[] {
    return Array.from(activatedWorldEntries.values());
}

/**
 * Gets the WI by name, or selects a suitable WI if name is not provided.
 * @param name WI name
 * @returns WI entries
 */
export async function getWorldInfoEntries(name?: string): Promise<WorldInfoEntry[]> {
    // @ts-expect-error
    const lore = (name || characters[this_chid]?.data?.extensions?.world || power_user.persona_description_lorebook || chat_metadata[METADATA_KEY] || '') as string;
    const lorebook = await loadWorldInfo(lore) as LoreBook;
    if (!lorebook) {
        console.log(`[Prompt Template] lorebook not found: ${lore} (${name})`);
        return [];
    }

    const entries = Object.values(lorebook.entries).map(entry => {
        const clone = { ...entry };
        // modify in place
        clone.uid = Number(entry.uid);
        const [ decorators, content ] = parseDecorators(entry.content);
        clone.decorators = decorators;
        clone.content = content;
        clone.world = lore;
        return clone;
    });

    return entries.sort(getWorldInfoSorter(entries));
}

/**
 * Get the names of all entries in WI
 * @param name WI name
 * @returns WI entry names
 */
export async function getWorldInfoComments(name?: string): Promise<string[]> {
    return (await getWorldInfoEntries(name)).map(data => data.comment);
}

/**
 * Get the specified WI entry data
 * @param name WI name
 * @param title entry name
 * @returns entry data
 */
export async function getWorldInfoEntry(name: string, title: string | RegExp | number): Promise<WorldInfoEntry | null>;

/**
 * Get the specified WI entry data
 * @param title entry name
 * @returns entry data
 */
export async function getWorldInfoEntry(title: string | RegExp | number): Promise<WorldInfoEntry | null>;

export async function getWorldInfoEntry(name: string | RegExp | number, title?: string | RegExp | number): Promise<WorldInfoEntry | null> {
    let entries = [];
    if(title != null) {
        entries = await getWorldInfoEntries(name as string);
    } else {
        entries = await getWorldInfoEntries();
        title = name;
    }

    for (const data of entries) {
        // @ts-expect-error: String.match(number) will returns null
        if (data.comment === title || data.uid === title || data.comment.match(title))
            return data;
    }

    console.log(`[Prompt Template] entry not found: ${title} (${name})`);
    return null;
}

/**
 * Get the specified WI entry content
 * @param name WI name
 * @param title entry name
 * @returns entry content
 */
export async function getWorldInfoEntryContent(name: string | RegExp | number, title: string | RegExp | number): Promise<string | null>;

/**
 * Get the specified WI entry content
 * @param title entry name
 * @returns entry content
 */
export async function getWorldInfoEntryContent(title: string | RegExp | number): Promise<string | null>;

export async function getWorldInfoEntryContent(name: string | RegExp | number, title?: string | RegExp | number): Promise<string | null> {
    // @ts-expect-error: 2345
    const data = await getWorldInfoEntry(name, title);
    if (!data) return null;
    return data.content;
}

/**
 * Get a list of entries activated based on keywords from the specified WI
 * @param name WI name
 * @param keywords Content used for activation (e.g. prompts)
 * @param condition Activation conditions
 * @returns WI entries
 */
export async function getWorldInfoActivatedEntries(name: string,
    keywords: string | string[],
    condition: ActivateWorldInfoCondition = {}) {
    const entries = await getWorldInfoEntries(name);
    if (!entries) return [];
    return selectActivatedEntries(entries, keywords, condition);
}

/**
 * Filter all activated WI entries
 * @param entries WI entries
 * @param keywords Content used for activation (e.g. prompts)
 * @param condition Activation conditions
 * @returns WI entries
 */
export function selectActivatedEntries(
    entries: WorldInfoEntry[],
    keywords: string | string[],
    condition: ActivateWorldInfoCondition = {}) : WorldInfoEntry[] {
    let activated: Set<WorldInfoEntry> = new Set<WorldInfoEntry>();
    const trigger = _.castArray(keywords).join('\n\n') as string;
    for (const data of entries) {
        if(condition.constant != null && data.constant !== condition.constant)
            continue;
        if(condition.disabled != null && data.disable !== condition.disabled)
            continue;
        if(condition.vectorized != null && data.vectorized !== condition.vectorized)
            continue;
        
        // Trigger probability
        if(data.useProbability && data.probability < _.random(1, 100))
            continue;

        // 🔵 Constant
        if(data.constant) {
            // Constant entries are always activated
            activated.add(data);
            continue;
        }

        if(data.decorators.includes('@@activate')) {
            // activated by @@activate decorator
            activated.add(data);
            continue;
        }

        if(data.decorators.includes('@@dont_activate')) {
            // suppressed by @@dont_activate decorator
            continue;
        }

        if(data.decorators.includes('@@only_preload')) {
            // suppressed by @@only_preload decorator
            continue;
        }

        // Primary Keywords
        const matchedKey = data.key.map(k => substituteParams(k)).find(k => matchKeys(trigger, k, data));
        if (!matchedKey)
            continue;

        const hasSecondaryKey = data.selective && _.isArray(data.keysecondary) && data.keysecondary.length > 0;
        if (!hasSecondaryKey) {
            // No secondary key required
            activated.add(data);
            continue;
        }

        // Optional Filter
        const selectiveLogic = data.selectiveLogic ?? 0;
        let hasAnyMatch = false;
        let hasAllMatch = true;
        for (const secondary of data.keysecondary) {
            const secondarySubstituted = substituteParams(secondary);
            const hasSecondaryMatch = secondarySubstituted && matchKeys(trigger, secondarySubstituted.trim(), data);

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

    if (activated.size <= 0)
        return [];

    // Inclusion Group
    const grouped = _.groupBy(
        Array.from(activated),
        (data: WorldInfoEntry) => data.group
    ) as { [key: string]: WorldInfoEntry[] };
    const ungrouped = grouped[''] || [];

    // No grouping required
    if (ungrouped.length > 0 && _.size(grouped) <= 1) {
        return ungrouped.sort(getWorldInfoSorter(ungrouped));
    }

    // Select the best match based on grouping
    let matched: WorldInfoEntry[] = [];
    for (const [group, datas] of Object.entries(grouped)) {
        if (group === '') continue;

        if(datas.length === 1) {
            matched.push(datas[0]);
            continue;
        }

        // Group prioritization
        const usePrioritize = datas.filter((data: WorldInfoEntry) => data.groupOverride);
        if (usePrioritize.length > 0) {
            const orders = datas.map((data: WorldInfoEntry) => data.order);
            const top = Math.min(...orders);
            if (top) {
                matched.push(datas[Math.max(orders.findIndex(order => order <= top), 0)]);
                continue;
            }
        }

        // Use Group Scoring
        const useScores = datas.filter(data => data.useGroupScoring ?? world_info_use_group_scoring);
        if (useScores.length > 0) {
            const scores = datas.map(data => getScore(trigger, data));
            const top = Math.max(...scores);
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

    const unsorted = ungrouped.concat(matched);
    return unsorted.sort(getWorldInfoSorter(unsorted));
}

// Ignore Case
function transformString(str: string, entry: WorldInfoEntry) {
    const caseSensitive = entry.caseSensitive ?? world_info_case_sensitive;
    return caseSensitive ? str : str.toLowerCase();
}

// Keyword matching
function matchKeys(haystack: string, needle: string, entry: WorldInfoEntry) {
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
        } else {
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

// Group Scoring
function getScore(haystack: string, entry: WorldInfoEntry) {
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

/**
 * Get all enabled WI entries in the current context and sort them
 * @param chara includes character Primary Lorebook
 * @param global includes Active World(s) for all chats
 * @param persona includes Persona Lorebook
 * @param charaExtra includes character Additional Lorebooks
 * @param chat includes chat bounded lorebooks
 * @param onlyExisting only include lorebooks that exist in the current world
 * @returns lore books
 */
export function getEnabledLoreBooks(
    chara : boolean = true,
    global : boolean = true,
    persona : boolean = true,
    charaExtra : boolean = true,
    chat: boolean = true,
    onlyExisting : boolean = true
) : string[] {
    let results : string[] = [];

    if (chara) {
        // @ts-expect-error
        const charaWorld : string = characters[this_chid]?.data?.extensions?.world;
        if (charaWorld && !selected_world_info.includes(charaWorld))
            results.push(charaWorld);

        for(const member of getGroupMembers()) {
            const world = member?.data?.extensions?.world;
            if (world && !selected_world_info.includes(world))
                results.push(world);
        }
    }

    if (global) {
        for (const world of selected_world_info) {
            if(world)
                results.push(world as string);
        }
    }

    if (persona) {
        const chatWorld : string = chat_metadata[METADATA_KEY];
        const personaWorld : string = power_user.persona_description_lorebook;
        if(personaWorld && personaWorld !== chatWorld && !selected_world_info.includes(personaWorld))
            results.push(personaWorld);
    }

    if (charaExtra) {
        const fileName = getCharaFilename(this_chid);
        if (fileName) {
            // @ts-expect-error
            const extraCharLore = world_info.charLore?.find((e) => e.name === fileName);
            if (extraCharLore && Array.isArray(extraCharLore.extraBooks)) {
                // @ts-expect-error
                const primaryBook : string = characters[this_chid]?.data?.extensions?.world;
                for(const book of extraCharLore.extraBooks) {
                    if (book && book !== primaryBook && !selected_world_info.includes(book))
                        results.push(book);
                }
            }
        }

        for(const member of getGroupMembers()) {
            const chid = characters.findIndex(ch => ch.avatar === member.avatar);
            const file = getCharaFilename(chid);
            if (file) {
                // @ts-expect-error
                const extraCharLore = world_info.charLore?.find((e) => e.name === file);
                if (extraCharLore && Array.isArray(extraCharLore.extraBooks)) {
                    const primaryBook : string = member?.data?.extensions?.world;
                    for(const book of extraCharLore.extraBooks) {
                        if (book && book !== primaryBook && !selected_world_info.includes(book))
                            results.push(book);
                    }
                }
            }
        }
    }

    if (chat) {
        const chatWorld : string = chat_metadata[METADATA_KEY];
        if (chatWorld && !selected_world_info.includes(chatWorld))
            results.push(chatWorld);
    }

    if(onlyExisting)
        return results.filter(e => e && world_names.includes(e));

    return results;
}

/**
 * Get all enabled WI entries for the current context and sort them. Only return enabled entries
 * @param chara includes character Primary Lorebook
 * @param global includes Active World(s) for all chats
 * @param persona includes Persona Lorebook
 * @param charaExtra includes character Additional Lorebooks
 * @param chat includes chat bounded lorebooks
 * @param onlyExisting only include lorebooks that exist in the current world
 * @returns WI entries
 */
export async function getEnabledWorldInfoEntries(
    chara : boolean = true,
    global : boolean = true,
    persona : boolean = true,
    charaExtra : boolean = true,
    chat: boolean = true,
    onlyExisting : boolean = true
) : Promise<WorldInfoEntry[]> {
    
    let results : WorldInfoEntry[] = [];
    const lorebooks = getEnabledLoreBooks(chara, global, persona, charaExtra, chat, onlyExisting);
    for (const book of lorebooks) {
        const worldInfo = await getWorldInfoEntries(book);
        if (worldInfo?.length > 0) {
            results = results.concat(worldInfo);
        }
    }
    
    return results.sort(getWorldInfoSorter(results));
}

// Sorting offset table
const DEPTH_MAPPING = {
    [world_info_position.before]: 4, // Before Char Defs
    [world_info_position.after]: 3, // After Char Defs
    [world_info_position.EMTop]: 2, // Before Example Messages
    [world_info_position.EMBottom]: 1, // After Example Messages
    [world_info_position.ANTop]: 1, // Top of Author's Note
    [world_info_position.ANBottom]: -1, // Bottom of Author's Note
};

function getWorldInfoSorter(entries: WorldInfoEntry[]) {
    return (a: WorldInfoEntry, b: WorldInfoEntry) => worldInfoSorter(a, b, Math.max(...entries.map(x => x.position === world_info_position.atDepth ? x.depth : 0)));
}

function worldInfoSorter(a: WorldInfoEntry, b: WorldInfoEntry, top: number = DEFAULT_DEPTH) {
    function calcDepth(entry: WorldInfoEntry) {
        const offset = DEPTH_MAPPING[entry.position];

        // absolute depth
        if(offset == null)
            return entry.depth ?? DEFAULT_DEPTH;

        // relative to AN
        if(entry.position === world_info_position.ANTop || entry.position === world_info_position.ANBottom) {
            switch(chat_metadata.note_position) {
                case 0:
                case 2:
                    // After Main Prompt / Story String
                    return offset + top + DEPTH_MAPPING[world_info_position.before] + 2;
                case 1:
                    // In-chat @ Depth
                    return (chat_metadata.note_depth ?? DEFAULT_DEPTH) + (entry.depth ?? DEFAULT_DEPTH);
            }

            // note_position may be an unknown value, so ignore it
        }

        // relative to chat history with preset
        return offset + top;
    }

    // Sort by depth (desc), then order (asc), then uid (desc)
    return calcDepth(b) - calcDepth(a) ||
        a.order - b.order ||
        b.uid - a.uid;   
}

/**
 * Parse decorators from worldinfo content
 * @param content The content to parse
 * @returns The decorators found in the content and the content without decorators
 */
export function parseDecorators(content: string): [string[], string] {
    /**
     * Extract the base decorator name from a line (e.g., "@@depth 5" → "@@depth")
     * @param line The decorator line
     * @returns The base decorator name
     */
    const getBaseDecorator = (line: string): string => {
        // Remove possible leading '@@@' (escape)
        let candidate = line.startsWith('@@@') ? line.substring(1) : line;
        // Take the part before the first space as the decorator name
        const firstSpaceIndex = candidate.indexOf(' ');
        if (firstSpaceIndex !== -1) {
            candidate = candidate.substring(0, firstSpaceIndex);
        }
        return candidate;
    };

    /**
     * Check if the decorator is known
     * @param line The full decorator line (e.g., "@@depth 5")
     * @returns true if the base decorator is known
     */
    const isKnownDecorator = (line: string): boolean => {
        const base = getBaseDecorator(line);
        return KNOWN_DECORATORS.includes(base);
    };

    if (!content.startsWith('@@')) {
        return [[], content];
    }

    const lines = content.split('\n');
    const decorators: string[] = [];
    let contentStartIndex = 0;
    let fallbacked = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('@@')) {
            // Handle escapes: @@@xxx is treated as normal content unless fallbacked
            if (line.startsWith('@@@') && !fallbacked) {
                contentStartIndex = i;
                break;
            }

            if (isKnownDecorator(line)) {
                // Keep the original line (including arguments), but remove the escape prefix (if any)
                const normalizedLine = line.startsWith('@@@') ? line.substring(1) : line;
                decorators.push(normalizedLine);
                fallbacked = false;
            } else {
                fallbacked = true;
            }
        } else {
            contentStartIndex = i;
            break;
        }
    }

    const newContent = lines.slice(contentStartIndex).join('\n');
    return [decorators, newContent];
}

export function isSpecialEntry(entry: WorldInfoEntry, preload : boolean = false) : boolean {
    const title = entry.comment;
    if(title.includes('[GENERATE:') ||
        title.includes('[RENDER:') ||
        title.includes('@INJECT') ||
        title.includes('[InitialVariables]'))
        return true;
    
    const decorators = (entry.decorators ?? parseDecorators(entry.content)[0]).join(',');
    if(decorators.includes('@@generate') ||
        decorators.includes('@@render') ||
        decorators.includes('@@initial_variables'))
        return true;
    
    if(!preload && decorators.includes('@@only_preload'))
        return true;
    
    return false;
}

export function isPreprocessingEntry(entry: WorldInfoEntry) : boolean {
    if(entry.disable)
        return false;
    
    const title = entry.comment;
    if(title.includes('[Preprocessing]'))
        return true;

    const decorators = entry.decorators ?? parseDecorators(entry.content)[0];
    return decorators.includes('@@preprocessing');
}

export async function isConditionFiltedEntry(env: Record<string, unknown>, entry: WorldInfoEntry, options: EvalTemplateOptions = {}) : Promise<boolean> {
    if(entry.disable)
        return false;

    let condition = (entry.decorators ?? parseDecorators(entry.content)[0]).find(x => x.startsWith('@@if'));
    if(!condition)
        return false;
    
    // @if xxx to <%- !(xxx) %>
    return (await evalTemplateHandler(
        `<%- !!(${condition.substring(4)}) %>`,
        env,
        `lore book condition ${entry.world}/${entry.comment}/${entry.uid}`,
        {
            ...options,
            options: {
                filename: `worldinfo/${entry.world}/${entry.uid}-${entry.comment}/condition`,
                cache: settings.cache_enabled === 1, // enable for all
                ...(options.options ?? {}),
            }
        }
    )) === 'false';
}

export function isPrivateEntry(entry: WorldInfoEntry) : boolean {
    if(entry.disable)
        return false;
    
    const decorators = entry.decorators ?? parseDecorators(entry.content)[0];
    return decorators.includes('@@private');
}
