import { chat, chat_metadata, saveChatConditional } from '../../../../../../script.js';
import { extension_settings } from '../../../../../extensions.js';
import { settings } from '../modules/ui';
import { getCharaData } from './characters';

export let STATE = {
    isDryRun: false,
    isUpdated: false,
    cache: {},
    traceId: 0,
};

/**
 * Combine all variables
 * @param end Maximum number of combined messages
 * @returns variables tree
 */
export function allVariables(end? : number) : Record<string, unknown> {
    return _.mergeWith(
        {},
        // @ts-expect-error: 2339
        getCharaData()?.data?.extensions?.variables || {},
        extension_settings.variables.global,
        // @ts-expect-error: 2339
        chat_metadata.variables || {},
        ...chat.slice(0, end).map(msg => msg.variables?.[msg.swipe_id || 0] || {}),
        { _trace_id : (STATE.traceId)++, _modify_id: 0 },
        (_dst : unknown, src : unknown) => _.isArray(src) ? src : undefined,
    );
}

/**
 * messages filter
 */
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
    noCache?: boolean;
}

/**
 * Select messages based on filter
 * @param filter filters
 * @param msgid current message ID
 * @param swipeid swipe ID of the current message ID
 * @returns [message_id, swipe_id] selected message ID and swipe ID
 */
function evalFilter(filter? : MessageFilter, msgid? : number, swipeid?: number): [number?, number?] {
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
    } else if(msgid === undefined) {
        message_id = chat.findLastIndex(msg => !msg.is_user && !msg.is_system);
        if(message_id === -1) {
            console.warn(`No assistant message`);
            message_id = chat.findLastIndex(msg => msg.is_user);
            if(message_id === -1) {
                console.warn(`No user message`);
                message_id = chat.length - 1;
            }
        }
    } else {
        message_id = msgid;
    }

    if(message_id < 0 || message_id >= chat.length) {
        console.warn(`No message found for filter: ${filter}`);
        return [undefined, undefined];
    }

    let swipe_id = 0;
    if(filter?.swipe_id !== undefined)
        swipe_id = filter.swipe_id;
    else if(swipeid !== undefined)
        swipe_id = swipeid;
    else
        swipe_id = chat[message_id]?.swipe_id || 0;

    if(swipe_id < 0)
        swipe_id = (chat[message_id]?.swipes?.length || 0) + swipe_id;

    if(chat[message_id]?.swipes?.[swipe_id] === undefined) {
        console.debug(`No swipe found for filter: ${filter}`);
        return [message_id, swipe_id];
    }

    if(settings.debug_enabled)
        console.debug(`Found message ${message_id} with swipe ${swipe_id} for filter: ${filter}`);
    return [message_id, swipe_id];
}

