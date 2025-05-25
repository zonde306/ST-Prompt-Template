import ejs from '../3rdparty/ejs.js';
// @ts-expect-error
import vm from 'vm-browserify';
import { executeSlashCommandsWithOptions } from '../../../../../slash-commands.js';
import { getWorldInfoData, getWorldInfoActivatedEntries, getEnabledWorldInfoEntries, selectActivatedEntries, activateWorldInfo, getWorldInfoEntry, WorldInfoData } from './worldinfo';
import { allVariables, getVariable, setVariable, increaseVariable, decreaseVariable, STATE, SetVarOption, GetVarOption, GetSetVarOption } from './variables';
import { getCharaDefs, DEFAULT_CHAR_DEFINE, getCharaData } from './characters';
import { substituteParams, eventSource, this_chid, characters, chat_metadata, name1, name2, getCurrentChatId } from '../../../../../../script.js';
import { getPresetPromptsContent } from './presets';
import { getQuickReply, getQuickReplyData } from './quickreply';
import { getChatMessage, getChatMessages } from './chat';
import { fakerEnv } from './faker';
import check from 'syntax-error';
import { settings } from '../modules/ui';
import { activateRegex } from './regex';
import { h64 } from 'xxhashjs';
import { injectPrompt, getPromptsInjected } from './inject';
import { power_user } from '../../../../../power-user.js';
import { METADATA_KEY } from '../../../../../world-info.js';

// @ts-expect-error: 7034
import { groups, selected_group } from '../../../../../group-chats.js';

interface IncluderResult {
    filename: string;
    template: string;
}

export function include(originalPath: string, _parsedPath: string): IncluderResult {
    console.warn(`[Prompt Template] include not implemented`);
    return { filename: originalPath, template: '' };
}

export function escape(markup: string): string {
    // don't escape any XML tags
    return markup;
}

const SHARE_CONTEXT: Record<string, unknown> = {
    _,
    $,
    toastr,
    getCharaData,
    getWorldInfoData,
    getQuickReplyData,
    getWorldInfoActivatedData: getWorldInfoActivatedEntries,
    getEnabledWorldInfoEntries,
    selectActivatedEntries,
    activewi: activateWorldInfo,
    activateWorldInfo,
    getChatMessage,
    getChatMessages,
    activateRegex,
    injectPrompt,
    getPromptsInjected,
};

const CODE_TEMPLATE = `
    ejs.render(
        content,
        data,
        {
            async: true,
            escape: escaper,
            includer: includer,
            cache: false,
            context: data,
            client: false,
            outputFunctionName: 'print',
            localsName: 'locals',
            _with: true,
            ...options,
        },
    );
`;

export interface EjsOptions {
    cache?: boolean;    // Compiled functions are cached, requires `filename`
    filename?: string;  // The name of the file being rendered. Not required if you are using renderFile(). Used by cache to key caches, and for includes.
    root?: string | string[];   // Set template root(s) for includes with an absolute path (e.g, /file.ejs). Can be array to try to resolve include from multiple directories.
    views?: string[];   // An array of paths to use when resolving includes with relative paths.
    context?: Record<string, unknown>;  // Function execution context
    compileDebug?: boolean; // When false no debug instrumentation is compiled
    delimiter?: string; // When true, compiles a function that can be rendered in the browser without needing to load the EJS Runtime (ejs.min.js).
    client?: boolean;   // Character to use for inner delimiter, by default '%'
    openDelimiter?: string; // Character to use for opening delimiter, by default '<'
    closeDelimiter?: string;    // Character to use for closing delimiter, by default '>'
    debug?: boolean;    // Outputs generated function body
    strict?: boolean;   // When set to true, generated function is in strict mode
    _with?: boolean;    // Whether or not to use with() {} constructs. If false then the locals will be stored in the locals object. Set to false in strict mode.
    destructuredLocals?: string[];  // An array of local variables that are always destructured from the locals object, available even in strict mode.
    localsName?: string;    // Name to use for the object storing local variables when not using with Defaults to locals
    rmWhitespace?: boolean; // Remove all safe-to-remove whitespace, including leading and trailing whitespace. It also enables a safer version of -%> line slurping for all scriptlet tags (it does not strip new lines of tags in the middle of a line).
    escape?: ((markup: string) => string);  // The escaping function used with <%= construct. It is used in rendering and is .toString()ed in the generation of client functions. (By default escapes XML).
    outputFunctionName?: string;    // Set to a string (e.g., 'echo' or 'print') for a function to print output inside scriptlet tags.
    async?: boolean;    // When true, EJS will use an async function for rendering. (Depends on async/await support in the JS runtime).
    includer?: ((originalPath: string, parsedPath: string) => IncluderResult);  // Custom function to handle EJS includes, receives (originalPath, parsedPath) parameters, where originalPath is the path in include as-is and parsedPath is the previously resolved path. Should return an object { filename, template }, you may return only one of the properties, where filename is the final parsed path and template is the included content.
} 

