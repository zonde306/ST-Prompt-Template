import { extension_settings } from '../../../../../extensions.js';
import { hashString } from './hasher';

interface RegexEntry {
    search: RegExp | string;
    replace: string | ((substring: string, ...args: any[]) => string);
    user: boolean;
    assistant: boolean;
    system: boolean;
    worldinfo: boolean;
    order: number;
    sticky: number;
}

interface Regex {
    generateRegex: Map<string, RegexEntry>;
    messageRegex: Map<string, RegexEntry & {
        reasoning: boolean,
        minDepth: number,
        maxDepth: number,
        before: boolean,
        after: boolean,
        html: boolean,
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
    before?: boolean;
    after?: boolean;
    html?: boolean;
}

export interface RegexOptions extends RegexFlags {
    uuid?: string; // Unique ID, duplicates will be replaced, if not provided, a random ID will be generated
    message?: boolean; // chat messages
    generate?: boolean; // Generating
    basic?: boolean; // Built-in RegExp, Only string replacers are allowed
    order?: number; // Execution order, ascending
    sticky?: number; // times to keep active
}

/**
 * Inject RegExp
 * @param pattern Search RegExp
 * @param replace Replace content or function
 * @param opts Options
 */
export function activateRegex(
    pattern: string | RegExp,
    replace: string | ((substring: string, ...args: string[]) => string),
    opts: RegexOptions = {}
) {
    // If not provided, randomly generated
    const uuid = opts.uuid || hashString(`${pattern}@${replace}`, 0x0baddead);

    // By default, the built-in Regex is used.
    if(opts.basic || (opts.basic == null && opts.message == null && opts.generate == null)) {
        if(typeof replace !== 'string') {
            throw new Error('Basic mode regexes must have a string replace value.');
        }

        const exist = extension_settings.regex.find(x => x.id === uuid);
        if(exist) {
            exist.findRegex = pattern instanceof RegExp ? `/${pattern.source}/${pattern.flags}` : pattern;
            exist.replaceString = replace;
            exist.placement = _.compact([
                opts.user ?? true ? 1 : 0,
                opts.assistant ?? true ? 2 : 0,
                opts.worldinfo ?? true ? 5 : 0,
                opts.reasoning ?? true ? 6 : 0,
            ]);
        } else {
            extension_settings.regex.push({
                id: uuid,
                // use \u200b to mark temporary rules, which will be cleaned up later based on this mark
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
                sticky: opts.sticky ?? 0,
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
                before: opts.before ?? (opts.after ?? opts.html) == null,
                after: opts.after ?? false,
                html: opts.html ?? false,
                sticky: opts.sticky ?? 0,
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

export function deactivateRegex(selector: RegexSelector = {}, count : number = 1) {
    if(selector.uuid) {
        extension_settings.regex = extension_settings.regex.filter(x => x.id !== selector.uuid);
        const generate = REGEX.generateRegex.get(selector.uuid);
        if(generate) {
            generate.sticky -= count;
            if(generate.sticky <= 0)
                REGEX.generateRegex.delete(selector.uuid);
        }

        const message = REGEX.messageRegex.get(selector.uuid);
        if(message) {
            message.sticky -= count;
            if(message.sticky <= 0)
                REGEX.messageRegex.delete(selector.uuid);
        }
    } else {
        if(selector.basic)
            extension_settings.regex = extension_settings.regex.filter(x => !x.scriptName.startsWith('\u200b'));
        if(selector.generate) {
            for(const [uuid, regex] of Array.from(REGEX.generateRegex.entries())) {
                regex.sticky -= count;
                if(regex.sticky <= 0)
                    REGEX.generateRegex.delete(uuid);
            }
        }
        if(selector.message) {
            for(const [uuid, regex] of Array.from(REGEX.messageRegex.entries())) {
                regex.sticky -= count;
                if(regex.sticky <= 0)
                    REGEX.messageRegex.delete(uuid);
            }
        }
    }
}

/**
 * Apply RegExp to process the prompts
 * @param env EJS Execution Context
 * @param content prompts
 * @param selector RegExp to be executed
 * @param flags processing environment
 * @returns Processed content
 */
export function applyRegex(
    env: Record<string, unknown>,
    content : string,
    options: RegexSelector & RegexFlags & { depth?: number, role?: string } = {}
) : string {
    if(options.uuid) {
        // specified will not to be considered for filtering
        const message = REGEX.messageRegex.get(options.uuid);
        if(message) // @ts-expect-error: string.replace replaceValue is allow to pass a function
            content = content.replace(message.search, message.replace);
        
        const generate = REGEX.generateRegex.get(options.uuid);
        if(generate) // @ts-expect-error: string.replace replaceValue is allow to pass a function
            content = content.replace(generate.search, generate.replace);
    } else {
        if(options.message) {
            for(const regex of Array.from(REGEX.messageRegex.values()).sort((a, b) => a.order - b.order)) {
                // Allowed by default
                if(options.assistant && regex.assistant === false)
                    continue;
                if(options.user && regex.user === false)
                    continue;
                if(options.system && regex.system === false)
                    continue;

                // Disabled by default
                if(options.reasoning && !regex.reasoning)
                    continue;
                if(options.worldinfo && !regex.worldinfo)
                    continue;
                if(options.before && !regex.before)
                    continue;
                if(options.after && !regex.after)
                    continue;
                if(options.html && !regex.html)
                    continue;

                if(Number.isSafeInteger(options.depth)) {
                    if(regex.minDepth >= -1 && options.depth! < regex.minDepth)
                        continue;
                    if(regex.maxDepth >= 0 && options.depth! > regex.maxDepth)
                        continue;
                }
                
                // @ts-expect-error: string.replace replaceValue is allow to pass a function
                content = content.replace(regex.search, typeof regex.replace === 'function' ? regex.replace.bind(env) : regex.replace);
            }
        }
        if(options.generate) {
            for(const regex of Array.from(REGEX.generateRegex.values()).sort((a, b) => a.order - b.order)) {
                // Allowed by default
                if(options.role === 'user' && regex.user === false)
                    continue;
                if(options.role === 'assistant' && regex.assistant === false)
                    continue;
                if(options.role === 'system' && regex.system === false)
                    continue;

                // Disabled by default
                if(options.worldinfo && !regex.worldinfo)
                    continue;
                
                // @ts-expect-error: string.replace replaceValue is allow to pass a function
                content = content.replace(regex.search, typeof regex.replace === 'function' ? regex.replace.bind(env) : regex.replace);
            }
        }
    }

    return content;
}
