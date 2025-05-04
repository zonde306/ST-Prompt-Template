
export interface PromptInjected {
    order: number;
    prompt: string;
    sticky: number;
}

let promptInjected = new Map<string, PromptInjected[]>;

export function injectPrompt(key: string, prompt: string, order: number = 100, sticky: number = 0) {
    if(!promptInjected.has(key))
        promptInjected.set(key, []);
    promptInjected.get(key)?.push({ prompt, order, sticky });
}

export function getPromptsInjected(key: string) : string {
    return promptInjected.get(key)?.sort((a, b) => a.order - b.order).map(p => p.prompt).join('\n') ?? '';
}

export function deactivatePromptInjection(count: number = 1) {
    for(const [key, prompts] of Array.from(promptInjected.entries())) {
        const left = prompts.map(x => ({ ...x, sticky: x.sticky - count })).filter(x => x.sticky >= 0);
        if(left.length > 0)
            promptInjected.set(key, left);
        else
            promptInjected.delete(key);
    }
}
