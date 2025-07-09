import { hasher } from "./hasher";
import { settings } from "../modules/ui";

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
    if(!uid && hasher.xxhash) {
        if(settings.cache_hasher === 'h32ToString')
            uid = hasher.xxhash.h32ToString(`${key}#${prompt}`, 0x1984);
        else if(settings.cache_hasher === 'h64ToString')
            uid = hasher.xxhash.h64ToString(`${key}#${prompt}`, 0x1984n);
        else
            console.error(`hasher ${settings.cache_hasher} not supported`);
    }
    promptInjected.get(key)!.set(uid, { prompt, order, sticky, uid: uid });
}

export interface PostProcess {
    search: RegExp | string;
    replace: string;
}

export function getPromptsInjected(key: string, postprocess: PostProcess[] = []): string {
    const innerMap = promptInjected.get(key);
    if (!innerMap) {
        return '';
    }

    /*
    return [
            // a string
            Array.from(innerMap.values())
                .sort((a, b) => a.order - b.order)
                .map(p => p.prompt)
                .join('\n'),
        
            // some postprocessing
            ...postprocess
        ]
        .reduce(
            (left: string | PostProcess, right: PostProcess | string) => {
            // left always a string
            // right always a PostProcess
            return (left as string).replace(
                (right as PostProcess).search,
                (right as PostProcess).replace
            );
        }) as string; // final always a string
    */

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

export function hasPromptsInjected(key: string) {
    return promptInjected.has(key);
}
