import { EvalTemplateOptions, EjsOptions } from "../function/ejs";
import { getTokenCountAsync } from '../../../../../tokenizers.js';
import { extension_settings } from '../../../../../extensions.js';

/**
 * Delete the HTML markup inside <% ... %>
 * @param html content
 * @returns processed content
 */
export function removeHtmlTagsInsideBlock(html: string) {
    return html.replace(/&lt;%((?:[^%]|%[^>])*)%&gt;/gi, (_match, content : string) => {
        const cleanedContent = content.replace(/<[^>]+>/g, '');
        return `&lt;%${cleanedContent}%&gt;`;
    });
}

/**
 * unescape HTML entities inside <% ... %>
 * @param html content
 * @returns processed content
 */
export function unescapeHtmlEntities(html: string) {
    return html.replace(/&lt;%([\s\S]*?)%&gt;/gi, (_match, content : string) => {
        return `&lt;%${_.unescape(content)}%&gt;`;
    });
}

/**
 * Replace all <% and %> in the <pre> block with <%% and %%>
 * @param text content
 * @returns processed content
 */
export function escapePreContent(html: string) {
    return html.replace(/(<pre\b[^>]*>)([\s\S]*?)(<\/pre>)/gi, (_m, p1, p2, p3) => {
        return p1 + p2.replace(/&lt;/g, '&lt;').replace(/&gt;/g, '#gt#') + p3;
    })
}

/**
 * Revert changes made by escapePreContent
 * @param html content
 * @returns processed content
 */
export function unescapePreContent(html: string | null) : string | null {
    return html?.replace(/(<pre\b[^>]*>)([\s\S]*?)(<\/pre>)/gi, (_m, p1, p2, p3) => {
        return p1 + p2.replace(/#lt#/g, '&lt;').replace(/#gt#/g, '&gt;') + p3;
    }) ?? null;
}

/**
 * Delete all HTML blocks within the <% ... %> block in the <pre> block
 * @param html content
 * @returns processed content
 */
export function cleanPreContent(html : string) {
    return html.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_preMatch, preContent : string) => {
        const cleanedContent = preContent.replace(/&lt;%([\s\S]*?)%&gt;/g, (_blockMatch, content : string) => {
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
 * Replace <% ... %> in HTML tags with <%% ... %%>, only for the specified HTML block
 * @param str content
 * @param options EJS Options
 * @param markup HTML block
 * @returns processed content
 */
export function escapeEjsInDisabledBlocks(str : string, options : EjsOptions = {}, markup: string = 'escape-ejs') {
    const openDelimiter = options.openDelimiter || '<';
    const closeDelimiter = options.closeDelimiter || '>';
    const delimiter = options.delimiter || '%';
    const sepcialDelimiter = openDelimiter === '<' && closeDelimiter === '>' ? '' : '#';
    return str.replaceAll(new RegExp(`${openDelimiter}${sepcialDelimiter}${markup}${closeDelimiter}([\\s\\S]*?)${openDelimiter}${sepcialDelimiter}/${markup}${closeDelimiter}`, 'gi'),
        (_match) => _match
                          .replaceAll(`${openDelimiter}${delimiter}`, `${openDelimiter}${delimiter}${delimiter}`)
                          .replaceAll(`${delimiter}${closeDelimiter}`, `${delimiter}${delimiter}${closeDelimiter}`),
    );
}

/**
 * Apply escapeEjsInDisabledBlocks for all reasoning-like blocks
 * @see escapeEjsInDisabledBlocks
 * @param content content
 * @param opts EJS Options
 * @returns processed content
 */
export function escapeReasoningBlocks(content : string, opts : EvalTemplateOptions = {}) : string {
    content = escapeEjsInDisabledBlocks(content, opts.options || {}, opts.disableMarkup || 'escape-ejs');
    content = escapeEjsInDisabledBlocks(content, opts.options || {}, 'thinking');
    content = escapeEjsInDisabledBlocks(content, opts.options || {}, 'think');
    content = escapeEjsInDisabledBlocks(content, opts.options || {}, 'reasoning');
    return content;
}
