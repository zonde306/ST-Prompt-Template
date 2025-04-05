import { extension_settings } from '../../../../extensions.js';
import { eventSource, event_types } from '../../../../../script.js';

const SETTINGS : Record<string, { name: string, value: boolean }> = {
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
};

export function loadSettings() {
    // @ts-expect-error: 2339
    if(!extension_settings.EjsTemplate) {
        // @ts-expect-error: 2339
        extension_settings.EjsTemplate = {};
    }

    for(const [id, setting] of Object.entries(SETTINGS)) {
        // @ts-expect-error: 2339
        extension_settings.EjsTemplate[setting.name] = $(id).prop('checked') ?? setting.value;
    }
}

function handleSettingLoad() {
    for(const [id, setting] of Object.entries(SETTINGS)) {
        // @ts-expect-error: 2339
        $(id).prop('checked', extension_settings.EjsTemplate?.[setting.name] ?? setting.value);
    }
}

function handleSettingSave() {
    loadSettings();
}

export async function init() {
    // @ts-expect-error: 2339
    if(!extension_settings.EjsTemplate) {
        // @ts-expect-error: 2339
        extension_settings.EjsTemplate = {};
    }

    $('#extensions_settings').append(`
        <div id="prompt_template_settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b data-i18n="NoAss">Prompt template settings</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                
                <div class="inline-drawer-content">
                    <label class="flex-container">
                        <input type="checkbox" id="pt_enabled"><span data-i18n="[PT] Enable">Enable Prompt template</span>
                    </label>
                    
                    <label class="flex-container">
                        <input type="checkbox" id="pt_generate_enabled"><span data-i18n="[PT] Enable Generate-time evaluation">Generate-time evaluation</span>
                    </label>
                    
                    <label class="flex-container">
                        <input type="checkbox" id="pt_render_enabled"><span data-i18n="[PT] Enable Render-time evaluation">Render-time evaluation</span>
                    </label>
                    
                    <label class="flex-container">
                        <input type="checkbox" id="pt_generate_before_enabled"><span data-i18n="[PT] Enable [GENERATE:BEFORE] evaluation">[GENERATE:BEFORE] evaluation</span>
                    </label>
                    
                    <label class="flex-container">
                        <input type="checkbox" id="pt_generate_after_enabled"><span data-i18n="[PT] Enable [GENERATE:AFTER] evaluation">[GENERATE:AFTER] evaluation</span>
                    </label>
                    
                    <label class="flex-container">
                        <input type="checkbox" id="pt_render_before_enabled"><span data-i18n="[PT] Enable [RENDER:BEFORE] evaluation">[RENDER:BEFORE] evaluation</span>
                    </label>
                    
                    <label class="flex-container">
                        <input type="checkbox" id="pt_render_after_enabled"><span data-i18n="[PT] Enable [RENDER:AFTER] evaluation">[RENDER:AFTER] evaluation</span>
                    </label>
                    
                    <hr>
                    
                    <label class="flex-container">
                        <input type="checkbox" id="pt_autosave_enabled"><span data-i18n="[PT] Enable Autosave">Save variables after updating</span>
                    </label>
                    
                    
                    <label class="flex-container">
                        <input type="checkbox" id="pt_preload_worldinfo"><span data-i18n="[PT] Enable Preload">Preload world info</span>
                    </label>
                    
                    <hr>
                    
                    <label class="flex-container">
                        <input type="checkbox" id="pt_strict_enabled"><span data-i18n="[PT] Enable strict mode">Use strict mode</span>
                    </label>
                    
                    <label class="flex-container">
                        <input type="checkbox" id="pt_debug_enabled"><span data-i18n="[PT] Enable debug logging">Enable debug logging</span>
                    </label>
                </div>
            </div>
        </div>
    `);

    for(const [id, setting] of Object.entries(SETTINGS)) {
        $(id).off('click').on('click', () => {
            // @ts-expect-error: 2339
            extension_settings.EjsTemplate[setting.name] = $(id).prop('checked') ?? setting.value;
            // @ts-expect-error: 2339
            console.debug(`[Prompt Template] setting ${setting.name} changed to ${extension_settings.EjsTemplate[setting.name]}`);
        });
    }
    
    eventSource.on(event_types.SETTINGS_LOADED, handleSettingLoad);
    eventSource.on(event_types.SETTINGS_UPDATED, handleSettingSave);
}

export async function exit() {
    $('#extensions_settings').remove('#prompt_template_settings');
    eventSource.removeListener(event_types.SETTINGS_LOADED, handleSettingLoad);
    eventSource.removeListener(event_types.SETTINGS_UPDATED, handleSettingSave);
}
