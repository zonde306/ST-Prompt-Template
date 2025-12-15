import { chat, substituteParams } from "../../../../../../script.js";
import { getRegexedString, regex_placement } from "../../../../regex/engine.js";
import { Message } from "../modules/defines";

/**
 * Perform regexp and macro processing on message content
 * @param message Message
 * @returns message content
 */
function processMessage(message?: Message & { id: number }) : string {
    if(message == null)
        return '';
    const placement = message.is_user ? regex_placement.USER_INPUT : regex_placement.AI_OUTPUT;
    return substituteParams(getRegexedString(message.mes ?? '', placement, {
        characterOverride: message.name,
        isPrompt: true,
        depth: chat.length - message.id - 1, // [0...6].length === 7
    }));
}

/**
 * Get the specified chat message content
 * 
 * @param idx Message offset
 * @param role Role Filters
 * @returns Message content
 */
export function getChatMessage(idx: number, role?: 'user' | 'assistant' | 'system') : string {
    const messages : (Message & { id: number })[] = Object.entries(chat)
        .map(([id, obj]) => ({ ...obj, id: Number(id) }))
        .filter(x => !role || (role === 'user' && x.is_user) || (role === 'system' && x.is_system) || (role === 'assistant' && !x.is_user && !x.is_system));
    return processMessage(messages[idx > -1 ? idx : messages.length + idx]);
}

/**
 * Get the first N messages in the message list
 * @param end End position
 * @returns Message content
 */
export function getChatMessages(end : number) : string[];

/**
 * Get the first N messages in a message list, selecting only specific roles
 * @param end End position
 * @param role role
 * @returns Message content
 */
export function getChatMessages(end : number, role: 'user' | 'assistant' | 'system') : string[];

/**
 * Get the messages from start to end
 * @param start Start position
 * @param end End position
 * @returns Message content
 */
export function getChatMessages(start : number, end : number) : string[];

/**
 * Get the messages from start to end, selecting only specific roles
 * @param start Start position
 * @param end End position
 * @param role role
 * @returns Message content
 */
export function getChatMessages(start : number, end : number, role: 'user' | 'assistant' | 'system') : string[];

export function getChatMessages(startOrCount: number = chat.length,
    endOrRole?: number | 'user' | 'assistant' | 'system',
    role?: 'user' | 'assistant' | 'system') : string[] {
    if(endOrRole == null) {
        if(startOrCount > 0) {
            return Object.entries(chat)
                .map(([idx, obj]) => ({ ...obj, id: Number(idx) }))
                .slice(0, startOrCount)
                .map(processMessage);
        } else if(startOrCount < 0) {
            return Object.entries(chat)
                .map(([idx, obj]) => ({ ...obj, id: Number(idx) }))
                .slice(startOrCount)
                .map(processMessage);
        }
    } else if(typeof endOrRole === 'string') {
        if(startOrCount > 0) {
            return Object.entries(chat)
                .map(([idx, obj]) => ({ ...obj, id: Number(idx) }))
                .filter(x => (endOrRole === 'user' && x.is_user) || (endOrRole === 'system' && x.is_system) || (endOrRole === 'assistant' && !x.is_user && !x.is_system))
                .slice(0, startOrCount)
                .map(processMessage);
        } else if(startOrCount < 0) {
            return Object.entries(chat)
                .map(([idx, obj]) => ({ ...obj, id: Number(idx) }))
                .filter(x => (endOrRole === 'user' && x.is_user) || (endOrRole === 'system' && x.is_system) || (endOrRole === 'assistant' && !x.is_user && !x.is_system))
                .slice(startOrCount)
                .map(processMessage);
        }
    } else if(typeof endOrRole === 'number') {
        if(startOrCount > 0) {
            return Object.entries(chat)
                .map(([idx, obj]) => ({ ...obj, id: Number(idx) }))
                .filter(x => !role || (role === 'user' && x.is_user) || (role === 'system' && x.is_system) || (role === 'assistant' && !x.is_user && !x.is_system))
                .slice(startOrCount, endOrRole)
                .map(processMessage);
        } else if(startOrCount < 0) {
            return Object.entries(chat)
                .map(([idx, obj]) => ({ ...obj, id: Number(idx) }))
                .filter(x => !role || (role === 'user' && x.is_user) || (role === 'system' && x.is_system) || (role === 'assistant' && !x.is_user && !x.is_system))
                .slice(startOrCount, endOrRole)
                .map(processMessage);
        }
    }

    return [];
}

/**
 * Options for the matchChatMessages function
 * @param start Start position
 * @param end End position
 * @param role Role for filtering messages
 * @param and If true, only matches where all the patterns match
 */
interface GetChatMessageOptions {
    start?: number;
    end?: number;
    role?: 'user' | 'assistant' | 'system';
    and?: boolean;
}

/**
 * Checks if the given pattern is in chat messages
 * @see getChatMessages
 * 
 * @param pattern Search content
 * @param options Options for getChatMessages
 * @returns Returns true if found, false otherwise
 */
export function matchChatMessages(pattern: string | RegExp | string[] | RegExp[], options : GetChatMessageOptions = {}) {
    // @ts-expect-error
    const messages = getChatMessages(options.start ?? -2, options.end, options.role);
    if(!Array.isArray(pattern))
        pattern = [ pattern ] as string[] | RegExp[];

    return messages.some(x =>
        options.and ?
            (pattern as RegExp[] | string[]).every(y => x.match(y)) :
            (pattern as RegExp[] | string[]).some(y => x.match(y))
    );
}
