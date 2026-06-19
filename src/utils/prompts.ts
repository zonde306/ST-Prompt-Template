import { EvalTemplateOptions, EjsOptions } from "../function/ejs";
import { getTokenCountAsync } from '../../../../../tokenizers.js';
import { extension_settings } from '../../../../../extensions.js';

/**
 * Delete the HTML markup inside <% ... %>
 * @param html content
 * @returns processed content
 */
export function removeHtmlTagsInsideBlock(html: string) {
    return html.replace(/&lt;%((?:[^%]|%[^>])*)%&gt;/gi, (_match, content: string) => {
        const cleanedContent = content.replace(/<[^>]+>/g, '');
        return `&lt;%${cleanedContent}%&gt;`;
    });
}

/**
 * unescape HTML entities inside <% ... %>
 * @param html content
 * @returns processed content
 */
export function unescapeHtmlEntities(html: string): string {
    return splitNested(html, (s: string, i: number) => {
        if (s.startsWith("&lt;%", i)) {
            return { type: "open", value: "&lt;%", len: 5 };
        }
        if (s.startsWith("%&gt;", i)) {
            return { type: "close", value: "%&gt;", len: 5 };
        }
        return null;
    }).map(s => {
        if (!s.startsWith('&lt;%') || !s.endsWith('%&gt;') || s.startsWith('&lt;% __append(`'))
            return s;
        return `&lt;%${_.unescape(s.slice(4, -5))}%&gt;`;
    }).join('');
}

function escapeForTemplateLiteral(str: string) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
}

/**
 * Replace all <% and %> in the <pre> block with <% __append(`...`) %>
 * @param text content
 * @returns processed content
 */
export function escapePreContent(html: string): string {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const pres = Array.from(doc.querySelectorAll("pre"));
    for (const pre of pres) {
        const raw = pre.outerHTML;
        const escaped = escapeForTemplateLiteral(raw);
        const wrapped = `&lt;% __append(\`${escaped}\`) %&gt;`;
        pre.outerHTML = wrapped;
    }

    return doc.body.innerHTML;
}

/**
 * Delete all HTML blocks within the <% ... %> block in the <pre> block
 * @param html content
 * @returns processed content
 */
export function cleanPreContent(html: string) {
    return html.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_preMatch, preContent: string) => {
        const cleanedContent = preContent.replace(/&lt;%([\s\S]*?)%&gt;/g, (_blockMatch, content: string) => {
            return `&lt;%${content.replace(/<[^>]+>/g, '')}%&gt;`;
        });
        return `<pre>${cleanedContent}</pre>`;
    });
}

/**
 * Calculating tokens
 * @param prompts content
 * @param type classify
 */
export function updateTokens(prompts: string, type: 'send' | 'receive') {
    window.setTimeout(() => {
        getTokenCountAsync(prompts).then(count => {
            console.log(`[Prompt Template] processing ${type} result: ${count} tokens and ${prompts.length} chars`);
            switch (type) {
                case 'send':
                    // @ts-expect-error
                    extension_settings.variables.global.LAST_SEND_TOKENS = count;
                    // @ts-expect-error
                    extension_settings.variables.global.LAST_SEND_CHARS = prompts.length;
                    break;
                case 'receive':
                    // @ts-expect-error
                    extension_settings.variables.global.LAST_RECEIVE_TOKENS = count;
                    // @ts-expect-error
                    extension_settings.variables.global.LAST_RECEIVE_CHARS = prompts.length;
                    break;
            }
        });
    });
}

/**
 * Apply escapeEjsInDisabledBlocks for all reasoning-like blocks
 * @see escapeEjsInDisabledBlocks
 * @param content content
 * @param opts EJS Options
 * @returns processed content
 */
export function escapeReasoningBlocks(content: string, opts: EvalTemplateOptions = {}): string {
    return wrapEscapeBlocks(content, [opts.disableMarkup || 'escape-ejs', 'thinking', 'think', 'reasoning'], opts.options);
}

/**
 * Convert specific XML blocks into the format `<% ​​__append('content') %>`.
 * @param content 
 * @param blocks 
 * @param opts 
 * @returns 
 */
export function wrapEscapeBlocks(content: string, blocks: string[], opts: EjsOptions = {}) {
    const od = opts.openDelimiter || '<';
    const cd = opts.closeDelimiter || '>';
    const d = opts.delimiter || '%';

    const openTags = blocks.map(t => `${od}${t}${cd}`);
    const closeTags = blocks.map(t => `${od}/${t}${cd}`);

    type Frame = { tag: string; start: number };

    const stack: Frame[] = [];
    const ranges: { start: number; end: number }[] = [];

    let i = 0;

    while (i < content.length) {
        let matched = false;

        // open tag
        for (const tag of openTags) {
            if (content.startsWith(tag, i)) {
                stack.push({ tag, start: i });
                i += tag.length;
                matched = true;
                break;
            }
        }

        if (matched) continue;

        // close tag
        for (const tag of closeTags) {
            if (content.startsWith(tag, i)) {
                if (stack.length > 0) {
                    const frame = stack.pop()!;
                    const closeLen = tag.length;
                    if (stack.length === 0) {
                        // only outermost block becomes a range
                        ranges.push({
                            start: frame.start,
                            end: i + closeLen
                        });
                    }
                }

                i += tag.length;
                matched = true;
                break;
            }
        }

        if (matched) continue;

        i++;
    }

    // fallback: if unclosed, ignore
    if (ranges.length === 0) return content;

    // build result with replacements
    let result = '';
    let last = 0;

    for (const r of ranges) {
        const raw = content.slice(r.start, r.end);
        result += content.slice(last, r.start);
        result += `${od}${d} __append(\`${escapeForTemplateLiteral(raw)}\`) ${d}${cd}`;
        last = r.end;
    }

    result += content.slice(last);
    return result;
}

/**
 * Split a string based on inclusive and exclusive intervals.
 * @param input input string
 * @param matchToken function to match tokens
 * @returns array of strings
 */
function splitNested(
    input: string, 
    matchToken: (input: string, index: number) => { type: 'open' | 'close', value: string, len: number } | null
) {
    const result: string[] = [];
    const stack: string[] = [];

    let buffer = "";
    let i = 0;

    while (i < input.length) {
        const match = matchToken(input, i);

        if (!match) {
            buffer += input[i];
            i++;
            continue;
        }

        const { type, value, len } = match;

        if (type === "open") {
            if (stack.length === 0) {
                if (buffer.length > 0) {
                    result.push(buffer);
                    buffer = "";
                }
            }
            buffer += value;
            stack.push(value);
        } else if (type === "close") {
            buffer += value;
            if (stack.length > 0) {
                stack.pop();
            }
            if (stack.length === 0) {
                result.push(buffer);
                buffer = "";
            }
        }

        i += len;
    }

    if (buffer.length > 0) {
        result.push(buffer);
    }

    return result;
}
