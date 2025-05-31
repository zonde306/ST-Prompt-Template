import { oai_settings } from "../../../../../openai.js";

export function getPresetPromptsContent(name: string | RegExp) : string | null {
    const preset = oai_settings.prompts.find(p => p.name === name || p.name.match(name));
    if (!preset)
        return null;

    return preset?.content || null;
}


export function* getPresetPrompts() : Generator<string> {
    for(const preset of oai_settings.prompts)
        yield preset.name;
}

export function getPresetSortedPredefined(identifier: Set<string> = new Set([
    "main", "dialogueExamples", "chatHistory", "charDescription",
])) {
    return oai_settings.prompts.filter(preset => identifier.has(preset.identifier)).map(preset => preset.identifier);
}
