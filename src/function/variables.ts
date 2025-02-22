import { chat, chat_metadata } from '../../../../../../script.js';
import { extension_settings } from '../../../../../extensions.js';
import { Message, Metadata } from '../defines.js';

export function allVariables(end : number = 65535) {
    let variables : Record<string, unknown> = {};
    variables = _.merge(variables, extension_settings.variables.global);

    const metadata : Metadata = chat_metadata;
    variables = _.merge(variables, metadata.variables || {});

    const messages : Array<Message> = chat;
    for(const message of messages.slice(0, Math.max(end - 1, 0)))
        if(message.variables && message.variables[message.swipe_id])
            variables = _.merge(variables, message.variables[message.swipe_id]);

    return variables;
}

export interface MessageFilter {
    role?: 'system' | 'user' | 'assistant' | 'any';
    id?: number;
    swipe_id?: number;
}

export interface SetVarOption {
    index?: number;
    scope?: 'global' | 'local' | 'message' | 'cache';
    flags?: 'nx' | 'xx' | 'n';
    results?: 'old' | 'new' | 'fullcache';
    withMsg?: MessageFilter;
}

function evalFilter(filter? : MessageFilter) {
    let message_id = chat.length - 1;
    if(filter?.id !== undefined) {
        message_id = filter.id > -1 ? filter.id : chat.length + filter.id;
    } else if(filter?.role !== undefined) {
        message_id = chat.findLastIndex(msg =>
            (msg.is_system === (filter.role === 'system')) ||
            (msg.is_user === (filter.role === 'user')) ||
            (!msg.is_system && !msg.is_user && (filter.role === 'assistant')) ||
            (filter.role === 'any')
        );
    } else if(!filter) {
        message_id = chat.findLastIndex(msg => !msg.is_user && !msg.is_system);
    }

    if(message_id < 0 || message_id >= chat.length) {
        console.error(`No message found for filter: ${filter}`);
        return [undefined, undefined];
    }

    let swipe_id = filter?.swipe_id !== undefined ? filter.swipe_id : chat[message_id].swipe_id;
    if(swipe_id < 0) swipe_id = chat[message_id].swipe_id + swipe_id;
    if(!(swipe_id in chat[message_id].swipes)) {
        console.error(`No swipe found for filter: ${filter}`);
        return [message_id, undefined];
    }

    return [message_id, swipe_id];
}

export function setVariable(vars : Record<string, unknown>, key : string, value : unknown,
                            options : SetVarOption = {}) {
    const { index, scope, flags, results, withMsg } = options;

    let oldValue;
    if (index !== null && index !== undefined) {
        // @ts-expect-error: TS2322
        let data = JSON.parse(_.get(vars, key, '{}'));
        let idx = Number(index);
        idx = Number.isNaN(idx) ? index : idx;

        if(flags === 'nx' && _.has(data, idx)) return vars;
        if(flags === 'xx' && !_.has(data, idx)) return vars;

        if(results === 'old') oldValue = _.get(data, idx, undefined);
        _.set(vars, key, JSON.stringify(_.set(data, idx, value)));

        switch(scope || 'message') {
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
                const [message_id, swipe_id] = evalFilter(withMsg);
                if(message_id !== undefined && swipe_id !== undefined) {
                    if(!chat[message_id].variables) chat[message_id].variables = {};
                    if(!chat[message_id].variables[swipe_id]) chat[message_id].variables[swipe_id] = {};
                    data = JSON.parse(_.get(chat[message_id].variables[swipe_id], key, '{}') || '{}');
                    _.set(chat[message_id].variables[swipe_id], key, JSON.stringify(_.set(data, idx, value)));
                }
                break;
        }
    } else {
        if(flags === 'nx' && _.has(vars, key)) return vars;
        if(flags === 'xx' && !_.has(vars, key)) return vars;

        if(results === 'old') oldValue = _.get(vars, key, undefined);
        _.set(vars, key, value);

        switch(scope || 'message') {
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
                const [message_id, swipe_id] = evalFilter(withMsg);
                if(message_id !== undefined && swipe_id !== undefined) {
                    _.set(chat[message_id].variables[swipe_id], key, value);
                }
                break;
        }
    }

    if(results === 'old')
        return oldValue;
    if(results === 'new')
        return value;
    return vars;
}

export interface GetVarOption {
    index?: number;
    scope?: 'global' | 'local' | 'message' | 'cache';
    defaults?: unknown;
    withMsg?: MessageFilter;
}

export function getVariable(vars : Record<string, unknown>, key : string,
                            options : GetVarOption = {}) {
    const { index, scope, defaults, withMsg } = options;

    switch(scope || 'cache') {
        case 'global':
            if (index !== null && index !== undefined) {
                const data = JSON.parse(_.get(extension_settings.variables.global, key, '{}') || '{}');
                const idx = Number(index);
                return _.get(data, Number.isNaN(idx) ? index : idx, defaults);
            }
            return _.get(extension_settings.variables.global, key, defaults);
        case 'local':
            // @ts-expect-error: TS2322
            if(!chat_metadata.variables)
                return defaults;
            if (index !== null && index !== undefined) {
                // @ts-expect-error: TS2322
                const data = JSON.parse(_.get(chat_metadata.variables, key, '{}') || '{}');
                const idx = Number(index);
                return _.get(data, Number.isNaN(idx) ? index : idx, defaults);
            }
            // @ts-expect-error: TS2322
            return _.get(chat_metadata.variables, key, defaults);
        case 'message':
            const [message_id, swipe_id] = evalFilter(withMsg);
            if(message_id !== undefined && swipe_id !== undefined) {
                if(!chat[message_id].variables) return defaults;
                if(!chat[message_id].variables[swipe_id]) return defaults;
                if (index !== null && index !== undefined) {
                    const data = JSON.parse(_.get(chat[message_id].variables[swipe_id], key, '{}') || '{}');
                    const idx = Number(index);
                    return _.get(data, Number.isNaN(idx) ? index : idx, defaults);
                }
                return _.get(chat[message_id].variables[swipe_id], key, defaults);
            }
    }

    if (index !== null && index !== undefined) {
        // @ts-expect-error: TS2322
        const data = JSON.parse(_.get(vars, key, '{}') || '{}');
        const idx = Number(index);
        return _.get(data, idx, defaults);
    }

    return _.get(vars, key, defaults);
}

export interface GetSetVarOption {
    index?: number;
    defaults?: number;
    inscope?: 'global' | 'local' | 'message' | 'cache';
    outscope?: 'global' | 'local' | 'message' | 'cache';
    flags?: 'nx' | 'xx' | 'n';
    results?: 'old' | 'new' | 'fullcache';
    withMsg?: MessageFilter;
}

export function increaseVariable(vars : Record<string, unknown>, key : string,
                                 value : number = 1, options : GetSetVarOption = {}) {
    const { index, inscope, outscope, flags, defaults, results, withMsg } = options;
    if((flags === 'nx' && !_.has(vars, key)) ||
      (flags === 'xx' && _.has(vars, key)) ||
      (flags === 'n' || flags === undefined)) {
        const val = getVariable(vars, key, { index, withMsg, scope: inscope, defaults: defaults || 0 });
        return setVariable(vars, key, val + value, { index, results, withMsg, scope: outscope, flags: 'n' });
    }
    return vars;
}

export function decreaseVariable(vars : Record<string, unknown>, key : string,
                                 value : number = 1, options : GetSetVarOption = {}) {
    return increaseVariable(vars, key, -value, options);
}
