import ejs from '../3rdparty/ejs.js';
// @ts-expect-error
import vm from 'vm-browserify';
import _ from 'lodash';
import { executeSlashCommandsWithOptions } from '../../../../../slash-commands.js';
import { getWorldInfoEntryContent } from './worldinfo';
import { allVariables, getVariable, setVariable, increaseVariable, decreaseVariable, STATE, SetVarOption, GetVarOption, GetSetVarOption } from './variables';
import { getCharDefs, DEFAULT_CHAR_DEFINE } from './characters';
import { substituteParams, eventSource } from '../../../../../../script.js';
import { getPresetPromptsContent } from './presets';
import { fakerEnv } from './faker';
import check from 'syntax-error';

interface IncluderResult {
    filename: string;
    template: string;
}

function include(originalPath: string, _parsedPath: string): IncluderResult {
    console.warn(`[Prompt Template] include not implemented`);
    return { filename: originalPath, template: '' };
}

function escape(markup: string): string {
    // don't escape any XML tags
    return markup;
}

const SHARE_CONTEXT: Record<string, unknown> = {
    _,
    $,
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
        },
    );
`;

export async function evalTemplate(content: string, data: Record<string, unknown>,
    escaper: (markup: string) => string = escape,
    includer: (originalPath: string, parsedPath: string) => IncluderResult = include) {
    return await vm.runInNewContext(CODE_TEMPLATE, {
        ejs,
        content,
        data,
        escaper: escaper,
        includer: includer,
    });
}

async function boundedImport(this: Record<string, unknown>,
    worldinfo: string, entry: string | RegExp | number,
    data: Record<string, unknown> = {}): Promise<string> {
    // maybe not
    this.getwi = boundedImport.bind(this);
    const content = await getWorldInfoEntryContent(worldinfo, entry);
    if (content) {
        // or use _.merge?
        return await evalTemplate(substituteParams(content), { ...this, ...data });
    }

    console.warn(`[Prompt Template] worldinfo ${worldinfo} or entry ${entry} not found`);
    return "";
}

async function boundedCharDef(this: Record<string, unknown>,
    name: string | RegExp, template: string = DEFAULT_CHAR_DEFINE,
    data: Record<string, unknown> = {}): Promise<string> {
    // maybe not
    this.getchr = boundedCharDef.bind(this);
    const defs = getCharDefs(name);
    if (!defs) {
        console.warn(`[Prompt Template] character ${name} not found`);
        return "";
    }

    return substituteParams(await evalTemplate(template, { ...this, ...data, ...defs }),
        undefined, defs.name, undefined, undefined, false);
}

async function boundedPresetPrompt(this: Record<string, unknown>,
    name: string | RegExp,
    data: Record<string, unknown> = {}): Promise<string> {
    // maybe not
    this.getprp = boundedPresetPrompt.bind(this);
    const prompt = getPresetPromptsContent(name);
    if (!prompt) {
        console.warn(`[Prompt Template] preset prompt ${name} not found`);
        return "";
    }

    return substituteParams(await evalTemplate(prompt, { ...this, ...data }));
}

let SharedDefines: Record<string, unknown> = {};

function boundedDefine(this: Record<string, unknown>, name: string, value: unknown) {
    console.debug(`[Prompt Template] global ${name} defined: ${value}`);
    SharedDefines[name] = value;
    this[name] = value;
}

function boundCloneDefines(self: Record<string, unknown>, defines: Record<string, unknown> | unknown[]) {
    let result: Record<string, unknown> | unknown[] = {};
    if (defines instanceof Array)
        result = [];

    for (const name in defines) {
        // @ts-expect-error
        const value = defines[name];
        if (typeof value === 'function') {
            // @ts-expect-error
            result[name] = value.bind(self);
        } else if (typeof value === 'object' && value !== null) {
            // @ts-expect-error
            result[name] = boundCloneDefines.call(self, value);
        } else {
            // @ts-expect-error
            result[name] = value;
        }
    }
    return result;
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
        ...env,

        get vars() {
            return new WeakRef(STATE.cache);
        }
    };

    _.merge(context, {
        getwi: boundedImport.bind(context),
        getWorldInfo: boundedImport.bind(context),
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
        ...boundCloneDefines(context, SharedDefines),
        ref: new WeakRef(context),
    });

    await eventSource.emit('prompt_template_prepare', context);

    console.debug(`[Prompt Template] context prepared:`);
    console.debug(context);

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

// @ts-expect-error
window.evalTemplate = async(code : string, context : Record<string, unknown> = {}) => {
    STATE.isDryRun = false;
    return await evalTemplate(code, context);
};

// @ts-expect-error
window.prepareContext = prepareContext;
// @ts-expect-error
window.getSyntaxErrorInfo = getSyntaxErrorInfo;
