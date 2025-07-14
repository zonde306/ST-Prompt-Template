import { chat, substituteParams } from "../../../../../../script.js";
import { getRegexedString, regex_placement } from "../../../../regex/engine.js";
import { Message } from "../modules/defines";

function processMessage(message: Message) : string {
    const placement = message.is_user ? regex_placement.USER_INPUT : regex_placement.AI_OUTPUT;
    return substituteParams(getRegexedString(message.mes, placement, {
        characterOverride: message.name,
        isPrompt: true
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
    const messages : Message[] = chat.filter(x => !role || (role === 'user' && x.is_user) || (role === 'system' && x.is_system) || (role === 'assistant' && !x.is_user && !x.is_system));
    return processMessage(messages[idx > -1 ? idx : messages.length + idx] || '');
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
            return chat
                .slice(0, startOrCount)
                .map(processMessage);
        } else if(startOrCount < 0) {
            return chat
                .slice(startOrCount)
                .map(processMessage);
        }
    } else if(typeof endOrRole === 'string') {
        if(startOrCount > 0) {
            return chat
                .filter(x => (endOrRole === 'user' && x.is_user) || (endOrRole === 'system' && x.is_system) || (endOrRole === 'assistant' && !x.is_user && !x.is_system))
                .slice(0, startOrCount)
                .map(processMessage);
        } else if(startOrCount < 0) {
            return chat
                .filter(x => (endOrRole === 'user' && x.is_user) || (endOrRole === 'system' && x.is_system) || (endOrRole === 'assistant' && !x.is_user && !x.is_system))
                .slice(startOrCount)
                .map(processMessage);
        }
    } else if(typeof endOrRole === 'number') {
        if(startOrCount > 0) {
            return chat
                .filter(x => !role || (role === 'user' && x.is_user) || (role === 'system' && x.is_system) || (role === 'assistant' && !x.is_user && !x.is_system))
                .slice(startOrCount, endOrRole)
                .map(processMessage);
        } else if(startOrCount < 0) {
            return chat
                .filter(x => !role || (role === 'user' && x.is_user) || (role === 'system' && x.is_system) || (role === 'assistant' && !x.is_user && !x.is_system))
                .slice(startOrCount, endOrRole)
                .map(processMessage);
        }
    }

    return [];
}
