import { SlashCommand } from '../../../../../slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument, SlashCommandNamedArgument } from '../../../../../slash-commands/SlashCommandArgument.js';
import { SlashCommandParser } from '../../../../../slash-commands/SlashCommandParser.js';
import { evalTemplate, prepareContext, getSyntaxErrorInfo } from '../function/ejs';
import { STATE, checkAndSave } from '../function/variables';
import { settings } from './ui';
import { handlePreloadWorldInfo } from './handler';
import { getCurrentChatId } from '../../../../../../script.js';

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'ejs',
    callback: async (args, value) => {
        STATE.isDryRun = false;
        // @ts-expect-error: TS2322
        const ctx = JSON.parse(args.ctx || '{}');
        if (args.block)
            value = `<%= ${value} %>`;
        const env = await prepareContext(-1, {
            runType: 'command',
            runID: -1,
            isDryRun: false,
            ...ctx,
        });

        if(settings.debug_enabled)
            console.debug(`execute template code: ${value}`);

        try {
            // @ts-expect-error: TS2322
            return await evalTemplate(value, env, { logging: false });
        } catch (err) {
            if (err instanceof SyntaxError) {
                // @ts-expect-error: TS2322
                err.message += getSyntaxErrorInfo(value);
            }
            console.error(err);
            throw err;
        } finally {
            await checkAndSave();
        }
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'ctx',
            description: 'Execute context, eg. {a : 1, b: 2}',
            typeList: [ARGUMENT_TYPE.DICTIONARY],
            isRequired: false,
        }),
        SlashCommandNamedArgument.fromProps({
            name: 'block',
            description: 'Treat as a whole code block, eg. <%= code %>',
            typeList: [ARGUMENT_TYPE.DICTIONARY],
            isRequired: false,
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'code',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: 'Execute template code',
    returns: 'string',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'ejs-refresh',
    // @ts-expect-error: 2322
    callback: async (args, value) => {
        await handlePreloadWorldInfo(getCurrentChatId(), true);
        
        // fix warns
        return '';
    },
    helpString: 'Preload world info',
}));

export async function init() {
}

export async function exit() {
}
