import { hashString } from "./hasher";
import { world_info_max_recursion_steps } from '../../../../../world-info.js';

export interface PromptInjected {
    order: number;
    prompt: string;
    sticky: number;
    uid: string; // Ensure uuid is always present
}

export interface PostProcess {
    search: RegExp | string;
    replace: string;
}

export type SerializedPromptInjected = Record<string, PromptInjected[]>;

export class PromptInjectionSession {
    private promptInjected = new Map<string, Map<string, PromptInjected>>();
    private forceOutlet = false;
    private postprocessOutlets = new Map<string, { key: string; postprocess: PostProcess[] }>();
    private ppCounter = 0;

    constructor(initialSnapshot?: SerializedPromptInjected | null) {
        if (initialSnapshot) {
            this.importSnapshot(initialSnapshot);
        }
    }

    injectPrompt(
        key: string,
        prompt: string,
        order: number = 100,
        sticky: number = 0,
        uid: string = ''
    ): void {
        if (!this.promptInjected.has(key)) {
            this.promptInjected.set(key, new Map<string, PromptInjected>());
        }

        if (!uid) {
            uid = hashString(`${key}#${prompt}`, 0xdeadbeef);
        }

        this.promptInjected.get(key)!.set(uid, { prompt, order, sticky, uid });
    }

    getPromptsInjected(key: string, postprocess: PostProcess[] = [], outlet: boolean = this.forceOutlet): string {
        if (outlet) {
            if (postprocess.length <= 0) {
                return `{{outletPromptsInjected:${key}}}`;
            }
            const tokenId = `pp_${this.ppCounter++}`;
            this.postprocessOutlets.set(tokenId, { key, postprocess: [...postprocess] });
            return `{{outletPromptsInjectedPP:${tokenId}}}`;
        }

        return this.resolvePrompts(key, postprocess);
    }

    private resolvePrompts(key: string, postprocess: PostProcess[] = []): string {
        const innerMap = this.promptInjected.get(key);
        if (!innerMap) {
            return '';
        }

        let combinedPrompt = Array.from(innerMap.values())
            .sort((a, b) => a.order - b.order)
            .map(p => p.prompt)
            .join('\n');

        for (const pp of postprocess) {
            combinedPrompt = combinedPrompt.replace(pp.search, pp.replace);
        }

        return combinedPrompt;
    }

    applyOutlets(content: string, recursion: number = world_info_max_recursion_steps + 1): string {
        if (!content || (!content.includes('{{outletPromptsInjected:') && !content.includes('{{outletPromptsInjectedPP:'))) {
            return content;
        }
        let result = content;
        for (let i = 0; i < recursion; i++) {
            const hasPlain = result.includes('{{outletPromptsInjected:');
            const hasPP = result.includes('{{outletPromptsInjectedPP:');
            if (!hasPlain && !hasPP) {
                break;
            }
            if (hasPP) {
                result = result.replace(/\{\{outletPromptsInjectedPP:(.+?)\}\}/g, (_, tokenId) => {
                    const entry = this.postprocessOutlets.get(tokenId);
                    return entry ? this.resolvePrompts(entry.key, entry.postprocess) : '';
                });
            }
            if (hasPlain) {
                result = result.replace(/\{\{outletPromptsInjected:(.+?)\}\}/g, (_, key) => this.resolvePrompts(key));
            }
        }
        return result;
    }

    setForceOutlet(force: boolean = true): void {
        this.forceOutlet = force;
    }

    tickSticky(count: number = 1): void {
        for (const key of Array.from(this.promptInjected.keys())) {
            const innerMap = this.promptInjected.get(key);
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
                    this.promptInjected.delete(key);
                } else {
                    for (const uuid of uuidsToRemove) {
                        innerMap.delete(uuid);
                    }
                    if (innerMap.size === 0) {
                        this.promptInjected.delete(key);
                    }
                }
            }
        }
    }

    hasPromptsInjected(key: string): boolean {
        return this.promptInjected.has(key);
    }

    exportSnapshot(): SerializedPromptInjected {
        const snapshot: SerializedPromptInjected = {};
        for (const [key, innerMap] of this.promptInjected.entries()) {
            const items = Array.from(innerMap.values()).map(item => ({ ...item }));
            if (items.length > 0) {
                snapshot[key] = items;
            }
        }
        return snapshot;
    }

    importSnapshot(snapshot?: SerializedPromptInjected | null): void {
        this.promptInjected.clear();
        this.postprocessOutlets.clear();
        if (!snapshot || typeof snapshot !== 'object') {
            return;
        }
        for (const [key, items] of Object.entries(snapshot)) {
            if (!Array.isArray(items) || items.length === 0) {
                continue;
            }
            const innerMap = new Map<string, PromptInjected>();
            for (const item of items) {
                if (!item || typeof item !== 'object' || typeof item.prompt !== 'string') {
                    continue;
                }
                const order = typeof item.order === 'number' && Number.isFinite(item.order) ? item.order : 100;
                const sticky = typeof item.sticky === 'number' && Number.isFinite(item.sticky) ? item.sticky : 0;
                const uid = typeof item.uid === 'string' && item.uid ? item.uid : hashString(`${key}#${item.prompt}`, 0xdeadbeef);
                innerMap.set(uid, { prompt: item.prompt, order, sticky, uid });
            }
            if (innerMap.size > 0) {
                this.promptInjected.set(key, innerMap);
            }
        }
    }

    clear(): void {
        this.promptInjected.clear();
        this.postprocessOutlets.clear();
        this.forceOutlet = false;
    }
}

const defaultSession = new PromptInjectionSession();

export function createInjectionSession(initialSnapshot?: SerializedPromptInjected | null): PromptInjectionSession {
    return new PromptInjectionSession(initialSnapshot);
}

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
    defaultSession.injectPrompt(key, prompt, order, sticky, uid);
}

/**
 * Get the prompts in the injectPrompt list and merge them in order
 * @see injectPrompt
 * 
 * @param key List Name
 * @param postprocess Process the content
 * @param outlet Whether to use the outlet
 * @returns prompts
 */
export function getPromptsInjected(key: string, postprocess: PostProcess[] = [], outlet?: boolean): string {
    return defaultSession.getPromptsInjected(key, postprocess, outlet);
}

/**
 * Apply the prompts injected to the context
 * 
 * @param content content
 * @param recursion recursion
 * @returns processed content with injected prompts
 */
export function applyOutletPromptsInjected(content: string, recursion: number = world_info_max_recursion_steps + 1): string {
    return defaultSession.applyOutlets(content, recursion);
}

/**
 * Force the use of outlet
 */
export function setForceOutlet(force: boolean = true) {
    defaultSession.setForceOutlet(force);
}

export function deactivatePromptInjection(count: number = 1): void {
    defaultSession.tickSticky(count);
}

/**
 * Check if injectPrompt exists
 * @param key List Name
 */
export function hasPromptsInjected(key: string) : boolean {
    return defaultSession.hasPromptsInjected(key);
}
