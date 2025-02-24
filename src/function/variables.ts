import { chat, chat_metadata } from '../../../../../../script.js';
import { extension_settings } from '../../../../../extensions.js';

export let STATE = {
    isDryRun: false,
    isUpdated: false,
};

export function allVariables(end : number = 65535) {
    /*
    let variables : Record<string, unknown> = {};
    variables = _.merge(variables, extension_settings.variables.global);

    const metadata : Metadata = chat_metadata;
    variables = _.merge(variables, metadata.variables || {});

    const messages : Array<Message> = chat;
    for(const message of messages.slice(0, Math.max(end - 1, 0)))
        if(message.variables && message.variables[message.swipe_id])
            variables = _.merge(variables, message.variables[message.swipe_id]);
    */
    
    return _.merge({},
                   extension_settings.variables.global,
                   // @ts-expect-error: 2339
                   chat_metadata.variables || {},
                   ...chat.slice(0, Math.max(end - 1, 0)).map(msg => msg.variables?.[msg.swipe_id] || {}),
    );
}

export interface MessageFilter {
    role?: 'system' | 'user' | 'assistant' | 'any';
    id?: number;
    swipe_id?: number;
}

export interface SetVarOption {
    index?: number;
    scope?: 'global' | 'local' | 'message' | 'cache';
    flags?: 'nx' | 'xx' | 'n' | 'nxs' | 'xxs';
    results?: 'old' | 'new' | 'fullcache';
    withMsg?: MessageFilter;
    merge?: boolean;
    dryRun?: boolean;
}

function evalFilter(filter? : MessageFilter) {
    let message_id = -1;
    if(filter?.id !== undefined) {
        message_id = filter.id > -1 ? filter.id : chat.length + filter.id;
    } else if(filter?.role !== undefined) {
        message_id = chat.findLastIndex(msg =>
            (msg.is_system === (filter.role === 'system')) ||
            (msg.is_user === (filter.role === 'user')) ||
            (!msg.is_system && !msg.is_user && (filter.role === 'assistant')) ||
            (filter.role === 'any')
        );
    } else {
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

    console.debug(`Found message ${message_id} with swipe ${swipe_id} for filter: ${filter}`);
    return [message_id, swipe_id];
}

export function setVariable(this : Record<string, unknown>, key : string, value : unknown,
                            options : SetVarOption = {}) {
    let self = this;
    if(this?.runID === undefined) {
        console.warn(`setVariable called with invalid context ${this}`);
        self = allVariables();
    }
    
    const { index, scope, flags, results, withMsg, merge, dryRun } = options;
    if(!dryRun && STATE.isDryRun) return undefined;
    
    let oldValue;
    let newValue = value;
    if (index !== null && index !== undefined) {
        // @ts-expect-error: TS2322
        let data = JSON.parse(_.get(self, key, '{}'));
        let idx = Number(index);
        idx = Number.isNaN(idx) ? index : idx;

        if(flags === 'nx' && _.has(data, idx)) return undefined;
        if(flags === 'xx' && !_.has(data, idx)) return undefined;
        if(flags === 'nxs' && getVariable.call(self, key, options) !== undefined) return undefined;
        if(flags === 'xxs' && getVariable.call(self, key, options) === undefined) return undefined;

        if(results === 'old' || merge) oldValue = _.get(data, idx, undefined);
        if(merge) newValue = _.merge(results === 'old' ? _.cloneDeep(oldValue) : oldValue, value);
        _.set(self, key, JSON.stringify(_.set(data, idx, newValue)));

        switch(scope || 'message') {
            case 'global':
                data = JSON.parse(_.get(extension_settings.variables.global, key, '{}') || '{}');
                _.set(extension_settings.variables.global, key, JSON.stringify(_.set(data, idx, newValue)));
                console.debug(`Set global variable ${key} to ${newValue} (index ${idx})`);
                STATE.isUpdated = true;
                break;
            case 'local':
                // @ts-expect-error: TS2322
                if(!chat_metadata.variables) chat_metadata.variables = {};
                // @ts-expect-error: TS2322
                data = JSON.parse(_.get(chat_metadata.variables, key, '{}') || '{}');
                // @ts-expect-error: TS2322
                _.set(chat_metadata.variables, key, JSON.stringify(_.set(data, idx, newValue)));
                console.debug(`Set local variable ${key} to ${newValue} (index ${idx})`);
                STATE.isUpdated = true;
                break;
            case 'message':
                const [message_id, swipe_id] = evalFilter(withMsg);
                if(message_id !== undefined && swipe_id !== undefined) {
                    if(!chat[message_id].variables) chat[message_id].variables = {};
                    if(!chat[message_id].variables[swipe_id]) chat[message_id].variables[swipe_id] = {};
                    data = JSON.parse(_.get(chat[message_id].variables[swipe_id], key, '{}') || '{}');
                    _.set(chat[message_id].variables[swipe_id], key, JSON.stringify(_.set(data, idx, newValue)));
                    console.debug(`Set message #${message_id}.${swipe_id} variable ${key} to ${newValue} (index ${idx})`);
                    STATE.isUpdated = true;
                }
                break;
        }
    } else {
        if(flags === 'nx' && _.has(self, key)) return undefined;
        if(flags === 'xx' && !_.has(self, key)) return undefined;
        if(flags === 'nxs' && getVariable.call(self, key, options) !== undefined) return undefined;
        if(flags === 'xxs' && getVariable.call(self, key, options) === undefined) return undefined;

        if(results === 'old' || merge) oldValue = _.get(self, key, undefined);
        if(merge) newValue = _.merge(results === 'old' ? _.cloneDeep(oldValue) : oldValue, value);
        _.set(self, key, newValue);

        switch(scope || 'message') {
            case 'global':
                _.set(extension_settings.variables.global, key, newValue);
                console.debug(`Set global variable ${key} to ${newValue}`);
                STATE.isUpdated = true;
                break;
            case 'local':
                // @ts-expect-error: TS2322
                if(!chat_metadata.variables) chat_metadata.variables = {};
                // @ts-expect-error: TS2322
                _.set(chat_metadata.variables, key, newValue);
                console.debug(`Set local variable ${key} to ${newValue}`);
                STATE.isUpdated = true;
                break;
            case 'message':
                const [message_id, swipe_id] = evalFilter(withMsg);
                if(message_id !== undefined && swipe_id !== undefined) {
                    if(!chat[message_id].variables) chat[message_id].variables = {};
                    if(!chat[message_id].variables[swipe_id]) chat[message_id].variables[swipe_id] = {};
                    _.set(chat[message_id].variables[swipe_id], key, newValue);
                    console.debug(`Set message #${message_id}.${swipe_id} variable ${key} to ${newValue}`);
                    STATE.isUpdated = true;
                }
                break;
        }
    }

    if(results === 'old')
        return oldValue;
    if(results === 'new')
        return newValue;
    return self;
}

export interface GetVarOption {
    index?: number;
    scope?: 'global' | 'local' | 'message' | 'cache';
    defaults?: unknown;
    withMsg?: MessageFilter;
}

export function getVariable(this : Record<string, unknown>, key : string,
                            options : GetVarOption = {}) {
    let self = this;
    if(this?.runID === undefined) {
        console.warn(`setVariable called with invalid context ${this}`);
        self = allVariables();
    }

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
            return defaults;
    }

    if (index !== null && index !== undefined) {
        // @ts-expect-error: TS2322
        const data = JSON.parse(_.get(self, key, '{}') || '{}');
        const idx = Number(index);
        return _.get(data, idx, defaults);
    }

    return _.get(self, key, defaults);
}