export interface EvalTemplateOptions {
    escaper?: ((markup: string) => string) | undefined;
    includer?: (originalPath: string, parsedPath: string) => IncluderResult | undefined;
    logging?: boolean;
    when?: string;
    options?: EjsOptions;
    disableMarkup?: string;
}

function escapeEjsInDisabledBlocks(str : string, options : EjsOptions = {}, markup: string = 'escape-ejs') {
    const openDelimiter = options.openDelimiter || '<';
    const closeDelimiter = options.closeDelimiter || '>';
    const delimiter = options.delimiter || '%';
    const sepcialDelimiter = openDelimiter === '<' && closeDelimiter === '>' ? '' : '#';
    return str.replaceAll(new RegExp(`${openDelimiter}${sepcialDelimiter}${markup}${closeDelimiter}([\\s\\S]*?)${openDelimiter}${sepcialDelimiter}/${markup}${closeDelimiter}`, 'g'),
        (_match) => _match
                          .replaceAll(`${openDelimiter}${delimiter}`, `${openDelimiter}${delimiter}${delimiter}`)
                          .replaceAll(`${delimiter}${closeDelimiter}`, `${delimiter}${delimiter}${closeDelimiter}`),
    );
}

export async function evalTemplate(content: string, data: Record<string, unknown>,
    opts : EvalTemplateOptions = {}) {
    if (typeof content !== 'string') {
        console.error(`[Prompt Template] content is not a string`);
        return content;
    }

    // await eventSource.emit('prompt_template_evaluation', { content, data });

    // avoiding accidental evaluation
    let result = '';
    content = escapeEjsInDisabledBlocks(content, opts.options || {}, opts.disableMarkup || 'escape-ejs');
    content = escapeEjsInDisabledBlocks(content, opts.options || {}, 'thinking');
    content = escapeEjsInDisabledBlocks(content, opts.options || {}, 'think');
    content = escapeEjsInDisabledBlocks(content, opts.options || {}, 'reasoning');

    /*
    if(!opts.options?.destructuredLocals) {
        if(!opts.options)
            opts.options = {};
        
        // unpack variables
        opts.options.destructuredLocals = Object.keys(data);
    }
    */

    if(settings.cache_enabled && opts.options?.cache !== false) {
        if(opts.options?.filename) {
            opts.options.cache = true;
        } else {
            if(!opts.options)
                opts.options = {};
            opts.options.cache = true;
            opts.options.filename = h64(content, 0x1337).toString();
        }
    }
    
    try {
        result = await vm.runInNewContext(CODE_TEMPLATE, {
            ejs,
            content,
            data,
            escaper: opts.escaper || escape,
            includer: opts.includer || include,
            options: opts.options || {},
        });
    } catch (err) {
        if (opts.logging ?? true) {
            if(settings.debug_enabled) {
                const contentWithLines = content.split('\n').map((line, idx) => `${idx}: ${line}`).join('\n');
                console.debug(`[Prompt Template] when ${opts.when} has errors:\n${contentWithLines}`);
            }

            if (err instanceof SyntaxError)
                err.message += getSyntaxErrorInfo(content);

            console.error(err);

            // @ts-expect-error
            toastr.error(err.message, `EJS Template Error`);
        }
        throw err;
    }

    // await eventSource.emit('prompt_template_evaluation_post', { result, data });
    return result;
}

async function boundedReadWorldinfo(this: Record<string, unknown>,
    worldinfoOrEntry: string,
    entryOrData: string | RegExp | number | Record<string, unknown> = {},
    data: Record<string, unknown> = {}): Promise<string> {
    let wi : WorldInfoData | null = null;
    if(_.isPlainObject(entryOrData)) {
        // @ts-expect-error: 2339
        wi = await getWorldInfoEntry(this.world_info?.world || '', worldinfoOrEntry);
        if(_.isPlainObject(entryOrData)) {
            // @ts-expect-error: 2322
            data = entryOrData;
        }
    } else {
        // @ts-expect-error: 2339
        wi = await getWorldInfoEntry(worldinfoOrEntry || this.world_info?.world || '', entryOrData);
    }

    if (wi) {
        return await evalTemplate(substituteParams(wi.content),
            _.merge(this, data, { world_info: wi }),
            { when: `${wi.world}.${wi.comment}` },
        );
    }

    console.warn(`[Prompt Template] worldinfo ${worldinfoOrEntry} or entry ${entryOrData} not found`);
    return "";
}

