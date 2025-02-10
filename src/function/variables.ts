import { chat, chat_metadata } from '../../../../../../script.js';
import { extension_settings } from '../../../../../extensions.js';
import { Message, Metadata } from '../defines.js';

export function allVariables() {
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

export function setVariable(vars : Record<string, unknown>, key : string, value : unknown,
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

export function getVariable(vars : Record<string, unknown>, key : string,
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

export function increaseVariable(vars : Record<string, unknown>, key : string,
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

export function decreaseVariable(vars : Record<string, unknown>, key : string,
                          value : number = 1,
                          index: number | null = null,
                          scope : 'global' | 'local' | 'message' = 'message',
                          flags: 'nx' | 'xx' | 'n' = 'n') {
    return increaseVariable(vars, key, -value, index, scope, flags);
}
