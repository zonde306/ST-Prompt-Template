import { EvalTemplateOptions, EjsOptions } from "../function/ejs";
import { getTokenCountAsync } from '../../../../../tokenizers.js';
import { extension_settings } from '../../../../../extensions.js';

// Delete the HTML markup inside <% ... %>
export function removeHtmlTagsInsideBlock(text: string) {
    return text.replace(/&lt;%((?:[^%]|%[^>])*)%&gt;/g, (_match, content : string) => {
        const cleanedContent = content.replace(/<[^>]+>/g, '');
        return `&lt;%${cleanedContent}%&gt;`;
    });
}

// Avoid evaluating the <pre> block by replacing its contents
export function escapePreContent(html: string) {
    return html.replace(/(<pre\b[^>]*>)([\s\S]*?)(<\/pre>)/gi, (_m, p1, p2, p3) => {
        return p1 + p2.replace(/&lt;/g, '&lt;').replace(/&gt;/g, '#gt#') + p3;
    })
}

// Revert changes made by escapePreContent
export function unescapePreContent(html: string | null) : string | null {
    return html?.replace(/(<pre\b[^>]*>)([\s\S]*?)(<\/pre>)/gi, (_m, p1, p2, p3) => {
        return p1 + p2.replace(/#lt#/g, '&lt;').replace(/#gt#/g, '&gt;') + p3;
    }) ?? null;
}

// Remove HTML tags within <% ... %>, only within <pre> blocks
export function cleanPreContent(html : string) {
    return html.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_preMatch, preContent : string) => {
        const cleanedContent = preContent.replace(/&lt;%([\s\S]*?)%&gt;/g, (_blockMatch, content : string) => {
            return `&lt;%${content.replace(/<[^>]+>/g, '')}%&gt;`;
        });
        return `<pre>${cleanedContent}</pre>`;
    });
}

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

// Replace <% ... %> in HTML tags with <%% ... %%>, only for the specified HTML block
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

export function escapeReasoningBlocks(content : string, opts : EvalTemplateOptions = {}) : string {
    content = escapeEjsInDisabledBlocks(content, opts.options || {}, opts.disableMarkup || 'escape-ejs');
    content = escapeEjsInDisabledBlocks(content, opts.options || {}, 'thinking');
    content = escapeEjsInDisabledBlocks(content, opts.options || {}, 'think');
    content = escapeEjsInDisabledBlocks(content, opts.options || {}, 'reasoning');
    return content;
}
