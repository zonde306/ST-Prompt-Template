import { substituteParams, chat, systemUserName, converter, name2, name1, getCharacterCardFields, main_api, parseMesExamples, online_status, nai_settings } from "../../../../../../script.js";
import { COMMENT_NAME_DEFAULT } from "../../../../../slash-commands.js";
import { power_user, fixMarkdown } from "../../../../../power-user.js";
import { regex_placement, getRegexedString } from "../../../../regex/engine.js";
import { escapeHtml, escapeRegex } from "../../../../../utils.js";
import { encodeStyleTags, decodeStyleTags } from "../../../../../chats.js";
import { formatInstructModeExamples } from "../../../../../instruct-mode.js";
import { getChatCompletionModel } from "../../../../../openai.js";
import { evaluateMacros } from "../../../../../macros.js";
import DOMPurify from "dompurify";

// @ts-expect-error: 7034
import { selected_group, groups } from "../../../../../group-chats.js";

export function _messageFormattingBefore(
    msg: string,
    ch_name: string,
    isSystem: boolean,
    isUser: boolean,
    messageId: number,
    isReasoning: boolean = false,
) {
    if (!msg) {
        return '';
    }

    if (Number(messageId) === 0 && !isSystem && !isUser && !isReasoning) {
        const mesBeforeReplace = msg;
        const chatMessage = chat[messageId];
        msg = substituteParams(msg, undefined, ch_name);
        if (chatMessage && chatMessage.mes === mesBeforeReplace && chatMessage.extra?.display_text !== mesBeforeReplace) {
            chatMessage.mes = msg;
        }
    }

    // Force isSystem = false on comment messages so they get formatted properly
    if (ch_name === COMMENT_NAME_DEFAULT && isSystem && !isUser) {
        isSystem = false;
    }

    // Let hidden messages have markdown
    if (isSystem && ch_name !== systemUserName) {
        isSystem = false;
    }

    // Prompt bias replacement should be applied on the raw message
    const replacedPromptBias = power_user.user_prompt_bias && substituteParams(power_user.user_prompt_bias);
    if (!power_user.show_user_prompt_bias && ch_name && !isUser && !isSystem && replacedPromptBias && msg.startsWith(replacedPromptBias)) {
        msg = msg.slice(replacedPromptBias.length);
    }

    if (!isSystem) {
        function getRegexPlacement() {
            try {
                if (isReasoning) {
                    return regex_placement.REASONING;
                }
                if (isUser) {
                    return regex_placement.USER_INPUT;
                } else if (chat[messageId]?.extra?.type === 'narrator') {
                    return regex_placement.SLASH_COMMAND;
                } else {
                    return regex_placement.AI_OUTPUT;
                }
            } catch {
                return regex_placement.AI_OUTPUT;
            }
        }

        const regexPlacement = getRegexPlacement();
        const usableMessages = chat.map((x, index) => ({ message: x, index: index })).filter(x => !x.message.is_system);
        const indexOf = usableMessages.findIndex(x => x.index === Number(messageId));
        const depth = messageId >= 0 && indexOf !== -1 ? (usableMessages.length - indexOf - 1) : undefined;

        // Always override the character name
        msg = getRegexedString(msg, regexPlacement, {
            characterOverride: ch_name,
            isMarkdown: true,
            depth: depth,
        });
    }

    if (power_user.auto_fix_generated_markdown) {
        msg = fixMarkdown(msg, true);
    }

    return msg;
}

