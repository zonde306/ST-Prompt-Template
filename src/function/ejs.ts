import ejs from '../3rdparty/ejs.js';
// @ts-expect-error
import vm from 'vm-browserify';
import _ from 'lodash';
import { executeSlashCommandsWithOptions } from '../../../../../slash-commands.js';
import { getWorldInfoEntryContent } from './worldinfo';
import { allVariables, getVariable, setVariable, increaseVariable, decreaseVariable } from './variables';
import { getCharDefs, DEFAULT_CHAR_DEFINE } from './characters';
import { substituteParams } from '../../../../../../script.js';

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

async function formatCharDef(name: string | RegExp) : Promise<string> {
    const defs = getCharDefs(name);
    if(!defs) {
        console.warn(`[Prompt Template] character ${name} not found`);
        return "";
    }

    return substituteParams(await evalTemplate(DEFAULT_CHAR_DEFINE, defs),
                            undefined, defs.name, undefined, undefined, false);
}


export function prepareGlobals(end : number = 65535) {
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
        getchr: formatCharDef,
    };

    // @ts-expect-error
    result.getwi = bindImport.bind(null, result);
    return result;
}

