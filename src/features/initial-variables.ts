import { getEnabledWorldInfoEntries, WorldInfoEntry } from "../function/worldinfo";
import { chat, substituteParams } from "../../../../../../script.js";
import { Message } from "../modules/defines";
import { settings } from "../modules/ui";
import { applyRegex } from "../function/regex";
import { evalTemplate } from "../function/ejs";

export async function handleInitialVariables(env: Record<string, unknown>, entries?: WorldInfoEntry[]) {
    if (chat[0] == null)
        return;

    if (entries == null || entries.length === 0)
        entries = await getEnabledWorldInfoEntries();

    const firstMessage: Message = chat[0];
    if(firstMessage == null)
        return;

    await Promise.all(entries
        .filter(e =>
            (e.disable === settings.invert_enabled || e.decorators.includes('@@always_enabled')) &&
            (e.comment.startsWith('[InitialVariables]') || e.decorators.includes('@@initial_variables'))
        )
        .map(async(x) => {
            const content = await evalTemplate(applyRegex(env, substituteParams(x.content)), env);
            let data = {};
            try {
                data = JSON.parse(content);
            } catch (e) {
                toastr.error(`Can't parse initial variables ${x.world}/${x.comment}/${x.uid}`, 'Prompt Template');
                console.error(`[Prompt Template] Can't parse initial variables ${x.world}/${x.comment}/${x.uid}: `, x.content);
                console.error(e);
                return;
            }

            if(!_.isPlainObject(data)) {
                toastr.error(`Wrong format for initial variables ${x.world}/${x.comment}/${x.uid}`, 'Prompt Template');
                console.error(`[Prompt Template] Wrong format for initial variables ${x.world}/${x.comment}/${x.uid}: `, data);
                return;
            }

            for (let i = 0; i < (firstMessage.swipes?.length ?? 1); i++) {
                if (!firstMessage.variables)
                    firstMessage.variables = {};
                if (!firstMessage.variables[i])
                    firstMessage.variables[i] = {};
                _.merge(firstMessage.variables[i], data);
            }
        }));
}
