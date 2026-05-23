import loader from '@monaco-editor/loader';
import { eventSource, event_types } from '../../../../../events.js';
import { callGenericPopup, POPUP_TYPE } from '../../../../../popup.js';

let monaco: any = null;

const autoComplete = [
    {
        label: 'variables',
        kind: 4,
        insertText: 'variables',
        detail: 'The variables object',
        documentation: 'The variables object is a JavaScript object that contains the data that is passed to the template.',
        range: {
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1
        }
    }
];

export async function init() {
    loader.config({
        paths: {
            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs'
        },
    });

    loader.init().then(loaded => {
        monaco = loaded;

        // 1. Registered Language
        monaco.languages.register({ id: 'ejs' });

        // 2. Configure Monarch syntax highlighting (using nextEmbedded to embed native JS)
        monaco.languages.setMonarchTokensProvider('ejs', {
            tokenizer: {
                root: [
                    // When encountering a character starting with <%, enter ejsCode state and let the built-in JavaScript engine take over the highlighting.
                    [/<%[=\-_]?/, { token: 'delimiter.ejs', next: '@ejsCode', nextEmbedded: 'javascript' }],
                    // HTML text or other content
                    [/[^<]+/, 'text'],
                    [/</, 'text']
                ],
                ejsCode: [
                    // When the %> statement is encountered, exit the ejsCode state and exit the JS engine.
                    [/%>/, { token: 'delimiter.ejs', next: '@pop', nextEmbedded: '@pop' }],
                    // Handle any non-% characters in the middle to the embedded language (i.e., JS).
                    [/[^%]+/, ''],
                    // Matches a single % (if no > is specified, it is considered a JavaScript modulo operator, etc., and handled by JavaScript).
                    [/%/, '']
                ]
            }
        });

        // 3. Configure theme
        monaco.editor.defineTheme('ejsTheme', {
            base: 'vs', // Dark mode is available with 'vs-dark'
            inherit: true, // Must be enabled! This allows embedded JS code to automatically use Monaco's default JS colors.
            rules: [
                // We only need to specify the color for EJS tags; the colors of variables and strings within JS are determined by the base theme itself.
                { token: 'delimiter.ejs', foreground: '800000', fontStyle: 'bold' }
            ],
            colors: {}
        });

        // 4. Basic language configuration (bracket matching)
        monaco.languages.setLanguageConfiguration('ejs', {
            brackets: [
                ['{', '}'], ['[', ']'], ['(', ')'], ['<%', '%>']
            ],
            autoClosingPairs: [
                { open: '{', close: '}' }, { open: '[', close: ']' }, { open: '(', close: ')' }, { open: '<%', close: '%>' }
            ],
            surroundingPairs: [
                { open: '{', close: '}' }, { open: '[', close: ']' }, { open: '(', close: ')' }, { open: '<%', close: '%>' }
            ]
        });

        // 5. Configure auto-completion rules
        monaco.languages.registerCompletionItemProvider('ejs', {
            // Characters that trigger completion
            triggerCharacters: ['.', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],

            provideCompletionItems: (model: any, position: any) => {
                // Get all text before the current cursor position
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });

                // Find the most recent <% and %>
                const lastOpen = textUntilPosition.lastIndexOf('<%');
                const lastClose = textUntilPosition.lastIndexOf('%>');

                // If the most recently closed statement is <% (meaning there is no %> closing statement after <%), it indicates that the current cursor is inside an EJS statement block.
                if (lastOpen > lastClose) {
                    const word = model.getWordUntilPosition(position);
                    const range = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn
                    };

                    // Located within a statement block, returns JavaScript completion items.
                    return {
                        suggestions: getJsSuggestions(range, monaco)
                    };
                }

                // JS auto-completion is not provided when the cursor is not within an EJS block (such as within regular HTML).
                return { suggestions: [] };
            }
        });

        eventSource.on(event_types.APP_READY, () => {
            $('#world_popup_entries_list').on('click', '.fa-circle-chevron-down', reloadWorldInfoPage);
        });

        console.log(`monaco-editor loaded. `, loaded);
    }).catch(e => console.error(`monaco-editor load failed. `, e));
}

export async function exit() {
}

/**
 * Helper functions: Provide keyword and common API completion within JS code blocks.
 */
function getJsSuggestions(range: any, monaco: any) {
    // Common JavaScript Keywords
    const keywords = [
        'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
        'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
        'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new',
        'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
        'void', 'while', 'with', 'yield', 'await', 'async', 'true', 'false', 'null', 'undefined'
    ];

    // Common global objects
    const globals = ['Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'console', 'window', 'document'];

    const suggestions: any[] = [];

    keywords.forEach(kw => {
        suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range: range
        });
    });

    globals.forEach(g => {
        suggestions.push({
            label: g,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: g,
            range: range
        });
    });

    suggestions.push(...autoComplete);

    return suggestions;
}

function reloadWorldInfoPage(e: JQuery.ClickEvent) {
    window.setTimeout(() => {
        const button = $(e.target)?.parent()?.parent()?.parent()?.find('.editor_maximize');
        if (button?.length) {
            const cloned = button.clone();
            cloned.on('click', (e: JQuery.ClickEvent) => {
                const textarea = $(e.target).attr('data-for');
                if (textarea?.startsWith('world_entry_content_')) {
                    showEditor(textarea);
                }
            });
            cloned.css('color', 'var(--SmartThemeQuoteColor)');
            cloned.removeClass('editor_maximize');
            button.after(cloned);
        }
    }, 1000);
}

async function showEditor(ref: string) {
    let editor: any = null;
    await callGenericPopup(
        '<div id="editor-container" style="width: 100%; height: 100%; text-align: left;"></div>',
        POPUP_TYPE.TEXT,
        '',
        {
            wide: true,
            large: true,
            leftAlign: true,
            okButton: 'Save',
            onOpen: () => {
                const container = document.getElementById('editor-container') as HTMLElement;
                editor = monaco.editor.create(container, {
                    value: $(`#${ref}`).val() as string ?? '',
                    language: 'ejs',
                    theme: 'ejsTheme',
                    automaticLayout: true,
                });
                /*
                editor.onDidChangeModelContent(() => {
                    $(`#${ref}`).val(editor.getValue());
                });
                */
            },
            onClose: () => {
                if (editor) {
                    $(`#${ref}`).val(editor.getValue());
                    editor.dispose();
                }
            }
        }
    );
}