export function setVariable(this : Record<string, unknown>, key : string, value : unknown,
                            options : SetVarOption = {}) {
    const { noCache } = options;
    if(noCache || this?.runID === undefined) {
        // @ts-expect-error: TS2322
        STATE.cache = allVariables(this?.message_id);
        if(settings.debug_enabled) {
            console.debug(`[Prompt Template] reload variables cache:`);
            console.debug(STATE.cache);
        }
    }
    
    const { index, scope, flags, results, withMsg, merge, dryRun } = options;
    if(!dryRun && STATE.isDryRun) return undefined;
    
    let oldValue;
    let newValue = value;
    if (index !== null && index !== undefined) {
        let data = JSON.parse(_.get(STATE.cache, key, '{}'));
        let idx = Number(index);
        idx = Number.isNaN(idx) ? index : idx;

        if(flags === 'nx' && _.has(data, idx)) return undefined;
        if(flags === 'xx' && !_.has(data, idx)) return undefined;
        if(flags === 'nxs' && getVariable.call(this, key, options) !== undefined) return undefined;
        if(flags === 'xxs' && getVariable.call(this, key, options) === undefined) return undefined;

        if(results === 'old' || merge)
            oldValue = _.get(data, idx, undefined);

        if(merge) {
            if((oldValue === undefined || _.isArray(oldValue)) && _.isArray(value)) {
                newValue = _.concat(oldValue ?? [], value);
            } else {
                newValue = _.mergeWith(
                    _.cloneDeep(oldValue ?? {}),
                    value, (_dst: unknown, src: unknown) => _.isArray(src) ? src : undefined);
            }
        }
        
        newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
        _.set(STATE.cache, key, JSON.stringify(data));

        switch(scope || 'message') {
            case 'global':
                data = JSON.parse(_.get(extension_settings.variables.global, key, '{}') || '{}');
                newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
                _.set(extension_settings.variables.global, key, JSON.stringify(data));

                if(settings.debug_enabled)
                    console.debug(`Set global variable ${key} to ${newValue} (index ${idx})`);

                STATE.isUpdated = true;
                break;
            case 'local':
                // @ts-expect-error: TS2322
                if(!chat_metadata.variables) chat_metadata.variables = {};
                // @ts-expect-error: TS2322
                data = JSON.parse(_.get(chat_metadata.variables, key, '{}') || '{}');
                newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
                // @ts-expect-error: TS2322
                _.set(chat_metadata.variables, key, JSON.stringify(data));

                if(settings.debug_enabled)
                    console.debug(`Set local variable ${key} to ${newValue} (index ${idx})`);

                STATE.isUpdated = true;
                break;
            case 'message':
                // @ts-expect-error
                const [message_id, swipe_id] = evalFilter(withMsg, this?.message_id, this?.swipe_id);
                if(message_id !== undefined && swipe_id !== undefined) {
                    if(!chat[message_id].variables) chat[message_id].variables = {};
                    if(!chat[message_id].variables[swipe_id]) chat[message_id].variables[swipe_id] = {};
                    data = JSON.parse(_.get(chat[message_id].variables[swipe_id], key, '{}') || '{}');
                    newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
                    _.set(chat[message_id].variables[swipe_id], key, JSON.stringify(data));

                    if(settings.debug_enabled)
                        console.debug(`Set message #${message_id}.${swipe_id} variable ${key} to ${newValue} (index ${idx})`);

                    STATE.isUpdated = true;
                }
                break;
        }

        // @ts-expect-error: TS2322
        STATE.cache._modify_id = STATE.cache._modify_id + 1 || 1;
    } else {
        if(flags === 'nx' && _.has(STATE.cache, key)) return undefined;
        if(flags === 'xx' && !_.has(STATE.cache, key)) return undefined;
        if(flags === 'nxs' && getVariable.call(this, key, options) !== undefined) return undefined;
        if(flags === 'xxs' && getVariable.call(this, key, options) === undefined) return undefined;

        if(results === 'old' || merge)
            oldValue = _.get(STATE.cache, key, undefined);

        if(merge) {
            if((oldValue === undefined || _.isArray(oldValue)) && _.isArray(value))
                newValue = _.concat(oldValue ?? [], value);
            else
                newValue = _.mergeWith(
                    _.cloneDeep(oldValue ?? {}),
                    value, (_dst: unknown, src: unknown) => _.isArray(src) ? src : undefined);
        }

        newValue === undefined ? _.unset(STATE.cache, key) : _.set(STATE.cache, key, newValue);

        switch(scope || 'message') {
            case 'global':
                if(newValue === undefined)
                    _.unset(extension_settings.variables.global, key);
                else
                    _.set(extension_settings.variables.global, key, newValue);

                if(settings.debug_enabled)
                    console.debug(`Set global variable ${key} to ${newValue}`);

                STATE.isUpdated = true;
                break;
            case 'local':
                // @ts-expect-error: TS2322
                if(!chat_metadata.variables) chat_metadata.variables = {};
                
                if(newValue === undefined) // @ts-expect-error: TS2322
                    _.unset(chat_metadata.variables, key);
                else // @ts-expect-error: TS2322
                    _.set(chat_metadata.variables, key, newValue);

                if(settings.debug_enabled)
                    console.debug(`Set local variable ${key} to ${newValue}`);

                STATE.isUpdated = true;
                break;
            case 'message':
                // @ts-expect-error
                const [message_id, swipe_id] = evalFilter(withMsg, this?.message_id, this?.swipe_id);
                if(message_id !== undefined && swipe_id !== undefined) {
                    if(!chat[message_id].variables) chat[message_id].variables = {};
                    if(!chat[message_id].variables[swipe_id]) chat[message_id].variables[swipe_id] = {};

                    if(newValue === undefined)
                        _.unset(chat[message_id].variables[swipe_id], key);
                    else
                        _.set(chat[message_id].variables[swipe_id], key, newValue);

                    if(settings.debug_enabled)
                        console.debug(`Set message #${message_id}.${swipe_id} variable ${key} to ${newValue}`);

                    STATE.isUpdated = true;
                }
                break;
        }

        // @ts-expect-error: TS2322
        STATE.cache._modify_id = STATE.cache._modify_id + 1 || 1;
    }

    if(results === 'old')
        return oldValue;
    if(results === 'fullcache')
        return STATE.cache;
    return newValue;
}

