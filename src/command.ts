import { chat, chat_metadata, saveChatDebounced } from '../../../../../script.js';
import { saveMetadataDebounced } from '../../../../extensions.js';
import { SlashCommand } from '../../../../slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument, SlashCommandNamedArgument } from '../../../../slash-commands/SlashCommandArgument.js';
import { SlashCommandParser } from '../../../../slash-commands/SlashCommandParser.js';
import { SlashCommandClosure } from '../../../../slash-commands/SlashCommandClosure.js';

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

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'setmsgvar',
    // @ts-expect-error: TS2322
    callback: async (args, value) => {
        const name = (args.key) ?? null;
        if (name == null) {
            throw new Error('/setmsgvar requires key');
        }
        const msgId = (args.msg ?? chat.findLastIndex(it => !it.is_system));

        // @ts-expect-error: TS2322
        await setMessageVar(msgId, args.key, value, args.index, args.filter);
        return value;
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'key',
            description: 'variable name',
            typeList: [ARGUMENT_TYPE.VARIABLE_NAME],
            isRequired: true,
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'index',
            description: 'list index',
            typeList: [ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.STRING],
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'msg',
            description: 'msgsage id, negative numbers start at {{lastMessageId}}',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: 'last not-hidden msgsage',
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'filter',
            description: 'closure to filter the chat history with, must return true or false',
            typeList: [ARGUMENT_TYPE.CLOSURE],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'value',
            typeList: [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.BOOLEAN, ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.DICTIONARY],
            isRequired: true,
        }),
    ],
    helpString: 'Set a msgsage bound variable.',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'getmsgvar',
    callback: async (args, value) => {
        const name = (args.key ?? value) ?? null;
        if (name == null) {
            throw new Error('/setmsgvar requires key');
        }
        const msgId = (args.msg ?? chat.findLastIndex(it => !it.is_system));
        // @ts-expect-error: TS2322
        const vars = await getMessageVars(msgId, args.filter);
        // @ts-expect-error: TS2322
        let variable = vars?.[name];
        if (args.index !== undefined) {
            try {
                variable = JSON.parse(variable);
                const numIndex = Number(args.index);
                if (Number.isNaN(numIndex)) {
                    variable = variable[args.index];
                } else {
                    variable = variable[Number(args.index)];
                }
                if (typeof variable == 'object') {
                    variable = JSON.stringify(variable);
                }
            } catch {
                // that didn't work
            }
        }

        return (variable === '' || isNaN(Number(variable))) ? (variable || '') : Number(variable);
    },
    returns: 'msgsage bound variable value',
    namedArgumentList: [
        new SlashCommandNamedArgument(
            'key', 'variable name', [ARGUMENT_TYPE.VARIABLE_NAME], false,
        ),
        new SlashCommandNamedArgument(
            'index', 'list index', [ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.STRING], false,
        ),
        SlashCommandNamedArgument.fromProps({
            name: 'msg',
            description: 'msgsage id, negative numbers start at {{lastMessageId}}',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: 'last not-hidden msgsage',
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'filter',
            description: 'closure to filter the chat history with, must return true or false',
            typeList: [ARGUMENT_TYPE.CLOSURE],
        }),
    ],
    unnamedArgumentList: [
        new SlashCommandArgument(
            'variable name', [ARGUMENT_TYPE.VARIABLE_NAME], false,
        ),
    ],
    helpString: 'Get a msgsage bound variable value and pass it down the pipe.',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'getmsgvars',
    callback: async (args, value) => {
        const msgId = (args.msg ?? (value == '' ? chat.findLastIndex(it => !it.is_system) : value));
        // @ts-expect-error: TS2322
        const vars = await getMessageVars(msgId, args.filter);
        return JSON.stringify(vars ?? {});
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'msg',
            description: 'msgsage id, negative numbers start at {{lastMessageId}}',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: 'last not-hidden msgsage',
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'filter',
            description: 'closure to filter the chat history with, must return true or false',
            typeList: [ARGUMENT_TYPE.CLOSURE],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'msgsage id, negative numbers start at {{lastMessageId}}',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: 'last not-hidden msgsage',
        }),
    ],
    helpString: 'Get a dictionary with all the msgsage bound variables.',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'flushmsgvar',
    callback: async (args, value) => {
        const name = (args.key ?? value) ?? null;
        if (name == null) {
            throw new Error('/setmsgvar requires key');
        }
        const msgId = (args.msg ?? chat.findLastIndex(it => !it.is_system));
        // @ts-expect-error: TS2322
        await flushMessageVar(msgId, name, args.filter);
        return '';
    },
    returns: 'msgsage bound variable value',
    namedArgumentList: [
        new SlashCommandNamedArgument(
            'key', 'variable name', [ARGUMENT_TYPE.VARIABLE_NAME], false,
        ),
        SlashCommandNamedArgument.fromProps({
            name: 'msg',
            description: 'msgsage id, negative numbers start at {{lastMessageId}}',
            typeList: [ARGUMENT_TYPE.NUMBER],
            defaultValue: 'last not-hidden msgsage',
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'filter',
            description: 'closure to filter the chat history with, must return true or false',
            typeList: [ARGUMENT_TYPE.CLOSURE],
        }),
    ],
    unnamedArgumentList: [
        new SlashCommandArgument(
            'variable name', [ARGUMENT_TYPE.VARIABLE_NAME], false,
        ),
    ],
    helpString: `
            <div>
                Delete a msgsage variable.
            </div>
            <div>
                <strong>Example:</strong>
                <ul>
                    <li>
                        <pre><code class="language-stscript">/flushmsgvar score</code></pre>
                    </li>
                </ul>
            </div>
        `,
}));

