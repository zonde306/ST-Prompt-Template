import { EvalTemplateOptions, getSyntaxErrorInfo, evalTemplate } from '../function/ejs';
import { settings } from '../modules/ui';
import { selectActivatedEntries, getEnabledWorldInfoEntries } from '../function/worldinfo';
import { substituteParams } from '../../../../../../script.js';
import { applyRegex } from '../function/regex';
import { copyText } from '../../../../../utils.js';

/**
 * Wrap an error display for evalTemplate
 * @param content prompts
 * @param env Execution Context, see prepareContext
 * @param where Error message location
 * @param opt EJS options
 * @returns Processing results
 */
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
        toastr.error(err.message, `EJS Error`, {  onclick: () => copyText(err.message).then(() => toastr.success('Copied to clipboard!') )});
    }

    return null;
}

/**
 * According to the currently enabled WI,
 * select all entries with the specified prefix,
 * perform activation calculations with keywords,
 * process the content with EJS templates,
 * and return the processing results
 * 
 * @param env Execution Context, see prepareContext
 * @param prefix WI entry prefix
 * @param keywords Content used to activate WI entry
 * @param options EJS options
 * @returns The result after all WI entries come out
 */
export async function processWorldinfoEntities(
    env: Record<string, unknown>,
    prefix : string,
    keywords : string = '',
    options : EvalTemplateOptions = {}) {
    const allEntries = await getEnabledWorldInfoEntries();
    const worldInfoData = selectActivatedEntries(
        allEntries.filter(x => x.comment.startsWith(prefix) && x.disable !== settings.invert_enabled),
        keywords,
        { vectorized: false }
    );
    
    let prompt = '';
    for(const data of worldInfoData) {
        const result = await evalTemplateHandler(
            applyRegex.call(
                env,
                substituteParams(data.content),
                {
                    generate: prefix.startsWith('[GENERATE'),
                    message: prefix.startsWith('[RENDER'),
                },
                {
                    worldinfo: true,
                    user: false,
                    assistant: false,
                    system: false,
                    reasoning: false,
                    raw: false,
                    display: true,
                }
            ),
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