async function boundedCharDef(this: Record<string, unknown>,
    name: string | RegExp, template: string = DEFAULT_CHAR_DEFINE,
    data: Record<string, unknown> = {}): Promise<string> {
    const defs = getCharaDefs(name);
    if (!defs) {
        console.warn(`[Prompt Template] character ${name} not found`);
        return "";
    }

    return substituteParams(
        await evalTemplate(template,
            _.merge(this, data, defs, { chara_name: defs.name }),
            { when: `${name}` },
        ),
        undefined, defs.name, undefined, undefined, false
    );
}

async function boundedPresetPrompt(this: Record<string, unknown>,
    name: string | RegExp,
    data: Record<string, unknown> = {}): Promise<string> {
    const prompt = getPresetPromptsContent(name);
    if (!prompt) {
        console.warn(`[Prompt Template] preset prompt ${name} not found`);
        return "";
    }

    return substituteParams(await evalTemplate(prompt,
        _.merge(this, data, { prompt_name: name }),
        { when: `${name}` },
    ));
}

export let SharedDefines: Record<string, unknown> = {};

function boundedDefine(this: Record<string, unknown>, name: string, value: unknown, merge: boolean = false) {
    // console.debug(`[Prompt Template] global ${name} defined: ${value}`);
    if (merge) {
        const oldValue = _.get(SharedDefines, name);
        if(_.isArray(oldValue) && _.isArray(value))
            value = _.concat(oldValue, value);
        else if(_.isPlainObject(oldValue) && _.isPlainObject(value))
            value = _.merge(oldValue, value);
    }

    _.set(SharedDefines, name, value);
    _.set(this, name, value);
}

function boundCloneDefines(self: Record<string, unknown>, defines: Record<string, unknown> | unknown[]) {
    let result: Record<string, unknown> | unknown[] = {};
    if (_.isArray(defines))
        result = [];

    for (const [name, value] of _.entries(defines)) {
        if (_.isFunction(value)) {
            // @ts-expect-error
            result[name] = value.bind(self);
        } else if (_.isArray(value) || _.isPlainObject(value)) {
            // @ts-expect-error
            result[name] = boundCloneDefines(self, value);
        } else {
            // @ts-expect-error
            result[name] = value;
        }
    }
    return result;
}

async function boundedQuickReply(this: Record<string, unknown>, name: string, label: string,
                                 data: Record<string, unknown> = {}
) {
    const reply = getQuickReply(name, label);
    if (!reply) {
        console.warn(`[Prompt Template] quick reply ${name}.${label} not found`);
        return '';
    }

    return substituteParams(await evalTemplate(reply,
        _.merge(this, data, { qr_name: name, qr_label: label }),
        { when: `${name}.${label}` },
    ));
}

async function boundedEvalTemplate(this: Record<string, unknown>, content: string,
                                   data: Record<string, unknown> = {},
                                   options: Record<string, unknown> = {}) {
    return substituteParams(await evalTemplate(content,
        _.merge(this, data),
        { when: `evalTemplate`, options }
    ));
}

