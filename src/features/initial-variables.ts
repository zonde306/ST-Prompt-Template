import { getEnabledWorldInfoEntries, WorldInfoEntry } from "../function/worldinfo";
import { substituteParams } from "../../../../../../script.js";
import { settings } from "../modules/ui";
import { applyRegex } from "../function/regex";
import { evalTemplate } from "../function/ejs";
import { STATE } from "../function/variables";
import { EvalTemplateOptions } from "../function/ejs";

export async function handleInitialVariables(env: Record<string, unknown>, entries?: WorldInfoEntry[], options: EvalTemplateOptions = {}) {
    if (entries == null || entries.length === 0)
        entries = await getEnabledWorldInfoEntries();

    Object.keys(STATE.initialVariables).forEach(k => delete STATE.initialVariables[k]);

    await Promise.all(entries
        .filter(e =>
            (e.disable === settings.invert_enabled || e.decorators.includes('@@always_enabled')) &&
            (e.comment.startsWith('[InitialVariables]') || e.decorators.includes('@@initial_variables'))
        )
        .map(async(x) => {
            const content = await evalTemplate(applyRegex(env, substituteParams(x.content), { worldinfo: true }), env, options);
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

            _.mergeWith(STATE.initialVariables, data, (_dst: unknown, src: unknown) => _.isArray(src) ? src : undefined);

            console.debug(`[Prompt Template] Set Initial Variables: \n`, data);
        }));
}
