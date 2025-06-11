import { extension_settings } from '../../../../../extensions.js';

interface Regex {
    generateRegex: Set<string>;
    messageRegex: Map<string, { search: RegExp | string, replace: string | Function }>;
}

export const REGEX : Regex = {
    generateRegex: new Set(),
    messageRegex: new Map(),
};

interface RegexOptions {
    uuid?: string;
    minDepth?: number;
    maxDepth?: number;
    user?: boolean;
    assistant?: boolean;
    worldinfo?: boolean;
    reasoning?: boolean;
    message?: boolean;
}

export function activateRegex(pattern: string | RegExp, replace: string | Function, opts: RegexOptions = {}) {
    const uuid = opts.uuid || 'regex-' + Math.random().toString(36).substring(2, 9);
    if(REGEX.generateRegex.has(uuid)) {
        const regex = extension_settings.regex.find(x => x.id === uuid);
        if(regex && typeof replace === 'string') {
            regex.findRegex = pattern instanceof RegExp ? `/${pattern.source}/${pattern.flags}` : pattern;
            regex.replaceString = replace;
            regex.placement = _.compact([
                opts.user ?? true ? 1 : 0,
                opts.assistant ?? true ? 2 : 0,
                opts.worldinfo ?? true ? 5 : 0,
                opts.reasoning ?? true ? 6 : 0,
            ]);
        }
    } else if(opts.message) {
        REGEX.messageRegex.set(
            uuid,
            {
                search: pattern,
                replace
            }
        );
    } else if(typeof replace === 'string') {
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
        REGEX.generateRegex.add(uuid);
    }
}

export function deactivateRegex(uuid?: string) {
    if(uuid) {
        if(REGEX.generateRegex.has(uuid)) {
            const idx = extension_settings.regex.findLastIndex(x => x.id === uuid);
            if(idx > -1)
                extension_settings.regex.splice(idx, 1);

            REGEX.generateRegex.delete(uuid);
        }
    } else {
        extension_settings.regex = extension_settings.regex.filter(x => !x.scriptName.startsWith('\u200b'));
        REGEX.generateRegex.clear();
    }
}

export function deactivateMessageRegex(uuid?: string) {
    if(uuid) {
        REGEX.messageRegex.delete(uuid);
    } else {
        REGEX.messageRegex.clear();
    }
}

export function applyMessageRegex(content: string) {
    // @ts-expect-error: string.replace replaceValue is allow to pass a function
    REGEX.messageRegex.forEach(x => content = content.replace(x.search, x.replace));
    return content;
}
