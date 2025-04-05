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
    '#pt_code_blocks': { name: 'code_blocks_enabled', value: false },
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
                    <label class="flex-container" title="是否开启提示词模板扩展">
                        <input type="checkbox" id="pt_enabled">
                        <span data-i18n="[PT] Enable">Enable Prompt template</span>
                        <span class="fa-solid fa-circle-question note-link-span"></span>
                    </label>

                    <hr>
                    
                    <label class="flex-container" title="在生成时执行模板处理">
                        <input type="checkbox" id="pt_generate_enabled">
                        <span data-i18n="[PT] Enable Generate-time evaluation">Generate-time evaluation</span>
                        <span class="fa-solid fa-circle-question note-link-span"></span>
                    </label>
                    
                    <label class="flex-container" title="启用 [GENERATE:BEFORE] 功能（详见文档）">
                        <input type="checkbox" id="pt_generate_before_enabled">
                        <span data-i18n="[PT] Enable [GENERATE:BEFORE] evaluation">[GENERATE:BEFORE] evaluation</span>
                        <span class="fa-solid fa-circle-question note-link-span"></span>
                    </label>
                    
                    <label class="flex-container" title="启用 [GENERATE:AFTER] 功能（详见文档）">
                        <input type="checkbox" id="pt_generate_after_enabled">
                        <span data-i18n="[PT] Enable [GENERATE:AFTER] evaluation">[GENERATE:AFTER] evaluation</span>
                        <span class="fa-solid fa-circle-question note-link-span"></span>
                    </label>

                    <hr>
                    
                    <label class="flex-container" title="在渲染（楼层消息）执行模板处理">
                        <input type="checkbox" id="pt_render_enabled">
                        <span data-i18n="[PT] Enable Render-time evaluation">Render-time evaluation</span>
                        <span class="fa-solid fa-circle-question note-link-span"></span>
                    </label>
                    
                    <label class="flex-container" title="启用 [RENDER:BEFORE] 功能（详见文档）">
                        <input type="checkbox" id="pt_render_before_enabled">
                        <span data-i18n="[PT] Enable [RENDER:BEFORE] evaluation">[RENDER:BEFORE] evaluation</span>
                        <span class="fa-solid fa-circle-question note-link-span"></span>
                    </label>
                    
                    <label class="flex-container" title="启用 [RENDER:AFTER] 功能（详见文档）">
                        <input type="checkbox" id="pt_render_after_enabled">
                        <span data-i18n="[PT] Enable [RENDER:AFTER] evaluation">[RENDER:AFTER] evaluation</span>
                        <span class="fa-solid fa-circle-question note-link-span"></span>
                    </label>
                    
                    <label class="flex-container" title="允许在&lt;pre&gt;内执行模板处理（可能会冲突）">
                        <input type="checkbox" id="pt_code_blocks">
                        <span data-i18n="[PT] Enable code blocks">Evaluate inside a code block</span>
                        <span class="fa-solid fa-circle-question note-link-span"></span>
                    </label>
                    
                    <hr>
                    
                    <label class="flex-container" title="模板处理后，若变量发生变化，则立即保存（到服务器）">
                        <input type="checkbox" id="pt_autosave_enabled">
                        <span data-i18n="[PT] Enable Autosave">Save variables after updating</span>
                        <span class="fa-solid fa-circle-question note-link-span"></span>
                    </label>
                    
                    <label class="flex-container" title="打开角色卡时执行世界书（用于读取define）">
                        <input type="checkbox" id="pt_preload_worldinfo">
                        <span data-i18n="[PT] Enable Preload">Preload world info</span>
                        <span class="fa-solid fa-circle-question note-link-span"></span>
                    </label>
                    
                    <label class="flex-container" title="执行模板处理时使用 Javascript 严格模式">
                        <input type="checkbox" id="pt_strict_enabled">
                        <span data-i18n="[PT] Enable strict mode">Use strict mode</span>
                        <span class="fa-solid fa-circle-question note-link-span"></span>
                    </label>
                    
                    <label class="flex-container" title="发生错误时输出更详细的信息">
                        <input type="checkbox" id="pt_debug_enabled">
                        <span data-i18n="[PT] Enable debug logging">Enable debug logging</span>
                        <span class="fa-solid fa-circle-question note-link-span"></span>
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
