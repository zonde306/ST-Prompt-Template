import ejs from './3rdparty/ejs.js';
// @ts-expect-error
import vm from 'vm-browserify';
import _ from 'lodash';
import { ChatData, Message } from './defines';
import { eventSource, event_types, chat, saveChatDebounced } from '../../../../../script.js';
import { saveMetadataDebounced } from '../../../../extensions.js';
import { executeSlashCommandsWithOptions } from '../../../../slash-commands.js';
import { getWorldInfoEntryContent } from './function/worldinfo';
import { allVariables, getVariable, setVariable, increaseVariable, decreaseVariable } from './function/variables';

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
    $: jQuery,
};

const CODE_TEMPLATE = `\
    ejs.render(
        content,
        env,
        { async: true, client: true, strict: true, escape: escaper, includer: includer, cache: false },
    );\
`;

async function evalTemplate(env: Record<string, unknown>, content: string) {
    return await vm.runInNewContext(CODE_TEMPLATE, {
        env,
        content,
        escaper: escape,
        includer: includer,
    });
}

async function bindImport(env: Record<string, unknown>, worldinfo: string, entry: string): Promise<unknown> {
    const content = await getWorldInfoEntryContent(worldinfo, entry);
    if(content)
        return await evalTemplate(env, content);

    console.warn(`[Prompt Template] worldinfo ${worldinfo} or entry ${entry} not found`);
    return undefined;
}

function prepareGlobals() {
    let vars = allVariables();
    let result = {
        ...SHARE_CONTEXT,
        variables : vars,
        execute: async(cmd : string) => (await executeSlashCommandsWithOptions(cmd)).pipe,
        setvar : setVariable.bind(null, vars),
        getvar : getVariable.bind(null, vars),
        incvar : increaseVariable.bind(null, vars),
        decvar : decreaseVariable.bind(null, vars),
        SillyTavern: SillyTavern.getContext(),
    };

    // @ts-expect-error
    result.import = bindImport.bind(null, result);
    return result;
}

async function updateChat(data : ChatData) {
    const env = prepareGlobals();

    let err = false;
    for(const message of data.chat) {
        try {
            message.content = await evalTemplate(env, message.content);
        } catch(err) {
            console.error(`error for chat message ${message.content}`);
            console.error(err);
            err = true;
        }
    }

    if(err) return;
    saveMetadataDebounced();
    saveChatDebounced();
}

async function updateMessage(message_id : string) {
    const message_idx = parseInt(message_id);
    const message : Message = chat[message_idx];
    if(!message) {
        console.error(`message ${message_id} not found`);
        return;
    }

    const env = prepareGlobals();

    try {
        message.mes = await evalTemplate(env, message.mes);
    } catch(err) {
        console.error(`error for message ${message.mes}`);
        console.error(err);
        return;
    }

    saveMetadataDebounced();
    saveChatDebounced();
}

export async function init() {
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, updateChat);
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, updateMessage);
    eventSource.on(event_types.USER_MESSAGE_RENDERED, updateMessage);
    eventSource.on(event_types.CHAT_CHANGED, updateMessage);
    eventSource.on(event_types.MESSAGE_SWIPED, updateMessage);
}

export async function exit() {
    eventSource.removeListener(event_types.CHAT_COMPLETION_PROMPT_READY, updateChat);
    eventSource.removeListener(event_types.CHARACTER_MESSAGE_RENDERED, updateMessage);
    eventSource.removeListener(event_types.USER_MESSAGE_RENDERED, updateMessage);
    eventSource.removeListener(event_types.CHAT_CHANGED, updateMessage);
    eventSource.removeListener(event_types.MESSAGE_SWIPED, updateMessage);
}

