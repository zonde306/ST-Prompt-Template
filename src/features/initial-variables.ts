import { getEnabledWorldInfoEntries, WorldInfoEntry, WorldInfoDecorators } from "../function/worldinfo";
import { substituteParams } from "../../../../../../script.js";
import { applyRegex } from "../function/regex";
import { evalTemplate } from "../function/ejs";
import { STATE } from "../function/variables";
import { EvalTemplateOptions } from "../function/ejs";
import { yaml } from '../../../../../../lib.js';

export async function handleInitialVariables(env: Record<string, unknown>, entries?: WorldInfoEntry[], options: EvalTemplateOptions = {}) {
    if (entries == null || entries.length === 0)
        entries = await getEnabledWorldInfoEntries();

    Object.keys(STATE.initialVariables).forEach(k => delete STATE.initialVariables[k]);

    await Promise.all(entries
        .filter(e => {
            const parsed = new WorldInfoDecorators(e);
            return parsed.isEnabled && (parsed.has('@@initial_variables') || e.comment.startsWith('[InitialVariables]'));
        })
        .map(async(x) => {
            const content = await evalTemplate(applyRegex(env, substituteParams(x.content), { worldinfo: true }), env, options);
            let data = {};
            try {
                data = JSON.parse(content);
            } catch (e1) {
                try {
                    data = yaml.parse(content);
                } catch (e2) {
                    toastr.error(`Can't parse initial variables ${x.world}/${x.comment}/${x.uid}`, 'Prompt Template');
                    console.error(`[Prompt Template] Can't parse initial variables ${x.world}/${x.comment}/${x.uid}: `, x.content);
                    console.error(e1, e2);
                    return;
                }
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
