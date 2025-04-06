import { chat, substituteParams } from "../../../../../../script.js";
import { getRegexedString, regex_placement } from "../../../../regex/engine.js";
import { Message } from "../defines";

function processMessage(message: Message) : string {
    const placement = message.is_user ? regex_placement.USER_INPUT : regex_placement.AI_OUTPUT;
    return substituteParams(getRegexedString(message.mes, placement, {
        characterOverride: message.name,
        isPrompt: true
    }));
}

export function getChatMessage(idx: number, role?: 'user' | 'assistant' | 'system') : string {
    const messages : Message[] = chat.filter(x => !role || (role === 'user' && x.is_user) || (role === 'system' && x.is_system) || (role === 'assistant' && !x.is_user && !x.is_system));
    return processMessage(messages[idx > -1 ? idx : messages.length + idx] || '');
}

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
