import { eventSource, event_types, saveSettingsDebounced } from '../../../../../script.js';
import { extension_settings, renderExtensionTemplateAsync } from '../../../../extensions.js';

const DEFAULT_SETTINGS : Record<string, { name: string, value: boolean }> = {
    '#pt_enabled': { name: 'enabled', value: true },
    '#pt_generate_enabled': { name: 'generate_enabled', value: true },
    '#pt_generate_loader_enabled': { name: 'generate_loader_enabled', value: true },
    '#pt_render_enabled': { name: 'render_enabled', value: true },
    '#pt_render_loader_enabled': { name: 'render_loader_enabled', value: true },
    '#pt_strict_enabled': { name: 'strict_enabled', value: false },
    '#pt_debug_enabled': { name: 'debug_enabled', value: false },
    '#pt_autosave_enabled': { name: 'autosave_enabled', value: true },
    '#pt_preload_worldinfo': { name: 'preload_worldinfo_enabled', value: true },
    '#pt_code_blocks': { name: 'code_blocks_enabled', value: false },
    '#pt_world_active': { name: 'world_active_enabled', value: true },
    '#pt_permanent_evaluation': { name: 'permanent_evaluation_enabled', value: false },
    '#pt_filter_chat_message': { name: 'filter_message_enabled', value: true },
};

interface EjsSettings {
    enabled: boolean;
    generate_enabled: boolean;
    generate_loader_enabled: boolean;
    render_enabled: boolean;
    render_loader_enabled: boolean;
    strict_enabled: boolean;
    debug_enabled: boolean;
    autosave_enabled: boolean;
    preload_worldinfo_enabled: boolean;
    code_blocks_enabled: boolean;
    world_active_enabled: boolean;
    permanent_evaluation_enabled: boolean;
    filter_message_enabled: boolean;
};

export const settings = {} as EjsSettings;

export function loadSettings(reset: boolean = false) {
    // @ts-expect-error: 2339
    if(!extension_settings.EjsTemplate) {
        // @ts-expect-error: 2339
        extension_settings.EjsTemplate = {};
        reset = true;
    }

    for(const [id, setting] of Object.entries(DEFAULT_SETTINGS)) {
        if(reset) {
            // @ts-expect-error: 2339
            extension_settings.EjsTemplate[setting.name] = setting.value;
            // @ts-expect-error: 7053
            settings[setting.name] = setting.value;
        } else {
        // @ts-expect-error: 2339
            extension_settings.EjsTemplate[setting.name] = $(id).prop('checked') ?? setting.value;
            // @ts-expect-error: 7053
            settings[setting.name] = $(id).prop('checked') ?? setting.value;
        }
    }

    if(reset) {
        handleSettingLoad();
        saveSettingsDebounced();
    }
}

function handleSettingLoad() {
    for(const [id, setting] of Object.entries(DEFAULT_SETTINGS)) {
        // @ts-expect-error: 2339
        $(id).prop('checked', extension_settings.EjsTemplate?.[setting.name] ?? settings[setting.name] ?? setting.value);
        // @ts-expect-error: 2339
        settings[setting.name] = extension_settings.EjsTemplate?.[setting.name] ?? settings[setting.name] ?? setting.value;
    }
}

function handleSettingSave() {
    loadSettings();
}

export async function init() {
    $('#extensions_settings').append(await renderExtensionTemplateAsync('third-party/ST-Prompt-Template', 'settings'));

    for(const [id, setting] of Object.entries(DEFAULT_SETTINGS)) {
        $(id).off('click').on('click', () => {
            // @ts-expect-error: 2339
            if(!extension_settings.EjsTemplate) {
                // @ts-expect-error: 2339
                extension_settings.EjsTemplate = {};
            }

            // @ts-expect-error: 2339
            extension_settings.EjsTemplate[setting.name] = $(id).prop('checked') ?? setting.value;
            // @ts-expect-error: 7053
            settings[setting.name] = $(id).prop('checked') ?? setting.value;
            // @ts-expect-error: 2339
            console.debug(`[Prompt Template] setting ${setting.name} changed to ${extension_settings.EjsTemplate[setting.name]}`);
            saveSettingsDebounced();
        });
    }

    // @ts-expect-error: 2339
    if(!extension_settings.EjsTemplate) {
        // @ts-expect-error: 2339
        extension_settings.EjsTemplate = {};
        loadSettings(true);
    }
    
    eventSource.on(event_types.SETTINGS_LOADED, handleSettingLoad);
    eventSource.on(event_types.SETTINGS_UPDATED, handleSettingSave);
    handleSettingLoad();
}

export async function exit() {
    $('#extensions_settings').remove('#prompt_template_settings');
    eventSource.removeListener(event_types.SETTINGS_LOADED, handleSettingLoad);
    eventSource.removeListener(event_types.SETTINGS_UPDATED, handleSettingSave);
}
