import loader from '@monaco-editor/loader';
import { eventSource, event_types } from '../../../../../events.js';
import { callGenericPopup, POPUP_TYPE } from '../../../../../popup.js';

let monaco : any = null;

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

        monaco.languages.register({ id: 'ejs' });
        monaco.languages.setMonarchTokensProvider('ejs', {
            tokenizer: {
                root: [
                    [/<%[=\-_]?/, { token: 'delimiter.ejs', next: '@ejsCode' }],
                    [/[^<%]+/, 'text']
                ],
                ejsCode: [
                    [/%>/, { token: 'delimiter.ejs', next: '@pop' }],
                    [/[a-zA-Z_$][\w$]*/, 'identifier'],
                    [/\d+/, 'number'],
                    [/".*?"/, 'string'],
                    [/'[^']*'/, 'string'],
                    [/[{}()\[\]]/, '@brackets'],
                    [/./, 'text']
                ]
            }
        });

        monaco.editor.defineTheme('ejsTheme', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'delimiter.ejs', foreground: '800000', fontStyle: 'bold' },
                { token: 'identifier', foreground: '0000FF' },
                { token: 'number', foreground: '098658' },
                { token: 'string', foreground: 'A31515' }
            ],
            colors: {
            }
        });

        monaco.languages.setLanguageConfiguration('ejs', {
            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')'],
                ['<%', '%>']
            ],
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '<%', close: '%>' }
            ],
            surroundingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '<%', close: '%>' }
            ]
        });

        monaco.languages.registerCompletionItemProvider('ejs', {
            provideCompletionItems: (model: any, position: any) => {
                const lineTokens = monaco.editor.tokenize(model.getLineContent(position.lineNumber), 'ejs')[0];
                let tokenAtCursor: { startIndex: number; endIndex: number; type: string } | null = null;
                for (let i = 0; i < lineTokens.length; i++) {
                    const token = lineTokens[i];
                    const startIndex = token.offset;
                    const endIndex = i + 1 < lineTokens.length ? lineTokens[i + 1].offset : model.getLineMaxColumn(position.lineNumber) - 1;
                    if (position.column - 1 >= startIndex && position.column - 1 <= endIndex) {
                        tokenAtCursor = { startIndex, endIndex, type: token.type };
                        break;
                    }
                }
                if (!tokenAtCursor || !tokenAtCursor.type.includes('delimiter.ejs') && !tokenAtCursor.type.includes('identifier')) {
                    return { suggestions: [] };
                }
                return { suggestions: autoComplete };
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

function reloadWorldInfoPage(e: JQuery.ClickEvent) {
    window.setTimeout(() => {
        const button = $(e.target)?.parent()?.parent()?.parent()?.find('.editor_maximize');
        if(button?.length) {
            const cloned = button.clone();
            cloned.on('click', (e: JQuery.ClickEvent) => {
                const textarea = $(e.target).attr('data-for');
                if(textarea?.startsWith('world_entry_content_')) {
                    showEditor(textarea);
                }
            });
            cloned.css('color', 'var(--SmartThemeQuoteColor)');
            cloned.removeClass('editor_maximize');
            button.insertAfter(cloned);
        }
    }, 1000);
}

async function showEditor(ref: string) {
    let editor: any = null;
    await callGenericPopup(
        '<div id="editor-container" style="width: 100%; height: 100%;"></div>',
        POPUP_TYPE.TEXT,
        '',
        {
            wide: true,
            large: true,
            okButton: 'Save',
            onOpen: () => {
                const container = document.getElementById('editor-container') as HTMLElement;
                editor = monaco.editor.create(container, {
                    value: $(`#${ref}`).val() as string ?? '',
                    language: 'ejs',
                    theme: 'ejsTheme',
                });
                /*
                editor.onDidChangeModelContent(() => {
                    $(`#${ref}`).val(editor.getValue());
                });
                */
            },
            onClose: () => {
                if(editor) {
                    $(`#${ref}`).val(editor.getValue());
                }
            }
        }
    );
}
