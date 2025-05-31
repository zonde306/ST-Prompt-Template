import { evalTemplate, prepareContext, getSyntaxErrorInfo } from '../function/ejs';
import { STATE } from '../function/variables';
import { applySettings, loadSettings } from './ui';
import { allVariables } from '../function/variables';

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
            end : number = 65535) => {
            return await prepareContext(end, context);
        },
        getSyntaxErrorInfo,
        setFeatures: (features: Record<string, boolean>) => {
            applySettings(features);
        },
        allVariables,
        resetFeatures: () => loadSettings(true),
    };
}

export async function exit() {
    // @ts-expect-error
    delete globalThis.EjsTemplate;
}