async function getMessage(msgId : number, filter : SlashCommandClosure | null = null) : Promise<Message | null> {
    if (msgId < 0) {
        msgId = chat.length + msgId;
    }
    if (msgId < 0 || msgId >= chat.length) {
        return null;
    }
    const msgList = [];
    if (filter) {
        const ogScope = filter.scope.getCopy();
        for (const msg of chat) {
            filter.scope = ogScope.getCopy();
            for (const key of Object.keys(msg)) {
                filter.scope.setMacro(key, msg[key]);
            }
            if ((await filter.execute()).pipe) {
                msgList.push(msg);
            }
        }
    } else {
        msgList.push(...chat);
    }
    return msgList.slice(msgId)[0];
}

async function getMessageVars(msgId : number, filter : SlashCommandClosure | null = null) {
    const msg = await getMessage(msgId, filter);
    if (!msg) {
        throw new Error(`msgsage ${msgId} does not exist`);
    }
    const swipeId = msg.swipe_id ?? 0;
    return (msg.variables ?? [])[swipeId];
}

async function setMessageVar(msgId : number, key : string, val : unknown,
                             index : number | null = null,
                             filter : SlashCommandClosure | null = null) {
    const msg = await getMessage(msgId, filter);
    if (!msg) {
        throw new Error(`msgsage ${msgId} does not exist`);
    }
    const swipeId = msg.swipe_id ?? 0;
    if (!msg.variables) {
        msg.variables = [];
    }
    if (!msg.variables[swipeId]) {
        msg.variables[swipeId] = {};
    }
    if (index) {
        // @ts-expect-error: TS2322
        let variable = JSON.parse(msg.variables[swipeId][key] ?? 'null');
        const numIndex = Number(index);
        if (Number.isNaN(numIndex)) {
            if (variable === null) {
                variable = {};
            }
            variable[index] = val;
        } else {
            if (variable === null) {
                variable = [];
            }
            variable[numIndex] = val;
        }
        msg.variables[swipeId][key] = JSON.stringify(variable);
    } else {
        msg.variables[swipeId][key] = val;
    }
    if (msg == chat.findLast(it => !it.is_system)) {
        // @ts-expect-error: TS2322
        if (!chat_metadata.variables) chat_metadata.variables = {};
        // @ts-expect-error: TS2322
        chat_metadata.variables[key] = msg.variables[swipeId][key];
        saveMetadataDebounced();
    }
    saveChatDebounced();
}

async function flushMessageVar(msgId : number, key : string, filter : SlashCommandClosure | null = null) {
    const msg = await getMessage(msgId, filter);
    if (!msg) {
        throw new Error(`msgsage ${msgId} does not exist`);
    }
    const swipeId = msg.swipe_id ?? 0;
    if (!msg.variables) {
        return;
    }
    if (!msg.variables[swipeId]) {
        return;
    }
    delete msg.variables[swipeId][key];

    if (msg == chat.findLast(it => !it.is_system)) {
        // @ts-expect-error: TS2322
        if (!chat_metadata.variables) chat_metadata.variables = {};
        // @ts-expect-error: TS2322
        chat_metadata.variables[key] = msg.variables[swipeId][key];
        saveMetadataDebounced();
    }
    saveChatDebounced();
}

export async function init() {
}

export async function exit() {
}
