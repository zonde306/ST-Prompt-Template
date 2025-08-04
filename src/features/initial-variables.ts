import { getEnabledWorldInfoEntries, WorldInfoData } from "../function/worldinfo";
import { chat } from "../../../../../../script.js";
import { Message } from "../modules/defines";
import { settings } from "../modules/ui";

export async function handleInitialVariables(entries?: WorldInfoData[]) {
    if (chat[0] == null)
        return;

    if (entries == null || entries.length === 0)
        entries = await getEnabledWorldInfoEntries();

    const firstMessage: Message = chat[0];

    entries
        .filter(e =>
            e.disable === settings.invert_enabled &&
            (e.comment.startsWith('[InitialVariables]') || e.decorators.includes('@@initial_variables'))
        )
        .forEach(x => {
            let data = {};
            try {
                data = JSON.parse(x.content);
            } catch (e) {
                toastr.error(`Can't parse initial variables ${x.world}/${x.comment}/${x.uid}`, 'Prompt Template');
                console.error(`[Prompt Template] Can't parse initial variables ${x.world}/${x.comment}/${x.uid}: `, x.content);
                console.error(e);
                return;
            }

            for (let i = 0; i < firstMessage.swipes.length; i++) {
                if (!firstMessage.variables)
                    firstMessage.variables = {};
                if (!firstMessage.variables[i])
                    firstMessage.variables[i] = {};
                _.merge(firstMessage.variables[i], data);
            }
        });
}
