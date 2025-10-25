import { oai_settings, getChatCompletionModel } from "../../../../../openai.js";
import { online_status, nai_settings, main_api } from "../../../../../../script.js";

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

export function getGeneratingModel() {
    let model = '';
    switch (main_api) {
        case 'kobold':
            model = online_status;
            break;
        case 'novel':
            model = nai_settings.model_novel;
            break;
        case 'openai':
            model = getChatCompletionModel();
            break;
        case 'textgenerationwebui':
            model = online_status;
            break;
        /*
        case 'koboldhorde':
            model = kobold_horde_model;
            break;
        */
    }
    return model;
}
