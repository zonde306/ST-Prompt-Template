import { EvalTemplateOptions, getSyntaxErrorInfo, evalTemplate } from '../function/ejs';
import { settings } from '../modules/ui';
import { selectActivatedEntries, getEnabledWorldInfoEntries, WorldInfoEntry, parseDecorators } from '../function/worldinfo';
import { chat, messageFormatting, substituteParams } from '../../../../../../script.js';
import { applyRegex } from '../function/regex';
import { copyText } from '../../../../../utils.js';
import { Message } from '../modules/defines';
import { renderInFrame } from './iframe';
import { getRegexedString, regex_placement } from '../../../../regex/engine.js';

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
        if (settings.debug_enabled) {
            const contentWithLines = content.split('\n').map((line, idx) => `${idx}: ${line}`).join('\n');
            console.debug(`[Prompt Template] handling ${where} errors:\n${contentWithLines}`);
        }

        if (err instanceof SyntaxError)
            err.message += getSyntaxErrorInfo(content);

        console.error(err);

        // @ts-expect-error
        toastr.error(err.message, `EJS Error`, {
            onclick: () =>
                // @ts-expect-error: 
                copyText(`Error: ${err.message}\n\nPrompt:\n${content}\n\nSourcecode:\n${err.src}`)
                .then(() => toastr.success('Copied to clipboard!'))
        });
    }

    return null;
}

/**
 * The function for specifying EJS processing options
 * @param comment WI entries title
 * @param decorator WI entries decorator
 * @param msgId message index
 * @param entries WorldInfo entries list
 * @param content Content for activation
 * @param preload Whether to preload
 * @param buffer Buffer for processing
 */
interface EvaluateWorldEntitiesOptions {
    comment?: string;
    decorator?: string;
    msgId?: number;
    entries?: WorldInfoEntry[];
    content?: string | null;
    preload?: boolean;
    buffer?: string;
}

/**
 * According to the currently enabled WI,
 * select all entries with the specified prefix,
 * perform activation calculations with keywords,
 * process the content with EJS templates,
 * and return the processing results
 * 
 * @param env Execution Context, see prepareContext
 * @param options EJS options
 * @returns The result after all WI entries come out
 */
export async function evaluateWIEntities(
    env: Record<string, unknown>,
    options: EvalTemplateOptions & EvaluateWorldEntitiesOptions = {}) {
    const allEntries = options.entries ?? await getEnabledWorldInfoEntries();
    const worldInfoData = selectActivatedEntries(
        allEntries.filter(x =>
            (
                x.disable === settings.invert_enabled ||
                x.decorators?.includes('@@always_enabled')
            ) && (
                x.comment.startsWith(options.comment ?? x.comment + ' ') ||
                x.decorators?.includes(options.decorator ?? ' ')
            ) && (
                options.preload ||
                !x.decorators?.includes('@@only_preload')
            )
        ),
        options.content ?? '',
        { vectorized: false }
    );

    let prompt = '';

    for (const data of worldInfoData) {
        let result = await evalTemplateHandler(
            applyRegex(
                env,
                substituteParams(data.content),
                {
                    generate: options.comment?.startsWith('[GENERATE') || options.decorator?.includes('@@generate') || false,
                    message: options.comment?.startsWith('[RENDER') || options.decorator?.includes('@@render') || false,
                    worldinfo: true,
                    before: false,
                    html: true,
                }
            ),
            _.merge(env, {
                world_info: data,
                generateBuffer: options.buffer ?? '',
            }),
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
        if (result != null) {
            if (options.msgId != null && result.trim()) {
                if(data.decorators?.includes('@@message_formatting')) {
                    const message: Message = chat[options.msgId];
                    result = messageFormatting(result, message.name ?? '', !!message.is_system, !!message.is_user, options.msgId);
                }
                const iframe = data.decorators?.find(x => x.startsWith('@@iframe'));
                if(iframe) {
                    result = renderInFrame(result, iframe.substring(9), {
                        id: `mes-${options.msgId}-${data.world}-${data.uid}`,
                        'data-worldinfo': data.world,
                        'data-comment': data.comment,
                        'data-uid': data.uid.toString(),
                        'loading': 'lazy',
                        'style': 'width: 100%; height: auto; border: none;',
                    });
                }
            }
            prompt += result;
        }
    }

    if (settings.debug_enabled)
        console.debug(`[Prompt Template] ${options.comment}/${options.decorator} worldinfo templates applied.\n`, prompt, '\n', worldInfoData);
    else
        console.debug(`[Prompt Template] ${options.comment}/${options.decorator} worldinfo templates applied.\n`, worldInfoData);

    return prompt;
}

export async function evalTemplateWI(
    entry: WorldInfoEntry,
    env: Record<string, unknown>,
    options: EvalTemplateOptions = {}) : Promise<[string, string[], string[]]> {
    const content = entry.decorators ? entry.content : parseDecorators(entry.content)[1];
    const resultContent = await evalTemplateHandler(
        applyRegex(env, substituteParams(getRegexedString(content, regex_placement.WORLD_INFO)), { generate: true }),
        env,
        `lore book ${entry.world}/${entry.comment}/${entry.uid}`,
        {
            ...options,
            options: {
                filename: `worldinfo/${entry.world}/${entry.uid}-${entry.comment}`,
                cache: settings.cache_enabled === 1, // enable for all
                ...(options.options ?? {}),
            }
        }
    ) ?? content;
    const resultKeys = await Promise.all(entry.key.map(async(key) => {
        return await evalTemplateHandler(
            applyRegex(env, content, { generate: true }),
            env,
            `lore book ${entry.world}/${entry.comment}/${entry.uid} key ${key}`,
            options,
        ) ?? key;
    }));
    const resultSecondary = await Promise.all(entry.keysecondary.map(async(key) => {
        return await evalTemplateHandler(
            applyRegex(env, content, { generate: true }),
            env,
            `lore book ${entry.world}/${entry.comment}/${entry.uid} key ${key}`,
            options,
        ) ?? key;
    }));

    return [resultContent, resultKeys, resultSecondary];
}
