import ejs from '../3rdparty/ejs.js';
// @ts-expect-error
import vm from 'vm-browserify';
import _ from 'lodash';
import { executeSlashCommandsWithOptions } from '../../../../../slash-commands.js';
import { getWorldInfoEntryContent } from './worldinfo';
import { allVariables, getVariable, setVariable, increaseVariable, decreaseVariable } from './variables';
import { getCharDefs, DEFAULT_CHAR_DEFINE } from './characters';
import { substituteParams, eventSource } from '../../../../../../script.js';
import { getPresetPromptsContent } from './presets';

interface IncluderResult {
    filename: string;
    template: string;
}

function includer(originalPath : string, _parsedPath: string) : IncluderResult {
    console.warn(`[Prompt Template] include not implemented`);
    return { filename: originalPath, template: '' };
}

function escape(markup : string) : string {
    // don't escape any XML tags
    return markup;
}

const SHARE_CONTEXT : Record<string, unknown> = {
    decodeURIComponent,
    encodeURIComponent,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    console,
    decodeURI,
    encodeURI,
    Boolean,
    Number,
    BigInt,
    String,
    Object,
    Array,
    Symbol,
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Promise,
    Intl,
    JSON,
    Math,
    _,
    $,
};

const CODE_TEMPLATE = `\
    ejs.render(
        content,
        data,
        { async: true, escape: escaper, includer: includer, cache: false, context: data },
    );\
`;

export async function evalTemplate(content: string, data: Record<string, unknown>) {
    return await vm.runInNewContext(CODE_TEMPLATE, {
        ejs,
        content,
        data,
        escaper: escape,
        includer: includer,
    });
}

async function bindImport(env: Record<string, unknown>,
                          worldinfo: string, entry: string | RegExp | number,
                          data: Record<string, unknown> = {}): Promise<string> {
    // maybe not
    env.getwi = bindImport.bind(null, env);
    const content = await getWorldInfoEntryContent(worldinfo, entry);
    if(content) {
        // or use _.merge?
        return await evalTemplate(substituteParams(content), { ...env, ...data });
    }

    console.warn(`[Prompt Template] worldinfo ${worldinfo} or entry ${entry} not found`);
    return "";
}

async function bindCharDef(env: Record<string, unknown>,
                           name: string | RegExp, template: string = DEFAULT_CHAR_DEFINE,
                           data: Record<string, unknown> = {}) : Promise<string> {
    // maybe not
    env.getchr = bindCharDef.bind(null, env);
    const defs = getCharDefs(name);
    if(!defs) {
        console.warn(`[Prompt Template] character ${name} not found`);
        return "";
    }

    return substituteParams(await evalTemplate(template, { ...env, ...data, ...defs }),
                            undefined, defs.name, undefined, undefined, false);
}

async function bindPresetPrompt(env: Record<string, unknown>,
                                name : string | RegExp,
                                data : Record<string, unknown> = {}) : Promise<string> {
    // maybe not
    env.getprp = bindPresetPrompt.bind(null, env);
    const prompt = getPresetPromptsContent(name);
    if(!prompt) {
        console.warn(`[Prompt Template] preset prompt ${name} not found`);
        return "";
    }

    return substituteParams(await evalTemplate(prompt, { ...env, ...data }));
}

export async function prepareGlobals(end : number = 65535) {
    let vars = allVariables(end);
    let result = {
        ...SHARE_CONTEXT,
        variables: vars,
        execute: async(cmd : string) => (await executeSlashCommandsWithOptions(cmd)).pipe,
        setvar: setVariable.bind(null, vars),
        getvar: getVariable.bind(null, vars),
        incvar: increaseVariable.bind(null, vars),
        decvar: decreaseVariable.bind(null, vars),
        SillyTavern: SillyTavern.getContext(),
    };

    // @ts-expect-error
    result.getwi = bindImport.bind(null, result);
    // @ts-expect-error
    result.getchr = bindCharDef.bind(null, result);
    // @ts-expect-error
    result.getprp = bindPresetPrompt.bind(null, result);

    await eventSource.emit('prompt_template_prepare', result);
    return result;
}

