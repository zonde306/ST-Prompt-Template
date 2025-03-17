import { SlashCommand } from '../../../../slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument, SlashCommandNamedArgument } from '../../../../slash-commands/SlashCommandArgument.js';
import { SlashCommandParser } from '../../../../slash-commands/SlashCommandParser.js';
import { evalTemplate, prepareContext, getSyntaxErrorInfo } from './function/ejs';
import { STATE } from './function/variables';

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'ejs',
    callback: async (args, value) => {
        STATE.isDryRun = false;
        // @ts-expect-error: TS2322
        const ctx = JSON.parse(args.ctx || '{}');
        if (args.block)
            value = `<%= ${value} %>`;
        const env = await prepareContext(65535, { runType: 'command', runID: -1, ...ctx });
        console.debug(`execute template code: ${value}`);

        try {
            // @ts-expect-error: TS2322
            return await evalTemplate(value, env);
        } catch (err) {
            if (err instanceof SyntaxError) {
                // @ts-expect-error: TS2322
                err.message += getSyntaxErrorInfo(value);
            }
            throw err;
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

export async function init() {
}

export async function exit() {
}