export function _messageFormattingAfter(
    msg: string,
    ch_name: string,
    isSystem: boolean,
    isUser: boolean,
    sanitizerOverrides = {},
) {
    if (!msg) {
        return '';
    }

    if (!isSystem && power_user.encode_tags) {
        msg = msg.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    }

    // Make sure reasoning strings are always shown, even if they include "<" or ">"
    [power_user.reasoning.prefix, power_user.reasoning.suffix].forEach((reasoningString) => {
        if (!reasoningString || !reasoningString.trim().length) {
            return;
        }
        // Only replace the first occurrence of the reasoning string
        if (msg.includes(reasoningString)) {
            msg = msg.replace(reasoningString, escapeHtml(reasoningString));
        }
    });

    if (!isSystem) {
        // Save double quotes in tags as a special character to prevent them from being encoded
        if (!power_user.encode_tags) {
            msg = msg.replace(/<([^>]+)>/g, function (_, contents) {
                return '<' + contents.replace(/"/g, '\ufffe') + '>';
            });
        }

        msg = msg.replace(
            /<style>[\s\S]*?<\/style>|```[\s\S]*?```|~~~[\s\S]*?~~~|``[\s\S]*?``|`[\s\S]*?`|(".*?")|(\u201C.*?\u201D)|(\u00AB.*?\u00BB)|(\u300C.*?\u300D)|(\u300E.*?\u300F)|(\uFF02.*?\uFF02)/gim,
            function (match, p1, p2, p3, p4, p5, p6) {
                if (p1) {
                    // English double quotes
                    return `<q>"${p1.slice(1, -1)}"</q>`;
                } else if (p2) {
                    // Curly double quotes “ ”
                    return `<q>“${p2.slice(1, -1)}”</q>`;
                } else if (p3) {
                    // Guillemets « »
                    return `<q>«${p3.slice(1, -1)}»</q>`;
                } else if (p4) {
                    // Corner brackets 「 」
                    return `<q>「${p4.slice(1, -1)}」</q>`;
                } else if (p5) {
                    // White corner brackets 『 』
                    return `<q>『${p5.slice(1, -1)}』</q>`;
                } else if (p6) {
                    // Fullwidth quotes ＂ ＂
                    return `<q>＂${p6.slice(1, -1)}＂</q>`;
                } else {
                    // Return the original match if no quotes are found
                    return match;
                }
            },
        );

        // Restore double quotes in tags
        if (!power_user.encode_tags) {
            msg = msg.replace(/\ufffe/g, '"');
        }

        msg = msg.replaceAll('\\begin{align*}', '$$');
        msg = msg.replaceAll('\\end{align*}', '$$');
        msg = converter.makeHtml(msg);

        msg = msg.replace(/<code(.*)>[\s\S]*?<\/code>/g, function (match) {
            // Firefox creates extra newlines from <br>s in code blocks, so we replace them before converting newlines to <br>s.
            return match.replace(/\n/gm, '\u0000');
        });
        msg = msg.replace(/\u0000/g, '\n'); // Restore converted newlines
        msg = msg.trim();

        msg = msg.replace(/<code(.*)>[\s\S]*?<\/code>/g, function (match) {
            return match.replace(/&amp;/g, '&');
        });
    }

    if (!power_user.allow_name2_display && ch_name && !isUser && !isSystem) {
        msg = msg.replace(new RegExp(`(^|\n)${escapeRegex(ch_name)}:`, 'g'), '$1');
    }

    const config = {
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_TRUSTED_TYPE: false,
        MESSAGE_SANITIZE: true,
        ADD_TAGS: ['custom-style'],
        ...sanitizerOverrides,
    };
    msg = encodeStyleTags(msg);
    msg = DOMPurify.sanitize(msg, config);
    msg = decodeStyleTags(msg, { prefix: '.mes_text ' });

    return msg;
}

export function _substituteParams(
    content: string,
    _name1: string = name1,
    _name2: string = name2,
    _original?: string,
    _group?: string,
    _replaceCharacterCard: boolean = true,
    additionalMacro: Record<string, unknown> = {},
    postProcessFn: ((x: string) => string) = (x) => x
) {
    if (!content) {
        return '';
    }

    const environment: Record<string, unknown> = {};

    if (typeof _original === 'string') {
        let originalSubstituted = false;
        environment.original = () => {
            if (originalSubstituted) {
                return '';
            }

            originalSubstituted = true;
            return _original;
        };
    }

    const getGroupValue = (includeMuted: boolean) => {
        if (typeof _group === 'string') {
            return _group;
        }

        // @ts-expect-error
        if (selected_group) {
            // @ts-expect-error
            const members = groups.find(x => x.id === selected_group)?.members;
            // @ts-expect-error
            const disabledMembers = groups.find(x => x.id === selected_group)?.disabled_members ?? [];
            // @ts-expect-error
            const isMuted = x => includeMuted ? true : !disabledMembers.includes(x);

            const names = Array.isArray(members)
                // @ts-expect-error
                ? members.filter(isMuted).map(m => characters.find(c => c.avatar === m)?.name).filter(Boolean).join(', ')
                : '';
            return names;
        } else {
            return _name2 ?? name2;
        }
    };

    if (_replaceCharacterCard) {
        const fields = getCharacterCardFields();
        environment.charPrompt = fields.system || '';
        environment.charInstruction = environment.charJailbreak = fields.jailbreak || '';
        environment.description = fields.description || '';
        environment.personality = fields.personality || '';
        environment.scenario = fields.scenario || '';
        environment.persona = fields.persona || '';
        environment.mesExamples = () => {
            const isInstruct = power_user.instruct.enabled && main_api !== 'openai';
            const mesExamplesArray = parseMesExamples(fields.mesExamples, isInstruct);
            if (isInstruct) {
                const instructExamples = formatInstructModeExamples(mesExamplesArray, name1, name2);
                return instructExamples.join('');
            }
            return mesExamplesArray.join('');
        };
        environment.mesExamplesRaw = fields.mesExamples || '';
        environment.charVersion = fields.version || '';
        environment.char_version = fields.version || '';
        environment.charDepthPrompt = fields.charDepthPrompt || '';
        environment.creatorNotes = fields.creatorNotes || '';
    }

    // Must be substituted last so that they're replaced inside {{description}}
    environment.user = _name1 ?? name1;
    environment.char = _name2 ?? name2;
    environment.group = environment.charIfNotGroup = getGroupValue(true);
    environment.groupNotMuted = getGroupValue(false);
    environment.model = getGeneratingModel();

    if (additionalMacro && typeof additionalMacro === 'object') {
        Object.assign(environment, additionalMacro);
    }

    return evaluateMacros(content, environment, postProcessFn);
}

function getGeneratingModel(_msg?: string) {
    let model = '';
    switch (main_api) {
        case 'kobold':
            model = online_status;
            break;
        case 'novel':
            model = nai_settings.model_novel;
            break;
        case 'openai':
            model = getChatCompletionModel();
            break;
        case 'textgenerationwebui':
            model = online_status;
            break;
        case 'koboldhorde':
            // model = kobold_horde_model;
            break;
    }
    return model;
}
