import { chat, chat_metadata, saveChatConditional } from '../../../../../../script.js';
import { extension_settings } from '../../../../../extensions.js';
import { Message } from '../modules/defines';
import { settings } from '../modules/ui';

export let STATE : {
    isDryRun: boolean,
    cacheVars: Record<string, unknown>,
    traceId: number,
    initialVariables: Record<string, unknown>,
    isInPlace: boolean,
    messageId: number,
    swipeId: number,
} = {
    isDryRun: false,
    cacheVars: {},
    traceId: 0,
    initialVariables: {},
    isInPlace: false,
    messageId: -1,
    swipeId: -1,
};

type SimpleOptions = 'nx' | 'xx' | 'n' | 'nxs' | 'xxs' | 'global' | 'local' | 'message' | 'cache' | 'initial' | 'old' | 'new' | 'fullcache' | boolean;

/**
 * Combine all variables and cache it
 * @param msg_id Current message ID
 * @param sw_id Current message swipe ID
 * @returns all variables object
 */
export function precacheVariables(msg_id?: number, sw_id?: number): Record<string, unknown> {
    if(chat.length < 1) {
        STATE.cacheVars = {};
        return STATE.cacheVars;
    }

    clonePreviousMessage(msg_id ?? chat.length - 1);

    STATE.messageId = msg_id ?? chat.length - 1;
    if(STATE.messageId < 0)
        STATE.messageId = chat.length + STATE.messageId;
    if(STATE.messageId >= chat.length)
        STATE.messageId = chat.length - 1;
    STATE.swipeId = sw_id ?? chat[STATE.messageId].swipe_id ?? 0;
    const msgVars = ensureVariable(STATE.messageId, STATE.swipeId);
    
    STATE.cacheVars = _.cloneDeep(Object.assign(
        {},
        extension_settings.variables.global, // global variables
        STATE.initialVariables,
        chat_metadata.variables ?? {}, // chat variables
        msgVars ?? {}, // message variables
        { _trace_id: (STATE.traceId)++, _modify_id: 0 }, // trace ID
    ));
    
    // @ts-expect-error: 2339
    console.debug(`[Prompt Template] message #${STATE.messageId}.${STATE.swipeId} variables: `, chat[STATE.messageId]?.variables?.[STATE.swipeId]);
    console.debug(`[Prompt Template] all variables: `, STATE.cacheVars);
    return STATE.cacheVars;
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
        message_id = chat.findLastIndex((msg: Message) =>
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
        message_id = chat.findLastIndex((msg: Message) => !getter || msg.variables?.[msg.swipe_id ?? 0] != null);
    } else {
        if(msgid > chat.length)
            msgid = chat.length - 1;
        else if(msgid < 0)
            msgid = chat.length + msgid;
        
        message_id = msgid;
        if(getter) {
            // If the current message has no variables, search upwards
            message_id = chat.slice(0, msgid + 1).findLastIndex((msg: Message) => msg.variables?.[msg.swipe_id ?? 0] != null);
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
            console.debug(STATE.cacheVars);
        }
    }

    const { index, scope, flags, results, withMsg, merge, dryRun } = options;
    if (!dryRun && STATE.isDryRun) return undefined;

    let oldValue;
    let newValue = value;
    if (index != null) {
        let data = JSON.parse(get(STATE.cacheVars, key, '{}'));
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
        _.set(STATE.cacheVars, key, JSON.stringify(data));

        switch (scope || 'message') {
            case 'global':
                data = JSON.parse(_.get(extension_settings.variables.global, key, '{}') || '{}');
                newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
                _.set(extension_settings.variables.global, key, JSON.stringify(data));

                if (settings.debug_enabled)
                    console.debug(`Set global variable ${key} to ${newValue} (index ${idx})`);
                break;
            case 'local':
                if (!chat_metadata.variables)
                    chat_metadata.variables = {};

                data = JSON.parse(_.get(chat_metadata.variables, key, '{}') || '{}');
                newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
                _.set(chat_metadata.variables, key, JSON.stringify(data));

                if (settings.debug_enabled)
                    console.debug(`Set local variable ${key} to ${newValue} (index ${idx})`);
                break;
            case 'message':
                if (withMsg) {
                    // @ts-expect-error
                    const [message_id, swipe_id] = evalMessageFilter(withMsg, this?.message_id, this?.swipe_id, false);
                    if (message_id !== undefined && swipe_id !== undefined) {
                        const msgVars = ensureVariable(message_id, swipe_id);
                        data = JSON.parse(_.get(msgVars, key, '{}') || '{}');
                        newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
                        // @ts-expect-error: 2339
                        _.set(chat[message_id].variables[swipe_id], key, JSON.stringify(data));

                        // Update cache when same origin
                        if(message_id === STATE.messageId && swipe_id === STATE.swipeId)
                            _.set(STATE.cacheVars, key, JSON.stringify(data));

                        if (settings.debug_enabled)
                            console.debug(`Set message #${message_id}.${swipe_id} variable ${key} to ${newValue} (index ${idx})`);
                    }
                } else {
                    data = JSON.parse(_.get(STATE.cacheVars, key, '{}') || '{}');
                    newValue === undefined ? _.unset(data, idx) : _.set(data, idx, newValue);
                    // @ts-expect-error: 2339
                    _.set(chat[STATE.messageId].variables[STATE.swipeId], key, JSON.stringify(data));
                    _.set(STATE.cacheVars, key, JSON.stringify(data));
                    
                    if (settings.debug_enabled)
                        console.debug(`Set message variable ${key} to ${newValue} (index ${idx})`);
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
        STATE.cacheVars._modify_id = STATE.cacheVars._modify_id + 1 || 1;
    } else {
        if (flags === 'nx' && has(STATE.cacheVars, key)) return undefined;
        if (flags === 'xx' && !has(STATE.cacheVars, key)) return undefined;
        if (flags === 'nxs' && getVariable.call(this, key, options) !== undefined) return undefined;
        if (flags === 'xxs' && getVariable.call(this, key, options) === undefined) return undefined;

        if (results === 'old' || merge)
            oldValue = get(STATE.cacheVars, key, undefined);

        if (merge) {
            if ((oldValue === undefined || _.isArray(oldValue)) && _.isArray(value))
                newValue = _.concat(oldValue ?? [], value);
            else
                newValue = _.mergeWith(
                    _.cloneDeep(oldValue ?? {}),
                    value, (_dst: unknown, src: unknown) => _.isArray(src) ? src : undefined);
        }

        newValue === undefined ? unset(STATE.cacheVars, key) : set(STATE.cacheVars, key, newValue);

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
                if (!chat_metadata.variables)
                    chat_metadata.variables = {};

                if (newValue === undefined)
                    unset(chat_metadata.variables, key);
                else
                    set(chat_metadata.variables, key, newValue);

                if (settings.debug_enabled)
                    console.debug(`Set local variable ${key} to ${newValue}`);
                break;
            case 'message':
                if (withMsg) {
                    // @ts-expect-error
                    const [message_id, swipe_id] = evalMessageFilter(withMsg, this?.message_id, this?.swipe_id, false);
                    if (message_id !== undefined && swipe_id !== undefined) {
                        ensureVariable(message_id, swipe_id);

                        if (newValue === undefined) {
                            // @ts-expect-error: 2339
                            unset(chat[message_id].variables[swipe_id], key);

                            // Update cache when same origin
                            if(message_id === STATE.messageId && swipe_id === STATE.swipeId)
                                unset(STATE.cacheVars, key);
                        } else {
                            // @ts-expect-error: 2339
                            set(chat[message_id].variables[swipe_id], key, newValue);

                            // Update cache when same origin
                            if(message_id === STATE.messageId && swipe_id === STATE.swipeId)
                                set(STATE.cacheVars, key, newValue);
                        }

                        if (settings.debug_enabled)
                            console.debug(`Set message #${message_id}.${swipe_id} variable ${key} to ${newValue}`);
                    }
                } else {
                        if (newValue === undefined) {
                            unset(STATE.cacheVars, key);
                            // @ts-expect-error: 2339
                            unset(chat[STATE.messageId].variables[STATE.swipeId], key);
                        } else {
                            set(STATE.cacheVars, key, newValue);
                            // @ts-expect-error: 2339
                            set(chat[STATE.messageId].variables[STATE.swipeId], key, newValue);
                        }

                        if (settings.debug_enabled)
                            console.debug(`Set message variable ${key} to ${newValue}`);
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
        STATE.cacheVars._modify_id = STATE.cacheVars._modify_id + 1 || 1;
    }

    if (results === 'old')
        return oldValue;
    if (results === 'fullcache')
        return STATE.cacheVars;
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
            console.debug(STATE.cacheVars);
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
            if (!chat_metadata.variables)
                return defaults;
            if (index != null) {
                const data = JSON.parse(_.get(chat_metadata.variables, key, '{}') || '{}');
                const idx = Number(index);
                return _.get(data, Number.isNaN(idx) ? index : idx, defaults);
            }
            result = get(chat_metadata.variables, key, defaults);
            return options.clone ? _.cloneDeep(result) : result;
        case 'message':
            if(withMsg) {
                // @ts-expect-error
                const [message_id, swipe_id] = evalMessageFilter(withMsg, this?.message_id, this?.swipe_id, true);
                if (message_id !== undefined && swipe_id !== undefined) {
                    // @ts-expect-error: 2339
                    if (!chat[message_id]?.variables?.[swipe_id]) return defaults;
                    if (index != null) {
                        // @ts-expect-error: 2339
                        const data = JSON.parse(_.get(chat[message_id].variables[swipe_id], key, '{}') || '{}');
                        const idx = Number(index);
                        return _.get(data, Number.isNaN(idx) ? index : idx, defaults);
                    }

                    // @ts-expect-error: 2339
                    result = get(chat[message_id].variables[swipe_id], key, defaults);
                    return options.clone ? _.cloneDeep(result) : result;
                }
                return defaults;
            } else {
                if (index != null) {
                    const data = JSON.parse(_.get(STATE.cacheVars, key, '{}') || '{}');
                    const idx = Number(index);
                    return _.get(data, Number.isNaN(idx) ? index : idx, defaults);
                }
                result = get(STATE.cacheVars, key, defaults);
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
        const data = JSON.parse(_.get(STATE.cacheVars, key, '{}') || '{}');
        const idx = Number(index);
        return _.get(data, idx, defaults);
    }

    return get(STATE.cacheVars, key, defaults);
}

/**
 * Delete/Remove variable
 * if target is array/object, remove the key/index
 * if target is string, remove the substring
 * 
 * @param this Execution Context
 * @param key variable name
 * @param index key for object variable, or index for array variable, or substring for string variable
 * @param options options for setVariable
 * 
 * @returns The return value is determined by options.results
 */
export function removeVariable(
    this: Record<string, unknown>,
    key: string | null,
    index: unknown = undefined,
    options: SetVarOption | GetSetVarOption | SimpleOptions = {}) {
    if(index == null) {
        return setVariable.call(this, key, undefined, options);
    } else {
        const variable = getVariable.call(this, key, options);
        if(_.isArray(variable)) {
            const idx = variable.indexOf(index);
            if(idx !== -1) {
                variable.splice(idx, 1);
                return setVariable.call(this, key, variable, options);
            }
        } else if(_.isObject(variable)) {
            delete variable[index.toString()];
            return setVariable.call(this, key, variable, options);
        } else if(_.isString(variable) && _.isString(index)) {
            const idx = variable.indexOf(index);
            if(idx !== -1) {
                // @ts-expect-error: 2339
                variable.splice(idx, index.length);
                return setVariable.call(this, key, variable, options);
            }
        }
    }
    return undefined;
}

/**
 * Insert value to variable
 * if target is array, insert the value to the index
 * if target is object, insert the value to the key
 * if target is string, insert the value to the index
 * 
 * @param this Execution Context
 * @param key variable name
 * @param value value to insert
 * @param index where to insert, if not provided, append to the end
 * @param options options for setVariable
 * 
 * @returns The return value is determined by options.results
 */
export function insertVariable(
    this: Record<string, unknown>,
    key: string | null,
    value: unknown,
    index: number | string | undefined = undefined,
    options: SetVarOption | SimpleOptions = {},
) {
    options = optionsConverter(options) as SetVarOption;
    let variable = getVariable.call(this, key, options);
    if(_.isArray(variable)) {
        if(index == null) {
            variable.push(value);
        } else {
            index = Number(index) < 0 ? variable.length + Number(index) : Number(index);
            variable.splice(index, 0, value);
        }

        return setVariable.call(this, key, variable, options);
    } else if(_.isObject(variable) && index != null) {
        const exists = variable.hasOwnProperty(index.toString());
        if(options.flags?.includes('nx') && exists) return undefined;
        if(options.flags?.includes('xx') && !exists) return undefined;

        variable[index.toString()] = value;
        return setVariable.call(this, key, variable, options);
    } else if(_.isString(variable)) {
        if(index == null) {
            // @ts-expect-error: 18046
            variable += value.toString();
        } else if(_.isString(index)) {
            const idx = variable.indexOf(index);
            if(idx !== -1) {
                // @ts-expect-error: 18046
                variable.splice(idx, value.toString().length, value.toString());
            }
        } else {
            index = Number(index) < 0 ? variable.length + Number(index) : Number(index);
            // @ts-expect-error: 18046
            variable.splice(Number(index), 0, value.toString());
        }
        
        return setVariable.call(this, key, variable, options);
    }

    return undefined;
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
            console.debug(STATE.cacheVars);
        }
    }

    const { index, inscope, outscope, flags, defaults, results, withMsg, dryRun, min, max } = options;
    if ((flags === 'nx' && !_.has(STATE.cacheVars, key)) ||
        (flags === 'xx' && _.has(STATE.cacheVars, key)) ||
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
    if (force || settings.autosave_enabled !== false)
        await saveChatConditional();
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

/**
 * Find the previous available variable
 * @param message_id current message id
 * @param key variable key
 * @returns variables object
 */
export function findPreviousMessageVariables(message_id?: number, key?: string) : Record<string, any> {
    const message : Message | undefined = chat
        .slice(0, message_id)
        .findLast((msg: Message) =>
            // !msg.is_system &&
            // !msg.is_user &&
            msg.variables?.[msg?.swipe_id ?? 0] != null &&
            (key == null || get(msg.variables?.[msg?.swipe_id ?? 0], key, null) != null)
        );
    
    return message?.variables?.[message.swipe_id ?? 0] ?? {};
}

/**
 * Clone variables from the previous message
 * @param message_id current message id
 * @param swipe_id current swipe id
 * @returns success
 */
export function clonePreviousMessage(message_id: number, swipe_id?: number): boolean {
    if(chat[message_id] == null || chat[message_id - 1] == null)
        return false;

    const message = chat[message_id] as Message;
    swipe_id = swipe_id ?? message.swipe_id ?? 0;

    if(message.variables_initialized?.[swipe_id])
        return false;

    const lastVars = ensureVariable(message_id, swipe_id);
    const prevVars = findPreviousMessageVariables(message_id);

    // @ts-expect-error: 18048
    message.variables[swipe_id] = _.cloneDeep(Object.assign({}, prevVars, lastVars));
    // @ts-expect-error: 18048
    message.variables_initialized[swipe_id] = true;
    // @ts-expect-error: 18048
    console.debug(`[Prompt Template] clone previous message variables: `, message.variables[swipe_id]);
    return true;
}

function ensureVariable(
    message_id: number,
    swipe_id: number = 0,
    defaults: Record<string, any> = {}
): Record<string, any> | null {
    const message = chat[message_id] as Message;
    if(message) {
        if(!message.variables) {
            message.variables = [];
        } else if(!Array.isArray(message.variables)) {
            // convert from old style ({0: {}, 1: {}} to [{}, {}, ...])
            message.variables = Object.assign([], message.variables);
        }

        if(!message.variables[swipe_id]) {
            message.variables[swipe_id] = defaults;
        }

        if(!message.variables_initialized) {
            message.variables_initialized = [];
        } else if(!Array.isArray(message.variables_initialized)) {
            // convert from old style
            message.variables_initialized = Object.assign([], message.variables_initialized);
        }

        return message.variables[swipe_id];
    }

    return null;
}