export async function prepareContext(end: number = 65535, env: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    let vars = allVariables(end);
    STATE.cache = vars;
    let context = {
        ...SHARE_CONTEXT,
        variables: vars,
        execute: async (cmd: string) => (await executeSlashCommandsWithOptions(cmd)).pipe,
        SillyTavern: SillyTavern.getContext(),
        faker: fakerEnv.faker,
        userName: name1,
        assistantName: name2,
        chatId: getCurrentChatId(),
        characterId: this_chid,

        // @ts-expect-error: 7005
        groups,
        
        // @ts-expect-error: 7005
        groupId: selected_group,
        
        // @ts-expect-error: 2538
        charaLoreBook: characters[this_chid]?.data?.extensions?.world,
        personaLoreBook: power_user.persona_description_lorebook,
        // @ts-expect-error: 7053
        chatLoreBook: chat_metadata[METADATA_KEY],

        ...env,
        
        get vars() {
            return new WeakRef(STATE.cache);
        }
    };

    _.merge(context, {
        getwi: boundedReadWorldinfo.bind(context),
        getWorldInfo: boundedReadWorldinfo.bind(context),
        getchr: boundedCharDef.bind(context),
        getChara: boundedCharDef.bind(context),
        getprp: boundedPresetPrompt.bind(context),
        getPresetPrompt: boundedPresetPrompt.bind(context),
        define: boundedDefine.bind(context),
        setvar: setVariable.bind(context),
        setLocalVar: (k: string, v: unknown, o : SetVarOption = {}) => setVariable.call(context, k, v, { ...o, scope: 'local' }),
        setGlobalVar: (k: string, v: unknown, o : SetVarOption = {}) => setVariable.call(context, k, v, { ...o, scope: 'global' }),
        setMessageVar: (k: string, v: unknown, o : SetVarOption = {}) => setVariable.call(context, k, v, { ...o, scope: 'message' }),
        getvar: getVariable.bind(context),
        getLocalVar: (k: string, o : GetVarOption = {}) => getVariable.call(context, k, { ...o, scope: 'local' }),
        getGlobalVar: (k: string, o : GetVarOption = {}) => getVariable.call(context, k, { ...o, scope: 'global' }),
        getMessageVar: (k: string, o : GetVarOption = {}) => getVariable.call(context, k, { ...o, scope: 'message' }),
        incvar: increaseVariable.bind(context),
        incLocalVar: (k: string, v: number = 1, o : GetSetVarOption = {}) => increaseVariable.call(context, k, v, { ...o, outscope: 'local' }),
        incGlobalVar: (k: string, v: number = 1, o : GetSetVarOption = {}) => increaseVariable.call(context, k, v, { ...o, outscope: 'global' }),
        incMessageVar: (k: string, v: number = 1, o : GetSetVarOption = {}) => increaseVariable.call(context, k, v, { ...o, outscope: 'message' }),
        decvar: decreaseVariable.bind(context),
        decLocalVar: (k: string, v: number = 1, o : GetSetVarOption = {}) => decreaseVariable.call(context, k, v, { ...o, outscope: 'local' }),
        decGlobalVar: (k: string, v: number = 1, o : GetSetVarOption = {}) => decreaseVariable.call(context, k, v, { ...o, outscope: 'global' }),
        decMessageVar: (k: string, v: number = 1, o : GetSetVarOption = {}) => decreaseVariable.call(context, k, v, { ...o, outscope: 'message' }),
        getqr: boundedQuickReply.bind(context),
        getQuickReply: boundedQuickReply.bind(context),
        evalTemplate: boundedEvalTemplate.bind(context),
        ...boundCloneDefines(context, SharedDefines),
        ref: new WeakRef(context),
    });

    await eventSource.emit('prompt_template_prepare', context);

    if(settings.debug_enabled) {
        console.debug(`[Prompt Template] context prepared:`);
        console.debug(context);
    }

    return context;
}

const EJS_INCLUDE_REGEX = /^\s*include\s+(\S+)/;

// from: https://github.com/RyanZim/EJS-Lint/blob/master/index.js
export function lint(text: string, opts: Record<string, unknown> = {}) {
    const arr = new ejs.Template(text, opts).parseTemplateText();
    // Initialize mode var
    // This is used to indicate the status:
    // Inside Scriptlet, mode=1 (scriptlet) or mode=2 (expression)
    // Outside Scriptlet, mode=0
    let mode: number;
    // Initialize delimiter variable
    const d = opts.delimiter || '%';
    const js = arr
        .map((str : string) => {
            switch (str) {
                case `<${d}`:
                case `<${d}_`:
                    mode = 1;
                    return padWhitespace(str);
                case `<${d}=`:
                case `<${d}-`:
                    mode = 2;
                    return `;${padWhitespace(str)}`;
                case `${d}>`:
                case `-${d}>`:
                case `_${d}>`:
                    str = padWhitespace(str) + (mode === 2 ? ';' : '');
                    mode = 0;
                    return str;
                case (str.match(EJS_INCLUDE_REGEX) || {}).input:
                    // if old-style include
                    // - replace with whitespace if preprocessorInclude is set
                    // - otherwise, leave it intact so it errors out correctly
                    return opts.preprocessorInclude ? padWhitespace(str) : str;
                default:
                    // If inside Scriptlet, pass through
                    if (mode) return str;
                    // else, pad with whitespace
                    return padWhitespace(str);
            }
        })
        .join('');
    const checkOptions = {
        allowAwaitOutsideFunction: !!opts.await,
        locations: true,
    };
    let err = check(js, undefined, checkOptions);
    if(err) {
        err.message += ` at ${text.split('\n')[err.line - 1]}`;
    }

    return err;
}

function padWhitespace(text: string) {
    let res = '';
    text.split('\n').forEach((line, i) => {
        // Add newline
        if (i !== 0) res += '\n';
        // Pad with whitespace between each newline
        for (let x = 0; x < line.length; x++) res += ' ';
    });
    return res;
}

export function getSyntaxErrorInfo(code : string, count : number = 4) : string {
    const error = lint(code);
    if(!error) return '';

    const lines = code.split('\n');
    const line = error.line - 1;
    count = _.clamp(count, 0, lines.length);
    return `${lines.slice(line - count, line).join('\n')}\n${lines[line]}\n${' '.repeat(error.column - 1)}^\n${lines.slice(line + 1, line + count + 1).join('\n')}\n\nat line: ${line}, column: ${error.column}`;
}
