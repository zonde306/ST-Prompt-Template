import { hashString } from "./hasher";

export interface PromptInjected {
    order: number;
    prompt: string;
    sticky: number;
    uid: string; // Ensure uuid is always present
}

let promptInjected = new Map<string, Map<string, PromptInjected>>();

/**
 * Add prompts to the injection list and use getPromptsInjected to read the list
 * @see getPromptsInjected
 * 
 * @param key List Name
 * @param prompt prompts
 * @param order Order in list, ascending
 * @param sticky The number of times a call will continue to generate
 * @param uid Unique ID, automatically generated if not filled in
 */
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

    // Generate uid
    if(!uid)
        uid = hashString(`${key}#${prompt}`, 0xdeadbeef);
    
    promptInjected.get(key)!.set(uid, { prompt, order, sticky, uid: uid });
}

export interface PostProcess {
    search: RegExp | string;
    replace: string;
}

/**
 * Get the prompts in the injectPrompt list and merge them in order
 * @see injectPrompt
 * 
 * @param key List Name
 * @param postprocess Process the content
 * @returns prompts
 */
export function getPromptsInjected(key: string, postprocess: PostProcess[] = []): string {
    const innerMap = promptInjected.get(key);
    if (!innerMap) {
        return '';
    }

    let combinedPrompt = Array.from(innerMap.values())
        .sort((a, b) => a.order - b.order)
        .map(p => p.prompt)
        .join('\n');

    for (const pp of postprocess)
        combinedPrompt = combinedPrompt.replace(pp.search, pp.replace);

    return combinedPrompt;
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

/**
 * Check if injectPrompt exists
 * @param key List Name
 */
export function hasPromptsInjected(key: string) : boolean {
    return promptInjected.has(key);
}
