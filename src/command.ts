import { SlashCommand } from '../../../../slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument, SlashCommandNamedArgument } from '../../../../slash-commands/SlashCommandArgument.js';
import { SlashCommandParser } from '../../../../slash-commands/SlashCommandParser.js';
import { evalTemplate, prepareContext } from './function/ejs';
import { STATE } from './function/variables';

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'ejs',
    callback: async (args, value) => {
        STATE.isDryRun = false;
        const ctx = args.ctx || {};
        const env = await prepareContext(65535, { runType: 'command', runID: -1, ...ctx });
        console.debug(`execute template code: ${value}`);
        // @ts-expect-error: TS2322
        return await evalTemplate(value, env);
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'ctx',
            description: 'context',
            typeList: [ARGUMENT_TYPE.DICTIONARY],
            isRequired: false,
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'value',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ],
    helpString: 'Execute template code',
}));

export async function init() {
}

export async function exit() {
}
