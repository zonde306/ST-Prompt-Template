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

const CODE_TEMPLATE = `\
    ejs.render(
        content,
        { chat, chat_metadata, variables },
        { async: true }
    );
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

function setVariables(vars : Record<string, unknown>, key : string, value : unknown,
                      index: number | null = null,
                      scope : 'global' | 'local' | 'message' = 'message') {
    let message : Message;
    if (index) {
        // @ts-expect-error: TS2322
        let data = JSON.parse(_.get(vars, key, '{}'));
        const idx = Number(index);
        data[Number.isNaN(idx) ? index : idx] = value;
        _.set(vars, key, JSON.stringify(data));

        switch(scope) {
            case 'global':
                // @ts-expect-error: TS2322
                data = JSON.parse(extension_settings.variables.global[key] || '{}');
                data[Number.isNaN(idx) ? index : idx] = value;
                // @ts-expect-error: TS2322
                extension_settings.variables.global[key] = JSON.stringify(data);
                break;
            case 'local':
                // @ts-expect-error: TS2322
                if(!chat_metadata.variables) chat_metadata.variables = {};
                // @ts-expect-error: TS2322
                data = JSON.parse(chat_metadata.variables[key] || '{}');
                data[Number.isNaN(idx) ? index : idx] = value;
                // @ts-expect-error: TS2322
                chat_metadata.variables[key] = JSON.stringify(data);
                break;
            case 'message':
                message = chat.findLast(msg => !msg.is_system);
                if(!message.variables) message.variables = {};
                if(!message.variables[message.swipe_id]) message.variables[message.swipe_id] = {};
                // @ts-expect-error: TS2322
                data = JSON.parse(message.variables[message.swipe_id][key] || '{}');
                data[Number.isNaN(idx) ? index : idx] = value;
                message.variables[message.swipe_id][key] = JSON.stringify(data);
                break;
        }
    } else {
        _.set(vars, key, value);

        switch(scope) {
            case 'global':
                // @ts-expect-error: TS2322
                extension_settings.variables.global[key] = value;
                break;
            case 'local':
                // @ts-expect-error: TS2322
                if(!chat_metadata.variables) chat_metadata.variables = {};
                // @ts-expect-error: TS2322
                chat_metadata.variables[key] = value;
                break;
            case 'message':
                message = chat.findLast(msg => !msg.is_system);
                if(!message.variables) message.variables = {};
                if(!message.variables[message.swipe_id]) message.variables[message.swipe_id] = {};
                message.variables[message.swipe_id][key] = value;
                break;
        }
    }

    return vars;
}

function prepareGlobals() {
    let vars = allVariables();
    return {
        chat,
        chat_metadata,
        ejs,
        variables : vars,
        execute: async(cmd : string) => (await executeSlashCommandsWithOptions(cmd)).pipe,
        setvar : setVariables.bind(null, vars),
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

