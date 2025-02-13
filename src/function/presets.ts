import { oai_settings } from "../../../../../openai";

export function getPresetPromptsContent(name: string | RegExp) : string | null {
    const preset = oai_settings.prompts.find(p => p.name === name || p.name.match(name));
    if (!preset)
        return null;

    return preset?.content || null;
}

