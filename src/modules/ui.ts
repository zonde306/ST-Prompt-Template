import { eventSource, event_types, saveSettingsDebounced } from '../../../../../../script.js';
import { extension_settings, renderExtensionTemplateAsync } from '../../../../../extensions.js';
import ejs from '../3rdparty/ejs.js';

const DEFAULT_SETTINGS : Record<string, { name: string, value: boolean | string | number }> = {
    '#pt_enabled': { name: 'enabled', value: true },
    '#pt_generate_enabled': { name: 'generate_enabled', value: true },
    '#pt_generate_loader_enabled': { name: 'generate_loader_enabled', value: true },
    '#pt_render_enabled': { name: 'render_enabled', value: true },
    '#pt_render_loader_enabled': { name: 'render_loader_enabled', value: true },
    '#pt_with_context_disabled': { name: 'with_context_disabled', value: false },
    '#pt_debug_enabled': { name: 'debug_enabled', value: false },
    '#pt_autosave_enabled': { name: 'autosave_enabled', value: false },
    '#pt_preload_worldinfo': { name: 'preload_worldinfo_enabled', value: true },
    '#pt_code_blocks': { name: 'code_blocks_enabled', value: true },
    '#pt_permanent_evaluation': { name: 'raw_message_evaluation_enabled', value: true },
    '#pt_filter_chat_message': { name: 'filter_message_enabled', value: true },
    '#pt_cache_enabled': { name: 'cache_enabled', value: 0 },
    '#pt_cache_size': { name: 'cache_size', value: 64 },
    '#pt_cache_hasher': { name: 'cache_hasher', value: 'h32ToString' },
    '#pt_inject_loader_enabled': { name: 'inject_loader_enabled', value: false },
    '#pt_invert_enabled': { name: 'invert_enabled', value: true },
    '#pt_chat_depth': { name: 'depth_limit', value: -1 },
    '#pt_compile_workers': { name: 'compile_workers', value: false },
    '#pt_sandbox': { name: 'sandbox', value: true },
};

interface EjsSettings extends Record<string, boolean | string | number> {
    enabled: boolean;
    generate_enabled: boolean;
    generate_loader_enabled: boolean;
    render_enabled: boolean;
    render_loader_enabled: boolean;
    with_context_disabled: boolean;
    debug_enabled: boolean;
    autosave_enabled: boolean;
    preload_worldinfo_enabled: boolean;
    code_blocks_enabled: boolean;
    raw_message_evaluation_enabled: boolean;
    filter_message_enabled: boolean;
    cache_enabled: number;
    cache_size: number;
    cache_hasher: string;
    inject_loader_enabled: boolean;
    invert_enabled: boolean;
    depth_limit: number;
    compile_workers: boolean;
    sandbox: boolean;
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
            settings[setting.name] = setting.value;
        } else {
        // @ts-expect-error: 2339
            extension_settings.EjsTemplate[setting.name] = getOption(id) ?? setting.value;
            settings[setting.name] = getOption(id) ?? setting.value;
        }
    }

    if(reset) {
        handleSettingLoad();
        saveSettingsDebounced();
    }
}

export function applySettings(present: Record<string, boolean> = {}) {
    for(const [id, setting] of Object.entries(DEFAULT_SETTINGS)) {
        if(present[setting.name] !== undefined) {
            settings[setting.name] = present[setting.name];
            // @ts-expect-error: 2339
            extension_settings.EjsTemplate[setting.name] = present[setting.name];
            setOption(id, present[setting.name]);
        }
    }
}

function handleSettingLoad() {
    for(const [id, setting] of Object.entries(DEFAULT_SETTINGS)) {
        // @ts-expect-error: 2339
        settings[setting.name] = extension_settings.EjsTemplate?.[setting.name] ?? settings[setting.name] ?? setting.value;
        // @ts-expect-error: 2339
        setOption(id, settings[setting.name]);
    }
}

function handleSettingSave() {
    loadSettings();
}

function getOption(id: string) : boolean | string | number {
    const defaults = DEFAULT_SETTINGS[id];
    if(typeof defaults?.value === 'boolean')
        return $(id).prop('checked');
    if(typeof defaults?.value === 'number')
        return Number($(id).val());
    return $(id).val();
}

function setOption(id: string, value: boolean | string) {
    const defaults = DEFAULT_SETTINGS[id];
    if(typeof defaults?.value === 'boolean') {
        $(id).prop('checked', value ?? defaults.value);
    } else {
        $(id).val(value ?? defaults?.value);
        $(`*[data-for="${id.slice(1)}"]`).val(value ?? defaults?.value);
    }
}

export async function init() {
    $('#extensions_settings').append(await renderExtensionTemplateAsync('third-party/ST-Prompt-Template', 'settings'));

    function changeHandler(
        id : string,
        setting: {
        name: string;
        value: boolean | string | number;
    }) {
        // @ts-expect-error: 2339
        if(!extension_settings.EjsTemplate) {
            // @ts-expect-error: 2339
            extension_settings.EjsTemplate = {};
        }

        const ref = $(`*[data-for="${id.slice(1)}"]`);
        if(ref.length && ref.val() != $(id).val()) {
            ref.off('change');
            ref.val($(id).val());
            ref.on('change', () => changeHandler(id, setting));
        }

        settings[setting.name] = getOption(id) ?? setting.value;
        // @ts-expect-error: 2339
        extension_settings.EjsTemplate[setting.name] = settings[setting.name];
        // @ts-expect-error: 2339
        console.debug(`[Prompt Template] setting ${setting.name} changed to ${extension_settings.EjsTemplate[setting.name]}`);
        ejs.cache._capacity = settings.cache_size;
        saveSettingsDebounced();
    }

    for(const [id, setting] of Object.entries(DEFAULT_SETTINGS)) {
        if(typeof setting.value === 'boolean') {
            $(id).off('click').on('click', () => changeHandler(id, setting));
        } else {
            $(id).off('change').on('change', () => changeHandler(id, setting));
            $(`*[data-for="${id.slice(1)}"]`).off('change').on('change', () => changeHandler(id, setting));
        }
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

    $('#pt_reset').click(function() {
        if (confirm('Reset all prompt template settings?')) {
            // @ts-expect-error: 2339
            globalThis.EjsTemplate.resetFeatures();
        }
    });
}

export async function exit() {
    $('#extensions_settings').remove('#prompt_template_settings');
    eventSource.removeListener(event_types.SETTINGS_LOADED, handleSettingLoad);
    eventSource.removeListener(event_types.SETTINGS_UPDATED, handleSettingSave);
}
