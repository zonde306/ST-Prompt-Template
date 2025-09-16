import { chat, chat_metadata, saveChatConditional } from '../../../../../../script.js';
import { extension_settings } from '../../../../../extensions.js';
import { settings } from '../modules/ui';

export let STATE : {
    isDryRun: boolean,
    isUpdated: boolean,
    cacheAll: Record<string, unknown>,
    cacheMessage: Record<string, unknown>,
    traceId: number,
    initialVariables: Record<string, unknown>,
    isInPlace: boolean,
} = {
    isDryRun: false,
    isUpdated: false,
    cacheAll: {},
    cacheMessage: {},
    traceId: 0,
    initialVariables: {},
    isInPlace: false,
};

type SimpleOptions = 'nx' | 'xx' | 'n' | 'nxs' | 'xxs' | 'global' | 'local' | 'message' | 'cache' | 'initial' | 'old' | 'new' | 'fullcache' | boolean;

/**
 * Combine all variables and cache it
 * @param msg_id Current message ID
 * @param sw_id Current message ID
 * @returns all variables object
 */
export function precacheVariables(msg_id?: number, sw_id?: number): Record<string, unknown> {
    const [ message_id, swipe_id ] = evalMessageFilter(undefined, msg_id, sw_id, true);
    if(message_id != null && swipe_id != null) {
        if(message_id > 0 && (chat[message_id].is_user || chat[message_id].is_system)) {
            // The variables of system and user are incomplete, and more variables need to be found.
            STATE.cacheMessage = Object.assign({},
                _.cloneDeep(chat[message_id - 1]?.variables?.[chat[message_id - 1].swipe_id ?? 0] || {}),
                _.cloneDeep(chat[message_id]?.variables?.[swipe_id] || {}),
            );
        } else {
            STATE.cacheMessage = _.cloneDeep(chat[message_id]?.variables?.[swipe_id] || {});
        }
    } else {
        STATE.cacheMessage = {};
    }
    
    STATE.cacheAll = _.cloneDeep(Object.assign(
        {},
        extension_settings.variables.global, // global variables
        STATE.initialVariables,
        // @ts-expect-error: 2339
        chat_metadata.variables || {}, // chat variables
        STATE.cacheMessage, // message variables
        { _trace_id: (STATE.traceId)++, _modify_id: 0 }, // trace ID
    ));
    
    console.debug(`[Prompt Template] cache message #${message_id}.${swipe_id} variables: `, STATE.cacheMessage);
    console.debug(`[Prompt Template] cache all variables: `, STATE.cacheAll);
    return STATE.cacheAll;
}

/**
 * messages filter
 * 
 * @property role - Filter by message role
 * @property id - Filter by message ID
 * @property swipe_id - Filter by message swipe ID
 */
export interface MessageFilter {
    role?: 'system' | 'user' | 'assistant' | 'any';
    id?: number;
    swipe_id?: number;
}

/**
 * options for setVariable
 * 
 * @property index - Index for array/object variable
 * @property scope - Where to write the variable
 * @property flags - Variable setting rules
 * @property results - Return old/new value
 * @property withMsg - messages filter
 * @property merge - Merge object values
 * @property dryRun - Always allow setting variables
 * @property noCache - Do not query cache
 */