export interface GetSetVarOption {
    index?: number;
    defaults?: number;
    inscope?: 'global' | 'local' | 'message' | 'cache';
    outscope?: 'global' | 'local' | 'message' | 'cache';
    flags?: 'nx' | 'xx' | 'n' | 'nxs' | 'xxs';
    results?: 'old' | 'new' | 'fullcache';
    withMsg?: MessageFilter;
    dryRun?: boolean;
}

export function increaseVariable(this : Record<string, unknown>, key : string,
                                 value : number = 1, options : GetSetVarOption = {}) {
    let self = this;
    if(this?.runID === undefined) {
        console.warn(`setVariable called with invalid context ${this}`);
        self = allVariables();
    }
    const { index, inscope, outscope, flags, defaults, results, withMsg, dryRun } = options;
    if((flags === 'nx' && !_.has(self, key)) ||
      (flags === 'xx' && _.has(self, key)) ||
      (flags === 'nxs' && getVariable.call(self, key, { index, withMsg, scope: inscope }) === undefined) ||
      (flags === 'xxs' && getVariable.call(self, key, { index, withMsg, scope: inscope }) !== undefined) ||
      (flags === 'n' || flags === undefined)) {
        const val = getVariable.call(self, key, { index, withMsg, scope: inscope, defaults: defaults || 0 });
        return setVariable.call(self, key, val + value, { index, results, withMsg, dryRun, scope: outscope, flags: 'n' });
    }
    return undefined;
}

export function decreaseVariable(this : Record<string, unknown>, key : string,
                                 value : number = 1, options : GetSetVarOption = {}) {
    let self = this;
    if(this?.runID === undefined) {
        console.warn(`setVariable called with invalid context ${this}`);
        self = allVariables();
    }
    return increaseVariable.call(self, key, -value, options);
}
