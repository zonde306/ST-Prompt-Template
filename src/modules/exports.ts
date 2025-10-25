import { evalTemplate, prepareContext, getSyntaxErrorInfo, SharedDefines } from '../function/ejs';
import { STATE } from '../function/variables';
import { applySettings, loadSettings } from './ui';
import { precacheVariables, checkAndSave } from '../function/variables';
import { handlePreloadWorldInfo } from './handler';
import { getCurrentChatId } from '../../../../../../script.js';
import { parseJSON, jsonPatch } from '../function/json-patch';

export async function init() {
    // @ts-expect-error
    globalThis.EjsTemplate = {
        evalTemplate: async(
            code : string,
            context : Record<string, unknown> = {},
            options: Record<string, unknown> = {}) => {
            STATE.isDryRun = false;
            return await evalTemplate(code, context, { logging: false, options });
        },
        prepareContext: async(
            context : Record<string, unknown> = {},
            end : number = -1) => {
            return await prepareContext(end, context);
        },
        getSyntaxErrorInfo,
        setFeatures: (features: Record<string, boolean>) => {
            applySettings(features);
        },
        allVariables: precacheVariables,
        saveVariables: checkAndSave,
        resetFeatures: () => loadSettings(true),
        get defines() {
            return SharedDefines;
        },
        refreshWorldInfo: async() => await handlePreloadWorldInfo(getCurrentChatId(), true),
        get initialVariables() {
            return STATE.initialVariables;
        },
        parseJSON,
        jsonPatch,
    };
}

export async function exit() {
    // @ts-expect-error
    delete globalThis.EjsTemplate;
}