export interface SetVarOption {
    index?: number;
    scope?: 'global' | 'local' | 'message' | 'cache' | 'initial';
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
function evalMessageFilter(filter?: MessageFilter, msgid?: number, swipeid?: number, getter: boolean = false): [number?, number?] {
    let message_id = -1;
    if (filter?.id !== undefined) {
        message_id = filter.id > -1 ? filter.id : chat.length + filter.id;
    } else if (filter?.role !== undefined) {
        message_id = chat.findLastIndex(msg =>
            (
                (msg.is_system === (filter.role === 'system')) ||
                (msg.is_user === (filter.role === 'user')) ||
                (!msg.is_system && !msg.is_user && (filter.role === 'assistant')) ||
                (filter.role === 'any')
            ) && (
                !getter ||
                // When getting a variable, look for the existing variable
                msg.variables?.[msg.swipe_id ?? 0] != null
            )
        );
    } else if (msgid === undefined) {
        // When getting a variable, look for the existing variable
        message_id = chat.findLastIndex(msg => !getter || msg.variables?.[msg.swipe_id ?? 0] != null);
    } else {
        if(msgid > chat.length)
            msgid = chat.length - 1;
        else if(msgid < 0)
            msgid = chat.length + msgid;
        
        message_id = msgid;
        if(getter) {
            // If the current message has no variables, search upwards
            message_id = chat.slice(0, msgid + 1).findLastIndex(msg => msg.variables?.[msg.swipe_id ?? 0] != null);
        }
    }

    if (message_id < 0 || message_id >= chat.length) {
        console.warn(`No message found for filter: ${filter}`);
        return [undefined, undefined];
    }

    let swipe_id = 0;
    if (filter?.swipe_id !== undefined)
        swipe_id = filter.swipe_id;
    else if (swipeid !== undefined)
        swipe_id = swipeid;
    else
        swipe_id = chat[message_id]?.swipe_id || 0;

    if (swipe_id < 0)
        swipe_id = (chat[message_id]?.swipes?.length || 0) + swipe_id;

    if (chat[message_id]?.swipes?.[swipe_id] === undefined) {
        console.debug(`No swipe found for filter: ${filter}`);
        return [message_id, swipe_id];
    }

    if (settings.debug_enabled)
        console.debug(`Found message ${message_id} with swipe ${swipe_id} for filter: ${filter}`);
    return [message_id, swipe_id];
}

/**
 * Setting variables
 * 
 * @param this Execution Environment
 * @param key variable name
 * @param value variable value
 * @param options Options
 * @returns The return value is determined by options.results
 */
export function setVariable(
    this: Record<string, unknown>,
    key: string | null,
    value: unknown,
    options: SetVarOption | SimpleOptions = {},
) {
    options = optionsConverter(options) as SetVarOption;
    const { noCache } = options;
    if (noCache || this?.runID === undefined) {
        // @ts-expect-error: TS2322
        precacheVariables(this?.message_id);
        if (settings.debug_enabled) {
            console.debug(`[Prompt Template] reload variables cache:`);
            console.debug(STATE.cacheAll);
        }
    }

    const { index, scope, flags, results, withMsg, merge, dryRun } = options;
    if (!dryRun && STATE.isDryRun) return undefined;

    let oldValue;
    let newValue = value;
    if (index != null) {
        let data = JSON.parse(get(STATE.cacheAll, key, '{}'));
        let idx = Number(index);
        idx = Number.isNaN(idx) ? index : idx;

        if (flags === 'nx' && _.has(data, idx)) return undefined;
        if (flags === 'xx' && !_.has(data, idx)) return undefined;
        if (flags === 'nxs' && getVariable.call(this, key, options) !== undefined) return undefined;
        if (flags === 'xxs' && getVariable.call(this, key, options) === undefined) return undefined;

        if (results === 'old' || merge)
            oldValue = get(data, idx, undefined);

        if (merge) {
            if ((oldValue === undefined || _.isArray(oldValue)) && _.isArray(value)) {
                newValue = _.concat(oldValue ?? [], value);
            } else {
                newValue = _.mergeWith(
                    _.cloneDeep(oldValue ?? {}),
                    value, (_dst: unknown, src: unknown) => _.isArray(src) ? src : undefined);
            }
        }

        newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
        _.set(STATE.cacheAll, key, JSON.stringify(data));

        switch (scope || 'message') {
            case 'global':
                data = JSON.parse(_.get(extension_settings.variables.global, key, '{}') || '{}');
                newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
                _.set(extension_settings.variables.global, key, JSON.stringify(data));

                if (settings.debug_enabled)
                    console.debug(`Set global variable ${key} to ${newValue} (index ${idx})`);
                break;
            case 'local':
                // @ts-expect-error: TS2322
                if (!chat_metadata.variables) chat_metadata.variables = {};
                // @ts-expect-error: TS2322
                data = JSON.parse(_.get(chat_metadata.variables, key, '{}') || '{}');
                newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
                // @ts-expect-error: TS2322
                _.set(chat_metadata.variables, key, JSON.stringify(data));

                if (settings.debug_enabled)
                    console.debug(`Set local variable ${key} to ${newValue} (index ${idx})`);
                break;
            case 'message':
                if (withMsg) {
                    // @ts-expect-error
                    const [message_id, swipe_id] = evalMessageFilter(withMsg, this?.message_id, this?.swipe_id, false);
                    if (message_id !== undefined && swipe_id !== undefined) {
                        if (!chat[message_id].variables) chat[message_id].variables = {};
                        if (!chat[message_id].variables[swipe_id]) chat[message_id].variables[swipe_id] = {};
                        data = JSON.parse(_.get(chat[message_id].variables[swipe_id], key, '{}') || '{}');
                        newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
                        _.set(chat[message_id].variables[swipe_id], key, JSON.stringify(data));

                        if (settings.debug_enabled)
                            console.debug(`Set message #${message_id}.${swipe_id} variable ${key} to ${newValue} (index ${idx})`);
                    }
                } else {
                    data = JSON.parse(_.get(STATE.cacheMessage, key, '{}') || '{}');
                    newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
                    _.set(STATE.cacheMessage, key, JSON.stringify(data));

                    if (settings.debug_enabled)
                        console.debug(`Set message variable ${key} to ${newValue} (index ${idx})`);
                    
                    STATE.isUpdated = true;
                }
                break;
            case 'initial':
                data = JSON.parse(_.get(STATE.initialVariables, key, '{}') || '{}');
                newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
                _.set(STATE.initialVariables, key, JSON.stringify(data));

                if (settings.debug_enabled)
                    console.debug(`Set initial variable ${key} to ${newValue} (index ${idx})`);
                break;
        }

        // @ts-expect-error: TS2322
        STATE.cacheAll._modify_id = STATE.cacheAll._modify_id + 1 || 1;
    } else {
        if (flags === 'nx' && has(STATE.cacheAll, key)) return undefined;
        if (flags === 'xx' && !has(STATE.cacheAll, key)) return undefined;
        if (flags === 'nxs' && getVariable.call(this, key, options) !== undefined) return undefined;
        if (flags === 'xxs' && getVariable.call(this, key, options) === undefined) return undefined;

        if (results === 'old' || merge)
            oldValue = get(STATE.cacheAll, key, undefined);

        if (merge) {
            if ((oldValue === undefined || _.isArray(oldValue)) && _.isArray(value))
                newValue = _.concat(oldValue ?? [], value);
            else
                newValue = _.mergeWith(
                    _.cloneDeep(oldValue ?? {}),
                    value, (_dst: unknown, src: unknown) => _.isArray(src) ? src : undefined);
        }

        newValue === undefined ? unset(STATE.cacheAll, key) : set(STATE.cacheAll, key, newValue);

        switch (scope || 'message') {
            case 'global':
                if (newValue === undefined)
                    unset(extension_settings.variables.global, key);
                else
                    set(extension_settings.variables.global, key, newValue);

                if (settings.debug_enabled)
                    console.debug(`Set global variable ${key} to ${newValue}`);
                break;
            case 'local':
                // @ts-expect-error: TS2322
                if (!chat_metadata.variables) chat_metadata.variables = {};

                if (newValue === undefined) // @ts-expect-error: TS2322
                    unset(chat_metadata.variables, key);
                else // @ts-expect-error: TS2322
                    set(chat_metadata.variables, key, newValue);

                if (settings.debug_enabled)
                    console.debug(`Set local variable ${key} to ${newValue}`);
                break;
            case 'message':
                if (withMsg) {
                    // @ts-expect-error
                    const [message_id, swipe_id] = evalMessageFilter(withMsg, this?.message_id, this?.swipe_id, false);
                    if (message_id !== undefined && swipe_id !== undefined) {
                        if (!chat[message_id].variables) chat[message_id].variables = {};
                        if (!chat[message_id].variables[swipe_id]) chat[message_id].variables[swipe_id] = {};

                        if (newValue === undefined) {
                            unset(chat[message_id].variables[swipe_id], key);
                        } else {
                            set(chat[message_id].variables[swipe_id], key, newValue);
                        }

                        if (settings.debug_enabled)
                            console.debug(`Set message #${message_id}.${swipe_id} variable ${key} to ${newValue}`);
                    }
                } else {
                        if (newValue === undefined) {
                            unset(STATE.cacheMessage, key);
                        } else {
                            set(STATE.cacheMessage, key, newValue);
                        }

                        if (settings.debug_enabled)
                            console.debug(`Set message variable ${key} to ${newValue}`);

                        STATE.isUpdated = true;
                }
                break;
            case 'initial':
                if (newValue === undefined)
                    unset(STATE.initialVariables, key);
                else
                    set(STATE.initialVariables, key, newValue);

                if (settings.debug_enabled)
                    console.debug(`Set initial variable ${key} to ${newValue}`);
                break;
        }

        // @ts-expect-error: TS2322
        STATE.cacheAll._modify_id = STATE.cacheAll._modify_id + 1 || 1;
    }

    if (results === 'old')
        return oldValue;
    if (results === 'fullcache')
        return STATE.cacheAll;
    return newValue;
}

/**
 * Options for getVariable
 * 
 * @property index - Index for array/object variable
 * @property scope - Variable Type
 * @property defaults - Default Value
 * @property withMsg - Filter message by MessageFilter
 * @property noCache - Ignore the cache and read the latest value
 * @property clone - return cloned value instead of original value
 */
export interface GetVarOption {
    index?: number;
    scope?: 'global' | 'local' | 'message' | 'cache' | 'initial';
    defaults?: unknown;
    withMsg?: MessageFilter;
    noCache?: boolean;
    clone?: boolean;
}

/**
 * Get variables
 * @param this Execution Context
 * @param key variable name
 * @param options Options
 * @returns variable value
 */
export function getVariable(
    this: Record<string, unknown>,
    key: string | null,
    options: GetVarOption | SimpleOptions = {}
) {
    options = optionsConverter(options) as GetVarOption;
    const { noCache } = options;
    if (noCache || this?.runID === undefined) {
        // @ts-expect-error: TS2322
        precacheVariables(this?.message_id);
        if (settings.debug_enabled) {
            console.debug(`[Prompt Template] reload variables cache:`);
            console.debug(STATE.cacheAll);
        }
    }

    let result = null;
    const { index, scope, defaults, withMsg } = options;

    switch (scope || 'cache') {
        case 'global':
            if (index != null) {
                const data = JSON.parse(_.get(extension_settings.variables.global, key, '{}') || '{}');
                const idx = Number(index);
                return _.get(data, Number.isNaN(idx) ? index : idx, defaults);
            }
            result = get(extension_settings.variables.global, key, defaults);
            return options.clone ? _.cloneDeep(result) : result;
        case 'local':
            // @ts-expect-error: TS2322
            if (!chat_metadata.variables)
                return defaults;
            if (index != null) {
                // @ts-expect-error: TS2322
                const data = JSON.parse(_.get(chat_metadata.variables, key, '{}') || '{}');
                const idx = Number(index);
                return _.get(data, Number.isNaN(idx) ? index : idx, defaults);
            }
            // @ts-expect-error: TS2322
            result = get(chat_metadata.variables, key, defaults);
            return options.clone ? _.cloneDeep(result) : result;
        case 'message':
            if(withMsg) {
                // @ts-expect-error
                const [message_id, swipe_id] = evalMessageFilter(withMsg, this?.message_id, this?.swipe_id, true);
                if (message_id !== undefined && swipe_id !== undefined) {
                    if (!chat[message_id].variables) return defaults;
                    if (!chat[message_id].variables[swipe_id]) return defaults;
                    if (index != null) {
                        const data = JSON.parse(_.get(chat[message_id].variables[swipe_id], key, '{}') || '{}');
                        const idx = Number(index);
                        return _.get(data, Number.isNaN(idx) ? index : idx, defaults);
                    }

                    result = get(chat[message_id].variables[swipe_id], key, defaults);
                    return options.clone ? _.cloneDeep(result) : result;
                }
                return defaults;
            } else {
                if (index != null) {
                    const data = JSON.parse(_.get(STATE.cacheMessage, key, '{}') || '{}');
                    const idx = Number(index);
                    return _.get(data, Number.isNaN(idx) ? index : idx, defaults);
                }
                result = get(STATE.cacheMessage, key, defaults);
                return options.clone ? _.cloneDeep(result) : result;
            }
        case 'initial':
            if (index != null) {
                const data = JSON.parse(_.get(STATE.initialVariables, key, '{}') || '{}');
                const idx = Number(index);
                return _.get(data, Number.isNaN(idx) ? index : idx, defaults);
            }
            result = get(STATE.initialVariables, key, defaults);
            return options.clone ? _.cloneDeep(result) : result;
    }

    if (index != null) {
        const data = JSON.parse(_.get(STATE.cacheAll, key, '{}') || '{}');
        const idx = Number(index);
        return _.get(data, idx, defaults);
    }

    return get(STATE.cacheAll, key, defaults);
}

/**
 * Options for increaseVariable/decreaseVariable
 * 
 * @property index - Index for array/object variable
 * @property inscope - Where to read variables from
 * @property outscope - Where to write the variable
 * @property flags - Flags of modify operations
 * @property defaults - Value if variable is not exists
 * @property dryRun - Always allow setting variables
 * @property noCache - Ignore the cache and read the latest value
 * @property min - Minimum value of assignment
 * @property max - Maximum value of assignment
 */
export interface GetSetVarOption {
    index?: number;
    defaults?: number;
    inscope?: 'global' | 'local' | 'message' | 'cache' | 'initial';
    outscope?: 'global' | 'local' | 'message' | 'cache' | 'initial';
    flags?: 'nx' | 'xx' | 'n' | 'nxs' | 'xxs';
    results?: 'old' | 'new' | 'fullcache';
    withMsg?: MessageFilter;
    dryRun?: boolean;
    noCache?: boolean;
    min?: number;
    max?: number;
}

/**
 * Add a variable
 * @param this Execution Context
 * @param key variable name
 * @param value Increased value
 * @param options Options
 * @returns The return value is determined by options.results
 */
export function increaseVariable(
    this: Record<string, unknown>,
    key: string,
    value: number = 1,
    options: GetSetVarOption | SimpleOptions = {}
) {
    options = optionsConverter(options) as GetSetVarOption;
    const { noCache } = options;
    if (noCache || this?.runID === undefined) {
        // @ts-expect-error: TS2322
        precacheVariables(this?.message_id);
        if (settings.debug_enabled) {
            console.debug(`[Prompt Template] reload variables cache:`);
            console.debug(STATE.cacheAll);
        }
    }

    const { index, inscope, outscope, flags, defaults, results, withMsg, dryRun, min, max } = options;
    if ((flags === 'nx' && !_.has(STATE.cacheAll, key)) ||
        (flags === 'xx' && _.has(STATE.cacheAll, key)) ||
        (flags === 'nxs' && getVariable.call(this, key, { index, withMsg, scope: inscope }) === undefined) ||
        (flags === 'xxs' && getVariable.call(this, key, { index, withMsg, scope: inscope }) !== undefined) ||
        (flags === 'n' || flags === undefined)) {
        let val = getVariable.call(this, key, { index, withMsg, scope: inscope, defaults: defaults || 0 }) + value;
        if (min != null)
            val = Math.max(val, min);
        if (max != null)
            val = Math.min(val, max);
        return setVariable.call(this, key, val, { index, results, withMsg, dryRun, scope: outscope, flags: 'n' });
    }
    return undefined;
}

/**
 * Decrease a variable
 * @param this Execution Context
 * @param key variable name
 * @param value Decreased value
 * @param options Options
 * @returns The return value is determined by options.results
 */
export function decreaseVariable(
    this: Record<string, unknown>,
    key: string,
    value: number = 1,
    options: GetSetVarOption | SimpleOptions = {}
) {
    options = optionsConverter(options) as GetSetVarOption;
    if (this?.runID === undefined)
        console.warn(`setVariable called with invalid context ${this}`);
    return increaseVariable.call(this, key, -value, options);
}

export async function checkAndSave(force: boolean = false) {
    if(STATE.isUpdated) {
        const [message_id, swipe_id] = evalMessageFilter(undefined, undefined, undefined, false);
        if(message_id != null && swipe_id != null) {
            if(!chat[message_id].variables)
                chat[message_id].variables = {};
            if(!chat[message_id].variables[swipe_id])
                chat[message_id].variables[swipe_id] = {};
            
            chat[message_id].variables[swipe_id] = Object.assign({}, STATE.cacheMessage, chat[message_id]?.variables?.[swipe_id]);
        }
    }

    if (force || (STATE.isUpdated && settings.autosave_enabled !== false))
        await saveChatConditional();

    STATE.isUpdated = false;
}

function get(obj: object, key: string | number | null, defaults?: any): any {
    if (key == null)
        return obj;
    return _.get(obj, key, defaults);
}

function set(obj: object, key: string | number | null, value: any): any {
    if (key == null)
        return Object.assign(obj, value);
    return _.set(obj, key, value);
}

function unset(obj: any, key: string | number | null): any {
    if (key == null)
        return Object.keys(obj).forEach(k => delete obj[k]);
    return _.unset(obj, key);
}

function has(obj: any, key: string | number | null): boolean {
    if (key == null)
        return Object.keys(obj).length > 0;
    return _.has(obj, key);
}

function optionsConverter(
    options: GetSetVarOption | SetVarOption | GetSetVarOption | SimpleOptions
): GetSetVarOption | SetVarOption | GetSetVarOption {
    if (typeof options === 'string') {
        switch(options) {
            case 'old':
            case 'new':
            case 'fullcache':
                return { results: options };
            case 'nx':
            case 'xx':
            case 'nxs':
            case 'xxs':
            case 'n':
                return { flags: options };
            case 'cache':
            case 'global':
            case 'local':
            case 'message':
            case 'initial':
                return { scope: options, inscope: options, outscope: options };
        }
    }
    if(typeof options === 'boolean') {
        return { dryRun: options };
    }
    return options;
}
