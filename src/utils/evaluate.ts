import { EvalTemplateOptions, getSyntaxErrorInfo, evalTemplate } from '../function/ejs';
import { settings } from '../modules/ui';
import { selectActivatedEntries, getEnabledWorldInfoEntries } from '../function/worldinfo';
import { substituteParams } from '../../../../../../script.js';

// error handling for evalTemplate
export async function evalTemplateHandler(content: string,
    env: Record<string, unknown>,
    where: string = '',
    opt: EvalTemplateOptions = {}):
    Promise<string | null> {
    try {
        return await evalTemplate(content, env, {
            ...opt,
            logging: false,
            options: {
                strict: settings.with_context_disabled ?? false,
                debug: settings.debug_enabled ?? false,
                ...(opt.options || {}),
            },
        });
    } catch (err) {
        if(settings.debug_enabled) {
            const contentWithLines = content.split('\n').map((line, idx) => `${idx}: ${line}`).join('\n');
            console.debug(`[Prompt Template] handling ${where} errors:\n${contentWithLines}`);
        }

        if (err instanceof SyntaxError)
            err.message += getSyntaxErrorInfo(content);

        console.error(err);

        // @ts-expect-error
        toastr.error(err.message, `EJS Error`, {  onclick: () => navigator.clipboard.writeText(err.message).then(() => toastr.success('Copied to clipboard!') )});
    }

    return null;
}

// Process world info based on prefix
export async function processWorldinfoEntities(
    env: Record<string, unknown>,
    prefix : string,
    keywords : string = '',
    options : EvalTemplateOptions = {}) {
    const worldInfoData = selectActivatedEntries((await getEnabledWorldInfoEntries()).filter(x => x.comment.startsWith(prefix)), keywords, { withConstant: true, withDisabled: true, onlyDisabled: true });
    let prompt = '';
    for(const data of worldInfoData) {
        const result = await evalTemplateHandler(
            substituteParams(data.content),
            _.merge(env, { world_info: data }),
            `worldinfo ${data.world}.${data.comment}`,
            {
                options: {
                    filename: `worldinfo/${data.world}/${data.uid}-${data.comment}`,
                    cache: settings.cache_enabled === 1 || settings.cache_enabled === 2, // enable for all or worldinfo
                    ...(options.options ?? {}),
                },
                ...(options ?? {}),
            },
        );
        if(result != null)
            prompt += result;
    }

    return prompt;
}
