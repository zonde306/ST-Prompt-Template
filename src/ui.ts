import { eventSource, event_types, saveSettingsDebounced } from '../../../../../script.js';
import { extension_settings, renderExtensionTemplateAsync } from '../../../../extensions.js';

const DEFAULT_SETTINGS : Record<string, { name: string, value: boolean }> = {
    '#pt_enabled': { name: 'enabled', value: true },
    '#pt_generate_enabled': { name: 'generate_enabled', value: true },
    '#pt_generate_before_enabled': { name: 'generate_before_enabled', value: true },
    '#pt_generate_after_enabled': { name: 'generate_after_enabled', value: true },
    '#pt_render_enabled': { name: 'render_enabled', value: true },
    '#pt_render_before_enabled': { name: 'render_before_enabled', value: true },
    '#pt_render_after_enabled': { name: 'render_after_enabled', value: true },
    '#pt_strict_enabled': { name: 'strict_enabled', value: false },
    '#pt_debug_enabled': { name: 'debug_enabled', value: false },
    '#pt_autosave_enabled': { name: 'autosave_enabled', value: true },
    '#pt_preload_worldinfo': { name: 'preload_worldinfo_enabled', value: true },
    '#pt_code_blocks': { name: 'code_blocks_enabled', value: false },
    '#pt_world_active': { name: 'world_active_enabled', value: true },
};

interface EjsSettings extends Record<string, boolean> {
    enabled: boolean;
    generate_enabled: boolean;
    generate_before_enabled: boolean;
    generate_after_enabled: boolean;
    render_enabled: boolean;
    render_before_enabled: boolean;
    render_after_enabled: boolean;
    strict_enabled: boolean;
    debug_enabled: boolean;
    autosave_enabled: boolean;
    preload_worldinfo_enabled: boolean;
    code_blocks_enabled: boolean;
    world_active_enabled: boolean;
};

export const settings = {} as EjsSettings;

export function loadSettings() {
    // @ts-expect-error: 2339
    if(!extension_settings.EjsTemplate) {
        // @ts-expect-error: 2339
        extension_settings.EjsTemplate = {};
    }

    for(const [id, setting] of Object.entries(DEFAULT_SETTINGS)) {
        // @ts-expect-error: 2339
        extension_settings.EjsTemplate[setting.name] = $(id).prop('checked') ?? setting.value;
        settings[setting.name] = $(id).prop('checked') ?? setting.value;
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
        loadSettings();
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
