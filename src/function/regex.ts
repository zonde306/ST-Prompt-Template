import { extension_settings } from '../../../../../extensions.js';

interface RegexEntry {
    search: RegExp | string,
    replace: string | ((substring: string, ...args: any[]) => string),
    user: boolean,
    assistant: boolean,
    system: boolean,
    worldinfo: boolean,
    order: number,
}

interface Regex {
    generateRegex: Map<string, RegexEntry>;
    messageRegex: Map<string, RegexEntry & {
        reasoning: boolean,
        minDepth: number,
        maxDepth: number,
        raw: boolean,
        display: boolean,
    }>;
}

const REGEX : Regex = {
    generateRegex: new Map(),
    messageRegex: new Map(),
};

export interface RegexFlags {
    user?: boolean;
    assistant?: boolean;
    reasoning?: boolean;
    system?: boolean;
    minDepth?: number;
    maxDepth?: number;
    worldinfo?: boolean;
    raw?: boolean;
    display?: boolean;
}

export interface RegexOptions extends RegexFlags {
    uuid?: string;
    message?: boolean;
    generate?: boolean;
    basic?: boolean;
    order?: number;
}

export function activateRegex(
    pattern: string | RegExp,
    replace: string | ((substring: string, ...args: any[]) => string),
    opts: RegexOptions = {}
) {
    const uuid = opts.uuid || 'regex-' + Math.random().toString(36).substring(2, 9);
    if(opts.basic !== false) {
        if(typeof replace !== 'string') {
            throw new Error('Basic mode regexes must have a string replace value.');
        }

        const regex = extension_settings.regex.find(x => x.id === uuid);
        if(regex) {
            regex.findRegex = pattern instanceof RegExp ? `/${pattern.source}/${pattern.flags}` : pattern;
            regex.replaceString = replace;
            regex.placement = _.compact([
                opts.user ?? true ? 1 : 0,
                opts.assistant ?? true ? 2 : 0,
                opts.worldinfo ?? true ? 5 : 0,
                opts.reasoning ?? true ? 6 : 0,
            ]);
        } else {
            extension_settings.regex.push({
                id: uuid,
                scriptName: `\u200b${uuid}`,
                findRegex: pattern instanceof RegExp ? pattern.source : pattern,
                replaceString: replace,
                trimStrings: [],
                placement: _.compact([
                    opts.user ?? true ? 1 : 0,
                    opts.assistant ?? true ? 2 : 0,
                    opts.worldinfo ?? false ? 5 : 0,
                    opts.reasoning ?? true ? 6 : 0,
                ]),
                disabled: false,
                markdownOnly: false,
                promptOnly: true,
                runOnEdit: false,
                substituteRegex: 0,
                minDepth: opts.minDepth ?? NaN,
                maxDepth: opts.minDepth ?? NaN,
            });
        }
    }

    if(opts.generate) {
        REGEX.generateRegex.set(
            uuid,
            {
                search: pattern,
                replace,
                user: opts.user ?? true,
                assistant: opts.assistant ?? true,
                system: opts.system ?? true,
                worldinfo: opts.worldinfo ?? false,
                order: opts.order ?? 100,
            }
        );
    }

    if(opts.message) {
        REGEX.messageRegex.set(
            uuid,
            {
                search: pattern,
                replace,
                user: opts.user ?? true,
                assistant: opts.assistant ?? true,
                system: opts.system ?? true,
                reasoning: opts.reasoning ?? false,
                worldinfo: opts.worldinfo ?? false,
                order: opts.order ?? 100,
                minDepth: opts.minDepth ?? NaN,
                maxDepth: opts.minDepth ?? NaN,
                raw: opts.raw ?? true,
                display: opts.display ?? false,
            }
        );
    }
}

export interface RegexSelector {
    uuid?: string;
    basic?: boolean;
    message?: boolean;
    generate?: boolean;
}

export function deactivateRegex(selector: RegexSelector = {}) {
    if(selector.uuid) {
        extension_settings.regex = extension_settings.regex.filter(x => x.id !== selector.uuid);
        REGEX.generateRegex.delete(selector.uuid);
        REGEX.messageRegex.delete(selector.uuid);
    } else {
        if(selector.basic)
            extension_settings.regex = extension_settings.regex.filter(x => !x.scriptName.startsWith('\u200b'));
        if(selector.generate)
            REGEX.generateRegex.clear();
        if(selector.message)
            REGEX.messageRegex.clear();
    }
}

export function applyRegex(
    this: Record<string, unknown>,
    content : string,
    selector: RegexSelector = {},
    flags: RegexFlags & { depth?: number, role?: string } = {}
) : string {
    if(selector.uuid) {
        const message = REGEX.messageRegex.get(selector.uuid);
        if(message) // @ts-expect-error: string.replace replaceValue is allow to pass a function
            content = content.replace(message.search, message.replace);
        
        const generate = REGEX.generateRegex.get(selector.uuid);
        if(generate) // @ts-expect-error: string.replace replaceValue is allow to pass a function
            content = content.replace(generate.search, generate.replace);
    } else {
        if(selector.message) {
            for(const regex of Array.from(REGEX.messageRegex.values()).sort((a, b) => a.order - b.order)) {
                if(flags.assistant && regex.assistant === false)
                    continue;
                if(flags.user && regex.user === false)
                    continue;
                if(flags.reasoning && regex.reasoning === false)
                    continue;
                if(flags.worldinfo && regex.worldinfo === false)
                    continue;
                if(flags.system && regex.system === false)
                    continue;
                if(flags.raw && regex.raw === false)
                    continue;
                if(flags.display && regex.display === false)
                    continue;
                if(flags.depth != null && Number.isSafeInteger(flags.depth)) {
                    if(Number.isSafeInteger(regex.minDepth) && regex.minDepth >= -1 && flags.depth < regex.minDepth)
                        continue;
                    if(Number.isSafeInteger(regex.maxDepth) && regex.maxDepth >= 0 && flags.depth > regex.maxDepth)
                        continue;
                }
                
                // @ts-expect-error: string.replace replaceValue is allow to pass a function
                content = content.replace(regex.search, typeof regex.replace === 'function' ? regex.replace.bind(this) : regex.replace);
            }
        }
        if(selector.generate) {
            for(const regex of Array.from(REGEX.generateRegex.values()).sort((a, b) => a.order - b.order)) {
                if(flags.role === 'user' && regex.user === false)
                    continue;
                if(flags.role === 'assistant' && regex.assistant === false)
                    continue;
                if(flags.role === 'system' && regex.system === false)
                    continue;
                if(flags.worldinfo && regex.worldinfo === false)
                    continue;
                
                // @ts-expect-error: string.replace replaceValue is allow to pass a function
                content = content.replace(regex.search, typeof regex.replace === 'function' ? regex.replace.bind(this) : regex.replace);
            }
        }
    }

    return content;
}
