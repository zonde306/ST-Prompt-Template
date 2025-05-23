import { h64 } from 'xxhashjs';

export interface PromptInjected {
    order: number;
    prompt: string;
    sticky: number;
    uid: string; // Ensure uuid is always present
}

let promptInjected = new Map<string, Map<string, PromptInjected>>();

export function injectPrompt(
    key: string,
    prompt: string,
    order: number = 100,
    sticky: number = 0,
    uid: string = ''
): void {
    if (!promptInjected.has(key)) {
        promptInjected.set(key, new Map<string, PromptInjected>());
    }

    uid = uid || h64(`${key}#${prompt}`, 0x1984).toString();
    promptInjected.get(key)!.set(uid, { prompt, order, sticky, uid: uid });
}

export function getPromptsInjected(key: string): string {
    const innerMap = promptInjected.get(key);
    if (!innerMap) {
        return '';
    }

    return Array.from(innerMap.values())
        .sort((a, b) => a.order - b.order)
        .map(p => p.prompt)
        .join('\n');
}

export function deactivatePromptInjection(count: number = 1): void {
    for (const key of Array.from(promptInjected.keys())) {
        const innerMap = promptInjected.get(key);
        if (!innerMap) {
            continue;
        }

        const uuidsToRemove: string[] = [];
        for (const [uuid, promptObj] of innerMap.entries()) {
            const newSticky = promptObj.sticky - count;
            if (newSticky >= 0) {
                promptObj.sticky = newSticky;
            } else {
                uuidsToRemove.push(uuid);
            }
        }

        if (uuidsToRemove.length > 0) {
            if (uuidsToRemove.length === innerMap.size) {
                promptInjected.delete(key);
            } else {
                for (const uuid of uuidsToRemove) {
                    innerMap.delete(uuid);
                }
                if (innerMap.size === 0) {
                    promptInjected.delete(key);
                }
            }
        }
    }
}
