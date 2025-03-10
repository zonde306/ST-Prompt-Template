import { loadWorldInfo } from '../../../../../world-info.js';

export interface WorldInfoData {
    uid: number;
    key: string[];
    keysecondary: string[];
    comment: string;
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
}

export interface WorldInfo {
    entries: Record<string, WorldInfoData>;
}

export async function* getWorldInfoAll(name: string): AsyncGenerator<WorldInfoData> {
    // @ts-expect-error
    const lorebook : WorldInfo | null = await loadWorldInfo(name);
    if(!lorebook)
        return;

    for(const data of _.values(lorebook.entries))
        yield data;
}

export async function* getWorldInfoTitles(name: string): AsyncGenerator<string> {
    for await (const data of getWorldInfoAll(name))
        yield data.comment;
}

export async function getWorldInfoEntry(name: string, title: string | RegExp | number): Promise<WorldInfoData | null> {
    for await (const data of getWorldInfoAll(name))
        // @ts-expect-error
        if(data.comment === title || data.uid === title || data.comment.match(title))   // String.match(number) just returns null
            return data;

    return null;
}

export async function getWorldInfoEntryContent(name: string, title: string | RegExp | number): Promise<string | null> {
    const data = await getWorldInfoEntry(name, title);
    if(!data) return null;

    return data.content;
}
