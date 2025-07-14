import { oai_settings } from "../../../../../openai.js";

/**
 * Get the preset prompts content
 * Only the current preset can be obtained
 * 
 * @param name Prompt name
 * @returns content
 */
export function getPresetPromptsContent(name: string | RegExp) : string | null {
    const preset = oai_settings.prompts.find(p => p.name === name || p.name.match(name));
    if (!preset)
        return null;

    return preset?.content || null;
}

/**
 * Get all the prompts in the current preset
 * 
 * @returns Prompt name
 */
export function* getPresetPrompts() : Generator<string> {
    for(const preset of oai_settings.prompts)
        yield preset.name;
}

export function getPresetSortedPredefined(identifier: Set<string> = new Set([
    "main", "dialogueExamples", "chatHistory", "charDescription",
])) {
    return oai_settings.prompts.filter(preset => identifier.has(preset.identifier)).map(preset => preset.identifier);
}
