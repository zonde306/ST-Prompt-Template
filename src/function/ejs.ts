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
import { fakerEnv } from './faker';


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
        { async: true, escape: escaper, includer: includer, cache: false, context: data, client: true },
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

async function boundedImport(this: Record<string, unknown>,
                          worldinfo: string, entry: string | RegExp | number,
                          data: Record<string, unknown> = {}): Promise<string> {
    // maybe not
    this.getwi = boundedImport.bind(this);
    const content = await getWorldInfoEntryContent(worldinfo, entry);
    if(content) {
        // or use _.merge?
        return await evalTemplate(substituteParams(content), { ...this, ...data });
    }

    console.warn(`[Prompt Template] worldinfo ${worldinfo} or entry ${entry} not found`);
    return "";
}

async function boundedCharDef(this: Record<string, unknown>,
                           name: string | RegExp, template: string = DEFAULT_CHAR_DEFINE,
                           data: Record<string, unknown> = {}) : Promise<string> {
    // maybe not
    this.getchr = boundedCharDef.bind(this);
    const defs = getCharDefs(name);
    if(!defs) {
        console.warn(`[Prompt Template] character ${name} not found`);
        return "";
    }

    return substituteParams(await evalTemplate(template, { ...this, ...data, ...defs }),
                            undefined, defs.name, undefined, undefined, false);
}

async function boundedPresetPrompt(this: Record<string, unknown>,
                                name : string | RegExp,
                                data : Record<string, unknown> = {}) : Promise<string> {
    // maybe not
    this.getprp = boundedPresetPrompt.bind(this);
    const prompt = getPresetPromptsContent(name);
    if(!prompt) {
        console.warn(`[Prompt Template] preset prompt ${name} not found`);
        return "";
    }

    return substituteParams(await evalTemplate(prompt, { ...this, ...data }));
}

let SharedDefines : Record<string, unknown> = {};

function boundedDefine(this: Record<string, unknown>, name : string, value : unknown) {
    console.debug(`[Prompt Template] global ${name} defined: ${value}`);
    SharedDefines[name] = value;
    this[name] = value;
}

function boundCloneDefines(self: Record<string, unknown>, defines : Record<string, unknown> | unknown[]) {
    let result : Record<string, unknown> | unknown[] = {};
    if(defines instanceof Array)
        result = [];

    for(const name in defines) {
        // @ts-expect-error
        const value = defines[name];
        if(typeof value === 'function') {
            // @ts-expect-error
            result[name] = value.bind(self);
        } else if(typeof value === 'object' && value !== null) {
            // @ts-expect-error
            result[name] = boundCloneDefines.call(self, value);
        } else {
            // @ts-expect-error
            result[name] = value;
        }
    }
    return result;
}

export async function prepareContext(end : number = 65535, env : Record<string, unknown> = {}) : Promise<Record<string, unknown>> {
    let vars = allVariables(end);
    let context = {
        ...SHARE_CONTEXT,
        variables: vars,
        execute: async(cmd : string) => (await executeSlashCommandsWithOptions(cmd)).pipe,
        SillyTavern: SillyTavern.getContext(),
        faker: fakerEnv.faker,
        ...env,
    };

    _.merge(context, {
        getwi: boundedImport.bind(context),
        getchr: boundedCharDef.bind(context),
        getprp: boundedPresetPrompt.bind(context),
        define: boundedDefine.bind(context),
        setvar: setVariable.bind(context),
        getvar: getVariable.bind(context),
        incvar: increaseVariable.bind(context),
        decvar: decreaseVariable.bind(context),
        ...boundCloneDefines(context, SharedDefines),
    });

    await eventSource.emit('prompt_template_prepare', context);

    console.debug(`[Prompt Template] context prepared:`);
    console.debug(context);

    return context;
}

