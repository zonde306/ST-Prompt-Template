import ejs from './3rdparty/ejs.js';
// @ts-expect-error
import vm from 'vm-browserify';
import _ from 'lodash';
import { eventSource, event_types, chat, chat_metadata, saveChatDebounced } from '../../../../../script.js';
import { saveMetadataDebounced, extension_settings } from '../../../../extensions.js';
import { executeSlashCommandsWithOptions } from '../../../../slash-commands.js';

interface Chat {
    role: string;
    content: string;
}

interface ChatData {
    chat: Chat[];
    dryRun: boolean;
}

interface Message {
    extra: Record<string, unknown>;
    is_system: boolean;
    is_user: boolean;
    mes: string;
    name: string;
    send_date: string;
    variables?: Record<number, Record<string, unknown>>;
    swipe_id: number;
    swipe_info: Array<unknown>;
    swipes: Array<string>;
}

interface Metadata {
    variables?: Record<string, unknown>;
}

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
        { ...global, SillyTavern, variables, setvar, execute },
        { async: true, client: true, strict: true, escape: escaper, includer: includer },
    );\
`;

function allVariables() {
    let variables : Record<string, unknown> = {};
    variables = _.merge(variables, extension_settings.variables.global);

    const metadata : Metadata = chat_metadata;
    variables = _.merge(variables, metadata.variables || {});

    const messages : Array<Message> = chat;
    for(const message of messages)
        if(message.variables && message.variables[message.swipe_id])
            variables = _.merge(variables, message.variables[message.swipe_id]);
    return variables;
}

function setVariable(vars : Record<string, unknown>, key : string, value : unknown,
                      index: number | null = null,
                      scope : 'global' | 'local' | 'message' = 'message',
                      flags: 'nx' | 'xx' | 'n' = 'n') {
    let message : Message;
    if (index !== null && index !== undefined) {
        // @ts-expect-error: TS2322
        let data = JSON.parse(_.get(vars, key, '{}'));
        let idx = Number(index);
        idx = Number.isNaN(idx) ? index : idx;

        if(flags === 'nx' && _.has(data, idx)) return vars;
        if(flags === 'xx' && !_.has(data, idx)) return vars;

        _.set(vars, key, JSON.stringify(_.set(data, idx, value)));

        switch(scope) {
            case 'global':
                data = JSON.parse(_.get(extension_settings.variables.global, key, '{}') || '{}');
                _.set(extension_settings.variables.global, key, JSON.stringify(_.set(data, idx, value)));
                break;
            case 'local':
                // @ts-expect-error: TS2322
                if(!chat_metadata.variables) chat_metadata.variables = {};
                // @ts-expect-error: TS2322
                data = JSON.parse(_.get(chat_metadata.variables, key, '{}') || '{}');
                // @ts-expect-error: TS2322
                _.set(chat_metadata.variables, key, JSON.stringify(_.set(data, idx, value)));
                break;
            case 'message':
                message = chat.findLast(msg => !msg.is_system);
                if(!message.variables) message.variables = {};
                if(!message.variables[message.swipe_id]) message.variables[message.swipe_id] = {};
                // @ts-expect-error: TS2322
                data = JSON.parse(_.get(message.variables[message.swipe_id], key, '{}') || '{}');
                _.set(message.variables[message.swipe_id], key, JSON.stringify(_.set(data, idx, value)));
                break;
        }
    } else {
        if(flags === 'nx' && _.has(vars, key)) return vars;
        if(flags === 'xx' && !_.has(vars, key)) return vars;

        _.set(vars, key, value);

        switch(scope) {
            case 'global':
                _.set(extension_settings.variables.global, key, value);
                break;
            case 'local':
                // @ts-expect-error: TS2322
                if(!chat_metadata.variables) chat_metadata.variables = {};
                // @ts-expect-error: TS2322
                _.set(chat_metadata.variables, key, value);
                break;
            case 'message':
                message = chat.findLast(msg => !msg.is_system);
                if(!message.variables) message.variables = {};
                if(!message.variables[message.swipe_id]) message.variables[message.swipe_id] = {};
                _.set(message.variables[message.swipe_id], key, value);
                break;
        }
    }

    return vars;
}

function getVariable(vars : Record<string, unknown>, key : string,
                    index: number | null = null,
                    defaults: unknown = undefined) {
    if (index !== null && index !== undefined) {
        // @ts-expect-error: TS2322
        const data = JSON.parse(_.get(vars, key, '{}') || '{}');
        const idx = Number(index);
        return _.get(data, idx, defaults);
    }

    return _.get(vars, key, defaults);
}

function increaseVariable(vars : Record<string, unknown>, key : string,
                          value : number = 1,
                          index: number | null = null,
                          scope : 'global' | 'local' | 'message' = 'message',
                          flags: 'nx' | 'xx' | 'n' = 'n') {
    if((flags === 'nx' && !_.has(vars, key)) ||
      (flags === 'xx' && _.has(vars, key)) ||
      flags === 'n')
        return setVariable(vars, key, getVariable(vars, key, index, 0) + value, index, scope, 'n');
    return vars;
}

function decreaseVariable(vars : Record<string, unknown>, key : string,
                          value : number = 1,
                          index: number | null = null,
                          scope : 'global' | 'local' | 'message' = 'message',
                          flags: 'nx' | 'xx' | 'n' = 'n') {
    return increaseVariable(vars, key, -value, index, scope, flags);
}

function prepareGlobals() {
    let vars = allVariables();
    return {
        global: { ...SHARE_CONTEXT },
        ejs,
        variables : vars,
        execute: async(cmd : string) => (await executeSlashCommandsWithOptions(cmd)).pipe,
        setvar : setVariable.bind(null, vars),
        getvar : getVariable.bind(null, vars),
        incvar : increaseVariable.bind(null, vars),
        decvar : decreaseVariable.bind(null, vars),
        SillyTavern: SillyTavern.getContext(),
        escaper: escape,
        includer: includer,
    };
}

async function updateChat(data : ChatData) {
    const globals = prepareGlobals();

    let err = false;
    for(const message of data.chat) {
        try {
            message.content = await vm.runInNewContext(CODE_TEMPLATE, {
                ...globals,
                content: message.content,
            });
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

    const globals = prepareGlobals();

    try {
        message.mes = await vm.runInNewContext(CODE_TEMPLATE, {
            ...globals,
            content: message.mes,
        });
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