export interface GetVarOption {
    index?: number;
    scope?: 'global' | 'local' | 'message' | 'cache';
    defaults?: unknown;
    withMsg?: MessageFilter;
    noCache?: boolean;
    clone?: boolean;
}

export function getVariable(this : Record<string, unknown>, key : string,
                            options : GetVarOption = {}) {
    const { noCache } = options;
    if(noCache || this?.runID === undefined) {
        // @ts-expect-error: TS2322
        STATE.cache = allVariables(this?.message_id);
        if(settings.debug_enabled) {
            console.debug(`[Prompt Template] reload variables cache:`);
            console.debug(STATE.cache);
        }
    }

    let result = null;
    const { index, scope, defaults, withMsg } = options;

    switch(scope || 'cache') {
        case 'global':
            if (index !== null && index !== undefined) {
                const data = JSON.parse(_.get(extension_settings.variables.global, key, '{}') || '{}');
                const idx = Number(index);
                return _.get(data, Number.isNaN(idx) ? index : idx, defaults);
            }
            result = _.get(extension_settings.variables.global, key, defaults);
            return options.clone ? _.cloneDeep(result) : result;
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
            result = _.get(chat_metadata.variables, key, defaults);
            return options.clone ? _.cloneDeep(result) : result;
        case 'message':
            // @ts-expect-error
            const [message_id, swipe_id] = evalFilter(withMsg, this?.message_id, this?.swipe_id);
            if(message_id !== undefined && swipe_id !== undefined) {
                if(!chat[message_id].variables) return defaults;
                if(!chat[message_id].variables[swipe_id]) return defaults;
                if (index !== null && index !== undefined) {
                    const data = JSON.parse(_.get(chat[message_id].variables[swipe_id], key, '{}') || '{}');
                    const idx = Number(index);
                    return _.get(data, Number.isNaN(idx) ? index : idx, defaults);
                }
                
                result = _.get(chat[message_id].variables[swipe_id], key, defaults);
                return options.clone ? _.cloneDeep(result) : result;
            }
            return defaults;
    }

    if (index !== null && index !== undefined) {
        const data = JSON.parse(_.get(STATE.cache, key, '{}') || '{}');
        const idx = Number(index);
        return _.get(data, idx, defaults);
    }

    return _.get(STATE.cache, key, defaults);
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
    noCache?: boolean;
    min?: number;
    max?: number;
}

export function increaseVariable(this : Record<string, unknown>, key : string,
                                 value : number = 1, options : GetSetVarOption = {}) {
    const { noCache } = options;
    if(noCache || this?.runID === undefined) {
        // @ts-expect-error: TS2322
        STATE.cache = allVariables(this?.message_id);
        if(settings.debug_enabled) {
            console.debug(`[Prompt Template] reload variables cache:`);
            console.debug(STATE.cache);
        }
    }

    const { index, inscope, outscope, flags, defaults, results, withMsg, dryRun, min, max } = options;
    if((flags === 'nx' && !_.has(STATE.cache, key)) ||
      (flags === 'xx' && _.has(STATE.cache, key)) ||
      (flags === 'nxs' && getVariable.call(this, key, { index, withMsg, scope: inscope }) === undefined) ||
      (flags === 'xxs' && getVariable.call(this, key, { index, withMsg, scope: inscope }) !== undefined) ||
      (flags === 'n' || flags === undefined)) {
        let val = getVariable.call(this, key, { index, withMsg, scope: inscope, defaults: defaults || 0 }) + value;
        if(min != null)
            val = Math.max(val, min);
        if(max != null)
            val = Math.min(val, max);
        return setVariable.call(this, key, val, { index, results, withMsg, dryRun, scope: outscope, flags: 'n' });
    }
    return undefined;
}

export function decreaseVariable(this : Record<string, unknown>, key : string,
                                 value : number = 1, options : GetSetVarOption = {}) {
    if(this?.runID === undefined)
        console.warn(`setVariable called with invalid context ${this}`);
    return increaseVariable.call(this, key, -value, options);
}

export async function checkAndSave(force : boolean = false) {
    if (force || (STATE.isUpdated && settings.autosave_enabled !== false))
        await saveChatConditional();
    
    STATE.isUpdated = false;
}
