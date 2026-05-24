import * as monaco from 'monaco-editor';
import { eventSource, event_types } from '../../../../../events.js';
import { callGenericPopup, POPUP_TYPE } from '../../../../../popup.js';
import { settings } from './ui';

const autoComplete = [
    // ==========================================
    // VARIABLE FUNCTIONS
    // ==========================================
    {
        label: 'setvar',
        kind: 1,
        detail: 'setvar(key: string | null, value: any, options?: SetVarOption | SimpleOptions): any',
        documentation: {
            value: `**Set Variable**\n\nSets a variable. Success depends on options.results; returns undefined on failure.\n\n**Examples:**\n\`\`\`javascript\nsetvar('a', 1);\nsetvar('a', 1, 'nx');\nsetvar('a', 1, { scope: 'global', flags: 'nx' });\n\`\`\`\n\n**Options (SetVarOption):**\n- \`index\` (number): Variable index, same as /setvar index.\n- \`scope\` ('global'|'local'|'message'|'cache'|'initial'): Scope of the variable. Default 'message'.\n- \`flags\` ('nx'|'xx'|'n'|'nxs'|'xxs'): Condition for setting variable. Default 'n'.\n- \`results\` ('old'|'new'|'fullcache'): Type of returned value. Default 'new'.\n- \`withMsg\` (MessageFilter): Message filter (if setting message variable).\n- \`merge\` (boolean): Whether to use \`_.merge\`. Default false.\n- \`dryRun\` (boolean): Allow setting during preparation phase. Default false.\n- \`noCache\` (boolean): Disable cache. Default false.`
        },
        insertText: "setvar('${1:key}', ${2:value}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'setLocalVar',
        kind: 1,
        detail: 'setLocalVar(key: string | null, value: any, options?: SetVarOption | SimpleOptions): any',
        documentation: { value: 'Alias for `setvar` with options.scope pre-set to "local".' },
        insertText: "setLocalVar('${1:key}', ${2:value}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'setGlobalVar',
        kind: 1,
        detail: 'setGlobalVar(key: string | null, value: any, options?: SetVarOption | SimpleOptions): any',
        documentation: { value: 'Alias for `setvar` with options.scope pre-set to "global".' },
        insertText: "setGlobalVar('${1:key}', ${2:value}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'setMessageVar',
        kind: 1,
        detail: 'setMessageVar(key: string | null, value: any, options?: SetVarOption | SimpleOptions): any',
        documentation: { value: 'Alias for `setvar` with options.scope pre-set to "message".' },
        insertText: "setMessageVar('${1:key}', ${2:value}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'getvar',
        kind: 1,
        detail: 'getvar(key: string | null, options?: GetVarOption | SimpleOptions): any',
        documentation: {
            value: `**Read Variable**\n\nReads a variable's value. Direct reference modification should be avoided.\n\n**Examples:**\n\`\`\`javascript\ngetvar('a');\ngetvar('a', { scope: 'global', defaults: 0 });\n\`\`\`\n\n**Options (GetVarOption):**\n- \`index\` (number): Variable index, same as /getvar index.\n- \`scope\` ('global'|'local'|'message'|'cache'|'initial'): Scope to read. Default 'cache'.\n- \`defaults\` (any): Default value returned if not found.\n- \`withMsg\` (MessageFilter): Message selection filter.\n- \`noCache\` (boolean): Disable cache. Default false.\n- \`clone\` (boolean): Deep copy instead of returning a reference. Default false.`
        },
        insertText: "getvar('${1:key}'${2:, options})",
        insertTextRules: 4
    },
    {
        label: 'getLocalVar',
        kind: 1,
        detail: 'getLocalVar(key: string | null, options?: GetVarOption | SimpleOptions): any',
        documentation: { value: 'Alias for `getvar` with options.scope pre-set to "local".' },
        insertText: "getLocalVar('${1:key}'${2:, options})",
        insertTextRules: 4
    },
    {
        label: 'getGlobalVar',
        kind: 1,
        detail: 'getGlobalVar(key: string | null, options?: GetVarOption | SimpleOptions): any',
        documentation: { value: 'Alias for `getvar` with options.scope pre-set to "global".' },
        insertText: "getGlobalVar('${1:key}'${2:, options})",
        insertTextRules: 4
    },
    {
        label: 'getMessageVar',
        kind: 1,
        detail: 'getMessageVar(key: string | null, options?: GetVarOption | SimpleOptions): any',
        documentation: { value: 'Alias for `getvar` with options.scope pre-set to "message".' },
        insertText: "getMessageVar('${1:key}'${2:, options})",
        insertTextRules: 4
    },
    {
        label: 'incvar',
        kind: 1,
        detail: 'incvar(key: string, value?: number, options?: GetSetVarOption | SimpleOptions): number | undefined',
        documentation: {
            value: `**Increment Variable Value**\n\nIncrements a variable by the specified value.\n\n**Examples:**\n\`\`\`javascript\nincvar('a');\nincvar('a', 1, { defaults: 1 });\n\`\`\`\n\n**Options (GetSetVarOption):**\n- \`index\` (number): Variable index.\n- \`defaults\` (any): Default value used if variable does not exist. Default 0.\n- \`inscope\` (string): Scope to read from. Default 'cache'.\n- \`outscope\` (string): Scope to set to. Default 'message'.\n- \`flags\` (string): Update condition. Default 'n'.\n- \`results\` (string): Return value type. Default 'new'.\n- \`withMsg\` (MessageFilter): Message filter.\n- \`dryRun\` (boolean): Allow update during preparation phase.\n- \`noCache\` (boolean): Disable cache.\n- \`min\` (number): Minimum boundary.\n- \`max\` (number): Maximum boundary.`
        },
        insertText: "incvar('${1:key}', ${2:value}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'incLocalVar',
        kind: 1,
        detail: 'incLocalVar(key: string, value?: number, options?: GetSetVarOption): number | undefined',
        documentation: { value: 'Alias for `incvar` with outscope pre-set to "local".' },
        insertText: "incLocalVar('${1:key}', ${2:value}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'incGlobalVar',
        kind: 1,
        detail: 'incGlobalVar(key: string, value?: number, options?: GetSetVarOption): number | undefined',
        documentation: { value: 'Alias for `incvar` with outscope pre-set to "global".' },
        insertText: "incGlobalVar('${1:key}', ${2:value}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'incMessageVar',
        kind: 1,
        detail: 'incMessageVar(key: string, value?: number, options?: GetSetVarOption): number | undefined',
        documentation: { value: 'Alias for `incvar` with outscope pre-set to "message".' },
        insertText: "incMessageVar('${1:key}', ${2:value}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'decvar',
        kind: 1,
        detail: 'decvar(key: string, value?: number, options?: GetSetVarOption | SimpleOptions): number | undefined',
        documentation: {
            value: `**Decrement Variable Value**\n\nDecrements a variable by the specified value.\n\n**Examples:**\n\`\`\`javascript\ndecvar('a.b');\ndecvar('a.b', 1, { defaults: 1 });\n\`\`\``
        },
        insertText: "decvar('${1:key}', ${2:value}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'decLocalVar',
        kind: 1,
        detail: 'decLocalVar(key: string, value?: number, options?: GetSetVarOption): number | undefined',
        documentation: { value: 'Alias for `decvar` with outscope pre-set to "local".' },
        insertText: "decLocalVar('${1:key}', ${2:value}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'decGlobalVar',
        kind: 1,
        detail: 'decGlobalVar(key: string, value?: number, options?: GetSetVarOption): number | undefined',
        documentation: { value: 'Alias for `decvar` with outscope pre-set to "global".' },
        insertText: "decGlobalVar('${1:key}', ${2:value}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'decMessageVar',
        kind: 1,
        detail: 'decMessageVar(key: string, value?: number, options?: GetSetVarOption): number | undefined',
        documentation: { value: 'Alias for `decvar` with outscope pre-set to "message".' },
        insertText: "decMessageVar('${1:key}', ${2:value}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'delvar',
        kind: 1,
        detail: 'delvar(key: string, index?: string | number, options?: SetVarOption): any',
        documentation: {
            value: `**Delete Variable**\n\nDeletes the property/value, array element, or substring at the specified index. If index is omitted, the entire variable is deleted.`
        },
        insertText: "delvar('${1:key}'${2:, index}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'delLocalVar',
        kind: 1,
        detail: 'delLocalVar(key: string, index?: string | number, options?: SetVarOption): any',
        documentation: { value: 'Alias for `delvar` targeting local scope.' },
        insertText: "delLocalVar('${1:key}'${2:, index}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'delGlobalVar',
        kind: 1,
        detail: 'delGlobalVar(key: string, index?: string | number, options?: SetVarOption): any',
        documentation: { value: 'Alias for `delvar` targeting global scope.' },
        insertText: "delGlobalVar('${1:key}'${2:, index}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'delMessageVar',
        kind: 1,
        detail: 'delMessageVar(key: string, index?: string | number, options?: SetVarOption): any',
        documentation: { value: 'Alias for `delvar` targeting message scope.' },
        insertText: "delMessageVar('${1:key}'${2:, index}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'insvar',
        kind: 1,
        detail: 'insvar(key: string, value: any, index?: string | number, options?: SetVarOption): any',
        documentation: {
            value: `**Insert Element into Variable**\n\n- Object: Sets key to value.\n- Array/String: Inserts value at the index position.\n- If index is omitted, appends to the end.`
        },
        insertText: "insvar('${1:key}', ${2:value}${3:, index}${4:, options})",
        insertTextRules: 4
    },
    {
        label: 'insertLocalVar',
        kind: 1,
        detail: 'insertLocalVar(key: string, value: any, index?: string | number, options?: SetVarOption): any',
        documentation: { value: 'Alias for `insvar` targeting local scope.' },
        insertText: "insertLocalVar('${1:key}', ${2:value}${3:, index}${4:, options})",
        insertTextRules: 4
    },
    {
        label: 'insertGlobalVar',
        kind: 1,
        detail: 'insertGlobalVar(key: string, value: any, index?: string | number, options?: SetVarOption): any',
        documentation: { value: 'Alias for `insvar` targeting global scope.' },
        insertText: "insertGlobalVar('${1:key}', ${2:value}${3:, index}${4:, options})",
        insertTextRules: 4
    },
    {
        label: 'insertMessageVar',
        kind: 1,
        detail: 'insertMessageVar(key: string, value: any, index?: string | number, options?: SetVarOption): any',
        documentation: { value: 'Alias for `insvar` targeting message scope.' },
        insertText: "insertMessageVar('${1:key}', ${2:value}${3:, index}${4:, options})",
        insertTextRules: 4
    },
    {
        label: 'patchVariables',
        kind: 1,
        detail: 'patchVariables(key: string | null, change: object[], options?: SetVarOption): any',
        documentation: { value: 'Apply JSON Patch modifications to variables. `null` key target modifies the entire variable tree.' },
        insertText: "patchVariables('${1:key}', ${2:change}${3:, options})",
        insertTextRules: 4
    },
    {
        label: 'setVariableSchema',
        kind: 1,
        detail: 'setVariableSchema(Schema: object): void',
        documentation: { value: 'Sets a Zod schema for variable validation. Any subsequent modifications failing validation will throw an error.' },
        insertText: "setVariableSchema(${1:Schema})",
        insertTextRules: 4
    },

    // ==========================================
    // SYSTEM & INTEGRATION FUNCTIONS
    // ==========================================
    {
        label: 'execute',
        kind: 1,
        detail: 'execute(cmd: string): Promise<string>',
        documentation: { value: 'Executes a SillyTavern slash command (e.g., `/setvar`). Returns command output.' },
        insertText: "execute('${1:cmd}')",
        insertTextRules: 4
    },
    {
        label: 'getwi',
        kind: 1,
        detail: 'getwi(lorebook?: string, title: string | RegExp | number, data?: object): Promise<string>',
        documentation: { value: 'Read World Info/Lorebook entry content. If lorebook is omitted, uses current character\'s primary lorebook.' },
        insertText: "getwi('${1:lorebook}', '${2:title}'${3:, data})",
        insertTextRules: 4
    },
    {
        label: 'getWorldInfo',
        kind: 1,
        detail: 'getWorldInfo(lorebook?: string, title: string | RegExp | number, data?: object): Promise<string>',
        documentation: { value: 'Alias for `getwi` to read World Info/Lorebook entry content.' },
        insertText: "getWorldInfo('${1:lorebook}', '${2:title}'${3:, data})",
        insertTextRules: 4
    },
    {
        label: 'getchar',
        kind: 1,
        detail: 'getchar(name?: string | RegExp | number, template?: string, data?: Object): Promise<string>',
        documentation: { value: 'Read Character Card definition based on specified name and formatting template.' },
        insertText: "getchar('${1:name}'${2:, template}${3:, data})",
        insertTextRules: 4
    },
    {
        label: 'getChara',
        kind: 1,
        detail: 'getChara(name?: string | RegExp | number, template?: string, data?: Object): Promise<string>',
        documentation: { value: 'Alias for `getchar`.' },
        insertText: "getChara('${1:name}'${2:, template}${3:, data})",
        insertTextRules: 4
    },
    {
        label: 'getpreset',
        kind: 1,
        detail: 'getpreset(name: string | RegExp, data?: Object): Promise<string>',
        documentation: { value: 'Read prompt preset content.' },
        insertText: "getpreset('${1:name}'${2:, data})",
        insertTextRules: 4
    },
    {
        label: 'getPresetPrompt',
        kind: 1,
        detail: 'getPresetPrompt(name: string | RegExp, data?: Object): Promise<string>',
        documentation: { value: 'Alias for `getpreset`.' },
        insertText: "getPresetPrompt('${1:name}'${2:, data})",
        insertTextRules: 4
    },
    {
        label: 'define',
        kind: 1,
        detail: 'define(name: string, value: any, merge?: boolean): void',
        documentation: { value: 'Define global variables or functions. Useful for pre-defining custom logic in lorebooks. Within custom functions, access the engine environment using `this` (e.g., `this.variables`, `this.getvar`).' },
        insertText: "define('${1:name}', ${2:value}${3:, merge})",
        insertTextRules: 4
    },
    {
        label: 'getqr',
        kind: 1,
        detail: 'getqr(name: string | RegExp, label: string | RegExp, data?: Object): Promise<string>',
        documentation: { value: 'Read Quick Reply content. Only operates on enabled Quick Reply sets.' },
        insertText: "getqr('${1:name}', '${2:label}'${3:, data})",
        insertTextRules: 4
    },
    {
        label: 'getQuickReply',
        kind: 1,
        detail: 'getQuickReply(name: string | RegExp, label: string | RegExp, data?: Object): Promise<string>',
        documentation: { value: 'Alias for `getqr`.' },
        insertText: "getQuickReply('${1:name}', '${2:label}'${3:, data})",
        insertTextRules: 4
    },
    {
        label: 'getCharData',
        kind: 1,
        detail: 'getCharData(name?: string | RegExp | number): Promise<object | null>',
        documentation: { value: 'Retrieve unprocessed raw Character Card definition data.' },
        insertText: "getCharData('${1:name}')",
        insertTextRules: 4
    },
    {
        label: 'getWorldInfoData',
        kind: 1,
        detail: 'getWorldInfoData(name: string): Promise<WorldInfoData[]>',
        documentation: { value: 'Retrieve raw, unprocessed lorebook entries by lorebook name/UID.' },
        insertText: "getWorldInfoData('${1:name}')",
        insertTextRules: 4
    },
    {
        label: 'getQuickReplyData',
        kind: 1,
        detail: 'getQuickReplyData(name: string | RegExp): object | null',
        documentation: { value: 'Read raw, unprocessed Quick Reply set configuration.' },
        insertText: "getQuickReplyData('${1:name}')",
        insertTextRules: 4
    },
    {
        label: 'getWorldInfoActivatedData',
        kind: 1,
        detail: 'getWorldInfoActivatedData(name: string, keyword: string | string[], condition?: ActivateWorldInfoCondition): Promise<WorldInfoData[]>',
        documentation: { value: 'Find and return activated lorebook entries based on custom condition and trigger text.' },
        insertText: "getWorldInfoActivatedData('${1:name}', '${2:keyword}'${3:, condition})",
        insertTextRules: 4
    },
    {
        label: 'evalTemplate',
        kind: 1,
        detail: 'evalTemplate(content: string, data?: Object, options?: Object): Promise<string>',
        documentation: { value: 'Parse string content using the template engine. Standard EJS syntax applies.' },
        insertText: "evalTemplate('${1:content}'${2:, data})",
        insertTextRules: 4
    },
    {
        label: 'getEnabledWorldInfoEntries',
        kind: 1,
        detail: 'getEnabledWorldInfoEntries(chara?: boolean, global?: boolean, persona?: boolean, charaExtra?: boolean, onlyExisting?: boolean): Promise<WorldInfoData[]>',
        documentation: { value: 'Get all possible active and disabled lorebook entries relevant to the current session.' },
        insertText: "getEnabledWorldInfoEntries(${1:chara}, ${2:global}, ${3:persona}, ${4:charaExtra}, ${5:onlyExisting})",
        insertTextRules: 4
    },
    {
        label: 'print',
        kind: 1,
        detail: 'print(...args: string[]): void',
        documentation: { value: 'Output raw string arguments directly into output stream. Cannot be called inside EJS evaluation blocks (<%- or <%=).' },
        insertText: "print(${1:args})",
        insertTextRules: 4
    },
    {
        label: 'activewi',
        kind: 1,
        detail: 'activewi(lorebook?: string, title: string | RegExp | number, force?: boolean): Promise<WorldInfoData | null>',
        documentation: { value: 'Force activate or reference-activate a specific World Info/Lorebook entry.' },
        insertText: "activewi('${1:lorebook}', '${2:title}'${3:, force})",
        insertTextRules: 4
    },
    {
        label: 'activateWorldInfo',
        kind: 1,
        detail: 'activateWorldInfo(lorebook?: string, title: string | RegExp | number, force?: boolean): Promise<WorldInfoData | null>',
        documentation: { value: 'Alias for `activewi`.' },
        insertText: "activateWorldInfo('${1:lorebook}', '${2:title}'${3:, force})",
        insertTextRules: 4
    },
    {
        label: 'activateWorldInfoByKeywords',
        kind: 1,
        detail: 'activateWorldInfoByKeywords(keywords: string | string[], condition?: ActivateWorldInfoCondition): Promise<WorldInfoData[]>',
        documentation: { value: 'Triggers activations in World Info matching specified keywords.' },
        insertText: "activateWorldInfoByKeywords('${1:keywords}'${2:, condition})",
        insertTextRules: 4
    },
    {
        label: 'selectActivatedEntries',
        kind: 1,
        detail: 'selectActivatedEntries(entries: WorldInfoData[], keywords: string | string[], condition?: ActivateWorldInfoCondition): WorldInfoData[]',
        documentation: { value: 'Filters and returns matching activated entries from an array of lorebook data objects.' },
        insertText: "selectActivatedEntries(${1:entries}, '${2:keywords}'${3:, condition})",
        insertTextRules: 4
    },
    {
        label: 'getChatMessage',
        kind: 1,
        detail: 'getChatMessage(idx: number, role?: "user" | "assistant" | "system"): string',
        documentation: { value: 'Reads text from a specific chat log position (floor index).' },
        insertText: "getChatMessage(${1:idx}${2:, role})",
        insertTextRules: 4
    },
    {
        label: 'getChatMessages',
        kind: 1,
        detail: 'getChatMessages(startOrCount: number, endOrRole?: number | string, role?: string): string[]',
        documentation: { value: 'Retrieve lists of chat message contents within designated constraints.\nOverloads:\n- `getChatMessages(count)`\n- `getChatMessages(count, role)`\n- `getChatMessages(start, end)`\n- `getChatMessages(start, end, role)`' },
        insertText: "getChatMessages(${1:startOrCount}${2:, endOrRole})",
        insertTextRules: 4
    },
    {
        label: 'activateRegex',
        kind: 1,
        detail: 'activateRegex(pattern: string | RegExp, replace: string | Function, opts?: RegexOptions): void',
        documentation: { value: 'Injects custom regular expressions dynamically to intercept and clean prompts or generated outputs.' },
        insertText: "activateRegex(${1:pattern}, ${2:replace}${3:, opts})",
        insertTextRules: 4
    },
    {
        label: 'injectPrompt',
        kind: 1,
        detail: 'injectPrompt(key: string, prompt: string, order?: number, sticky?: number, uid?: string): void',
        documentation: { value: 'Dynamically insert systemic prompt sequences into contexts. Functions like manual lorebook activations.' },
        insertText: "injectPrompt('${1:key}', '${2:prompt}'${3:, order})",
        insertTextRules: 4
    },
    {
        label: 'getPromptsInjected',
        kind: 1,
        detail: 'getPromptsInjected(key: string, postprocess?: PostProcess[]): string',
        documentation: { value: 'Read raw active systemic injection templates matching an existing key.' },
        insertText: "getPromptsInjected('${1:key}'${2:, postprocess})",
        insertTextRules: 4
    },
    {
        label: 'hasPromptsInjected',
        kind: 1,
        detail: 'hasPromptsInjected(key: string): boolean',
        documentation: { value: 'Validate whether specific injections exist in current memory buffers.' },
        insertText: "hasPromptsInjected('${1:key}')",
        insertTextRules: 4
    },
    {
        label: 'matchChatMessages',
        kind: 1,
        detail: 'matchChatMessages(pattern: string | RegExp | Array<string|RegExp>, options?: GetChatMessageOptions): boolean',
        documentation: { value: 'Perform target text lookups inside chat archives. Returns boolean validation.' },
        insertText: "matchChatMessages(${1:pattern}${2:, options})",
        insertTextRules: 4
    },
    {
        label: 'parseJSON',
        kind: 1,
        detail: 'parseJSON(text: string): any',
        documentation: { value: 'Tolerant JSON parser engineered to read LLM outputs containing standard syntax aberrations.' },
        insertText: "parseJSON(${1:text})",
        insertTextRules: 4
    },
    {
        label: 'jsonPatch',
        kind: 1,
        detail: 'jsonPatch(dest: object, change: object[]): object',
        documentation: { value: 'Apply standard RFC-6902 JSON patch updates. Safe operation (creates non-mutated duplicate outputs).' },
        insertText: "jsonPatch(${1:dest}, ${2:change})",
        insertTextRules: 4
    },

    // ==========================================
    // SYSTEM LIBRARIES & VARIABLES
    // ==========================================
    {
        label: 'variables',
        kind: 13,
        detail: 'object',
        documentation: { value: 'Collection containing active environment states. Aggregated across Message, Local, and Global stores sequentially.' }
    },
    {
        label: 'SillyTavern',
        kind: 13,
        detail: 'object',
        documentation: { value: 'Exposes context properties returned by SillyTavern\'s standard runtime query: `SillyTavern.getContext()`.' }
    },
    {
        label: 'faker',
        kind: 13,
        detail: 'object',
        documentation: { value: 'Accesses faker library instance used to construct random, localized strings (e.g. `faker.fakerEN.lastName()`).' }
    },
    {
        label: '_',
        kind: 13,
        detail: 'object',
        documentation: { value: 'Provides Lodash utility operations.' }
    },
    {
        label: '$',
        kind: 13,
        detail: 'object',
        documentation: { value: 'Standard JQuery accessor for direct element query and manipulation.' }
    },
    {
        label: 'toastr',
        kind: 13,
        detail: 'object',
        documentation: { value: 'Simple notification library triggers UI notifications (e.g., `toastr.info("Alert")`).' }
    },
    {
        label: 'runType',
        kind: 13,
        detail: '"generate" | "preparation" | "render"',
        documentation: { value: 'Returns current processing pipeline stage.' }
    },
    {
        label: 'charLoreBook',
        kind: 13,
        detail: 'string | undefined',
        documentation: { value: 'Target lorebook identifier assigned to the active character card. Undefined if none.' }
    },
    {
        label: 'userLoreBook',
        kind: 13,
        detail: 'string | undefined',
        documentation: { value: 'Target lorebook identifier assigned to user persona configurations. Undefined if none.' }
    },
    {
        label: 'chatLoreBook',
        kind: 13,
        detail: 'string | undefined',
        documentation: { value: 'Target lorebook identifier assigned directly to the current chat session. Undefined if none.' }
    },
    {
        label: 'userName',
        kind: 13,
        detail: 'string',
        documentation: { value: 'Current session user display name.' }
    },
    {
        label: 'charName',
        kind: 13,
        detail: 'string',
        documentation: { value: 'Active character card display name.' }
    },
    {
        label: 'chatId',
        kind: 13,
        detail: 'string',
        documentation: { value: 'Current conversation unique ID.' }
    },
    {
        label: 'characterId',
        kind: 13,
        detail: 'string',
        documentation: { value: 'Active character card system identifier.' }
    },
    {
        label: 'groupId',
        kind: 13,
        detail: 'string | null',
        documentation: { value: 'Current group chat unique identifier. `null` if private 1-on-1 session.' }
    },
    {
        label: 'groups',
        kind: 13,
        detail: 'array',
        documentation: { value: 'Group session metadata configurations.' }
    },
    {
        label: 'charAvatar',
        kind: 13,
        detail: 'string',
        documentation: { value: 'Asset resource URI for the active character card\'s avatar icon.' }
    },
    {
        label: 'userAvatar',
        kind: 13,
        detail: 'string',
        documentation: { value: 'Asset resource URI for the current user persona\'s avatar icon.' }
    },
    {
        label: 'lastUserMessageId',
        kind: 13,
        detail: 'number',
        documentation: { value: 'Floor index position corresponding to the most recent user prompt in the chat log.' }
    },
    {
        label: 'lastCharMessageId',
        kind: 13,
        detail: 'number',
        documentation: { value: 'Floor index position corresponding to the most recent AI response in the chat log.' }
    },
    {
        label: 'model',
        kind: 13,
        detail: 'string',
        documentation: { value: 'Exposes currently active API model configuration (e.g. `gpt-4`).' }
    },
    {
        label: 'generateType',
        kind: 13,
        detail: 'string',
        documentation: { value: 'Execution context type of generation action: `"custom" | "normal" | "continue" | "impersonate" | "regenerate" | "swipe" | "quiet"`. Empty string if inactive.' }
    },
    {
        label: 'message_id',
        kind: 13,
        detail: 'number',
        documentation: { value: 'The active message floor/ID context.' }
    },
    {
        label: 'swipe_id',
        kind: 13,
        detail: 'number',
        documentation: { value: 'The active message swipe index context.' }
    },
    {
        label: 'name',
        kind: 13,
        detail: 'string',
        documentation: { value: 'Name of the sender of the active message.' }
    },
    {
        label: 'is_last',
        kind: 13,
        detail: 'boolean',
        documentation: { value: 'Checks whether the active message is the most recent entry in the chat log.' }
    },
    {
        label: 'is_user',
        kind: 13,
        detail: 'boolean',
        documentation: { value: 'Checks whether the active message originated from the user.' }
    },
    {
        label: 'is_system',
        kind: 13,
        detail: 'boolean',
        documentation: { value: 'Checks whether the active message originated from the system.' }
    }
];

export async function init() {
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

    console.log(`monaco-editor loaded. `, monaco);
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

    suggestions.push(...(autoComplete.map(obj => ({ ...obj, range, insertText: obj.insertText || obj.label }))));

    return suggestions;
}

function reloadWorldInfoPage(e: JQuery.ClickEvent) {
    if (!settings.enabled || !settings.code_editor)
        return;

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

const STORAGE_KEY = 'st_monaco_editor_settings';

const DEFAULT_EDITOR_SETTINGS = {
    fontSize: 14,
    fontFamily: "'Cascadia Code','Fira Code',Consolas,'Courier New',monospace",
    lineHeight: 0,
    letterSpacing: 0,
    fontWeight: 'normal',
    fontLigatures: false,
    theme: 'ejsTheme',
    cursorStyle: 'line',
    cursorBlinking: 'blink',
    renderWhitespace: 'boundary' as const,
    renderLineHighlight: 'line',
    guidesIndent: 'indentation' as 'indentation' | 'none',
    wordWrap: false,
    lineNumbers: true,
    minimap: true,
    bracketPairColorization: true,
    folding: true,
    glyphMargin: false,
    smoothScrolling: true,
    mouseWheelZoom: false,
    scrollBeyondLastLine: true,
    stickyScroll: true,
    contextmenu: true,
    quickSuggestions: true,
    semanticHighlighting: true,
    insertSpaces: true,
    tabSize: 4,
    detectIndentation: true,
    trimAutoWhitespace: true,
    wordBasedSuggestions: 'currentDocument' as string,
};

function loadEditorSettings(): typeof DEFAULT_EDITOR_SETTINGS {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return { ...DEFAULT_EDITOR_SETTINGS, ...JSON.parse(raw) };
    } catch (_) { /* ignore */ }
    return { ...DEFAULT_EDITOR_SETTINGS };
}

function saveEditorSettings(editor: any) {
    const g = document.getElementById.bind(document);
    const ck = (id: string) => !!(g(id) as HTMLInputElement)?.checked;
    const sv = (id: string) => (g(id) as HTMLSelectElement)?.value ?? '';
    const nv = (id: string) => parseInt((g(id) as HTMLInputElement)?.value, 10) || 0;
    const fv = (id: string) => parseFloat((g(id) as HTMLInputElement)?.value) || 0;
    const settings = {
        fontSize: Math.max(8, Math.min(48, nv('ed-font-size') || 14)),
        fontFamily: sv('ed-font-family'),
        lineHeight: Math.max(0, Math.min(60, nv('ed-line-height'))),
        letterSpacing: Math.max(0, Math.min(10, fv('ed-letter-spacing'))),
        fontWeight: sv('ed-font-weight'),
        fontLigatures: ck('ed-font-ligatures'),
        theme: sv('ed-theme'),
        cursorStyle: sv('ed-cursor-style'),
        cursorBlinking: sv('ed-cursor-blinking'),
        renderWhitespace: sv('ed-render-whitespace'),
        renderLineHighlight: sv('ed-line-highlight'),
        guidesIndent: sv('ed-guides'),
        wordWrap: ck('ed-word-wrap'),
        lineNumbers: ck('ed-line-numbers'),
        minimap: ck('ed-minimap'),
        bracketPairColorization: ck('ed-bracket-pair-color'),
        folding: ck('ed-folding'),
        glyphMargin: ck('ed-glyph-margin'),
        smoothScrolling: ck('ed-smooth-scrolling'),
        mouseWheelZoom: ck('ed-mouse-wheel-zoom'),
        scrollBeyondLastLine: ck('ed-scroll-beyond-last'),
        stickyScroll: ck('ed-sticky-scroll'),
        contextmenu: ck('ed-contextmenu'),
        quickSuggestions: ck('ed-quick-suggestions'),
        semanticHighlighting: ck('ed-semantic-highlight'),
        insertSpaces: sv('ed-insert-spaces') === 'spaces',
        tabSize: Math.max(1, Math.min(8, nv('ed-tab-size') || 4)),
        detectIndentation: ck('ed-detect-indent'),
        trimAutoWhitespace: ck('ed-trim-auto-whitespace'),
        wordBasedSuggestions: sv('ed-word-based-suggestions'),
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) { /* ignore */ }
}

async function showEditor(ref: string) {
    let editor: any = null;

    /**
     * 共享的输入/选择控件内联样式
     */
    const inputStyle = `padding:2px 6px;border-radius:4px;border:1px solid var(--SmartThemeBorderColor,#555);background:var(--SmartThemeInputColor,#1e1e1e);color:var(--SmartThemeBodyColor,#ccc);font-size:12px;`;
    const labelStyle = `display:flex;align-items:center;gap:4px;color:var(--SmartThemeBodyColor,#ccc);`;
    const numInputStyle = `width:50px;${inputStyle}`;
    const selStyle = `max-width:120px;${inputStyle}`;

    const toolbarHtml = `
    <style>
        #editor-toolbar label { white-space: nowrap; }
        #editor-toolbar input[type="checkbox"] { margin: 0; accent-color: var(--SmartThemeQuoteColor, #888); }
        /* ===== 菜单栏 ===== */
        .ed-menubar {
            display:flex;align-items:center;gap:0;
            padding:0 4px;background:var(--SmartThemeBlurTintColor,#2b2b2b);
            border-bottom:1px solid var(--SmartThemeBorderColor,#444);
            user-select:none;position:relative;z-index:10;
        }
        .ed-menubar .ed-menu-btn {
            padding:4px 10px;font-size:12px;color:var(--SmartThemeBodyColor,#ccc);
            background:transparent;border:none;cursor:pointer;border-radius:3px;
            white-space:nowrap;font-family:inherit;
        }
        .ed-menubar .ed-menu-btn:hover,
        .ed-menubar .ed-menu-btn.active {
            background:var(--SmartThemeBorderColor,#444);
        }
        /* ===== 下拉面板 ===== */
        .ed-dropdown {
            display:none;position:absolute;top:100%;left:0;right:0;z-index:20;
            flex-wrap:wrap;align-items:center;gap:4px 8px;
            padding:6px 10px;
            background:var(--SmartThemeBlurTintColor,#2b2b2b);
            border-bottom:1px solid var(--SmartThemeBorderColor,#444);
            box-shadow:0 4px 8px rgba(0,0,0,.3);
        }
        .ed-dropdown.open { display:flex; }
    </style>
    <div id="editor-wrapper" style="display:flex;flex-direction:column;width:100%;height:100%;">
        <div id="editor-toolbar" style="flex-shrink:0;">
            <div class="ed-menubar">
                <button class="ed-menu-btn" data-menu="ed-menu-font">🔤 字体</button>
                <button class="ed-menu-btn" data-menu="ed-menu-theme">🎨 显示</button>
                <button class="ed-menu-btn" data-menu="ed-menu-features">⚙️ 功能</button>
                <button class="ed-menu-btn" data-menu="ed-menu-indent">↹ 缩进</button>
                <!-- ===== 字体下拉 ===== -->
                <div class="ed-dropdown" id="ed-menu-font">
                    <label style="${labelStyle}">字体<select id="ed-font-family" style="${selStyle}">
                        <option value="'Cascadia Code','Fira Code',Consolas,'Courier New',monospace">Cascadia Code</option>
                        <option value="'Fira Code',Consolas,'Courier New',monospace">Fira Code</option>
                        <option value="Consolas,'Courier New',monospace">Consolas</option>
                        <option value="'Courier New',monospace">Courier New</option>
                        <option value="'JetBrains Mono',Consolas,monospace">JetBrains Mono</option>
                        <option value="'Source Code Pro',Consolas,monospace">Source Code Pro</option>
                        <option value="monospace">Monospace</option>
                    </select></label>
                    <label style="${labelStyle}">字号<input id="ed-font-size" type="number" min="8" max="48" value="14" style="${numInputStyle}"></label>
                    <label style="${labelStyle}">行高<input id="ed-line-height" type="number" min="0" max="60" value="0" style="${numInputStyle}"></label>
                    <label style="${labelStyle}">字间距<input id="ed-letter-spacing" type="number" min="0" max="10" value="0" step="0.5" style="${numInputStyle}"></label>
                    <label style="${labelStyle}">字重<select id="ed-font-weight" style="${selStyle}max-width:80px;">
                        <option value="normal" selected>normal</option><option value="bold">bold</option>
                        <option value="100">100</option><option value="200">200</option><option value="300">300</option>
                        <option value="400">400</option><option value="500">500</option><option value="600">600</option>
                        <option value="700">700</option><option value="800">800</option><option value="900">900</option>
                    </select></label>
                    <label style="${labelStyle}"><input id="ed-font-ligatures" type="checkbox">连字</label>
                </div>
                <!-- ===== 显示下拉 ===== -->
                <div class="ed-dropdown" id="ed-menu-theme">
                    <label style="${labelStyle}">主题<select id="ed-theme" style="${selStyle}">
                        <option value="ejsTheme" selected>EJS Light</option>
                        <option value="vs">VS Light</option>
                        <option value="vs-dark">VS Dark</option>
                        <option value="hc-black">High Contrast</option>
                    </select></label>
                    <label style="${labelStyle}">光标<select id="ed-cursor-style" style="${selStyle}max-width:75px;">
                        <option value="line" selected>line</option><option value="block">block</option>
                        <option value="underline">underline</option><option value="line-thin">line-thin</option>
                        <option value="block-outline">block-outline</option><option value="underline-thin">underline-thin</option>
                    </select></label>
                    <label style="${labelStyle}">闪烁<select id="ed-cursor-blinking" style="${selStyle}max-width:80px;">
                        <option value="blink" selected>blink</option><option value="smooth">smooth</option>
                        <option value="phase">phase</option><option value="expand">expand</option>
                        <option value="solid">solid</option>
                    </select></label>
                    <label style="${labelStyle}">空白<select id="ed-render-whitespace" style="${selStyle}max-width:85px;">
                        <option value="none">none</option><option value="boundary" selected>boundary</option>
                        <option value="selection">selection</option><option value="trailing">trailing</option>
                        <option value="all">all</option>
                    </select></label>
                    <label style="${labelStyle}">行高亮<select id="ed-line-highlight" style="${selStyle}max-width:75px;">
                        <option value="line" selected>line</option><option value="all">all</option>
                        <option value="none">none</option><option value="gutter">gutter</option>
                    </select></label>
                    <label style="${labelStyle}">缩进线<select id="ed-guides" style="${selStyle}max-width:100px;">
                        <option value="indentation" selected>indentation</option><option value="none">none</option>
                    </select></label>
                </div>
                <!-- ===== 功能下拉 ===== -->
                <div class="ed-dropdown" id="ed-menu-features">
                    <label style="${labelStyle}"><input id="ed-word-wrap" type="checkbox">换行</label>
                    <label style="${labelStyle}"><input id="ed-line-numbers" type="checkbox" checked>行号</label>
                    <label style="${labelStyle}"><input id="ed-minimap" type="checkbox" checked>缩略图</label>
                    <label style="${labelStyle}"><input id="ed-bracket-pair-color" type="checkbox" checked>括号着色</label>
                    <label style="${labelStyle}"><input id="ed-folding" type="checkbox" checked>折叠</label>
                    <label style="${labelStyle}"><input id="ed-glyph-margin" type="checkbox">装订线</label>
                    <label style="${labelStyle}"><input id="ed-smooth-scrolling" type="checkbox" checked>平滑滚动</label>
                    <label style="${labelStyle}"><input id="ed-mouse-wheel-zoom" type="checkbox">滚轮缩放</label>
                    <label style="${labelStyle}"><input id="ed-scroll-beyond-last" type="checkbox" checked>超行滚动</label>
                    <label style="${labelStyle}"><input id="ed-sticky-scroll" type="checkbox" checked>黏性滚动</label>
                    <label style="${labelStyle}"><input id="ed-contextmenu" type="checkbox" checked>右键菜单</label>
                    <label style="${labelStyle}"><input id="ed-quick-suggestions" type="checkbox" checked>快速建议</label>
                    <label style="${labelStyle}"><input id="ed-semantic-highlight" type="checkbox" checked>语义高亮</label>
                </div>
                <!-- ===== 缩进下拉 ===== -->
                <div class="ed-dropdown" id="ed-menu-indent">
                    <label style="${labelStyle}">Tab<select id="ed-insert-spaces" style="${selStyle}max-width:75px;">
                        <option value="spaces" selected>空格</option><option value="tabs">制表</option>
                    </select></label>
                    <label style="${labelStyle}">宽度<input id="ed-tab-size" type="number" min="1" max="8" value="4" style="${numInputStyle}"></label>
                    <label style="${labelStyle}"><input id="ed-detect-indent" type="checkbox" checked>检测缩进</label>
                    <label style="${labelStyle}"><input id="ed-trim-auto-whitespace" type="checkbox" checked>修剪行尾</label>
                    <label style="${labelStyle}">建议<select id="ed-word-based-suggestions" style="${selStyle}max-width:90px;">
                        <option value="currentDocument" selected>本文档</option><option value="allDocuments">所有文档</option>
                        <option value="matchingDocuments">同语言</option><option value="off">关闭</option>
                    </select></label>
                </div>
            </div>
        </div>
        <div id="editor-container" style="flex:1;width:100%;text-align:left;"></div>
    </div>`;

    await callGenericPopup(
        toolbarHtml,
        POPUP_TYPE.TEXT,
        '',
        {
            wide: true,
            large: true,
            leftAlign: true,
            okButton: 'Save',
            onOpen: () => {
                const cfg = loadEditorSettings();
                const container = document.getElementById('editor-container') as HTMLElement;
                editor = monaco.editor.create(container, {
                    value: $(`#${ref}`).val() as string ?? '',
                    language: 'ejs',
                    theme: cfg.theme,
                    automaticLayout: true,
                    fontSize: cfg.fontSize,
                    fontFamily: cfg.fontFamily,
                    lineHeight: cfg.lineHeight,
                    letterSpacing: cfg.letterSpacing,
                    fontWeight: cfg.fontWeight,
                    fontLigatures: cfg.fontLigatures,
                    wordWrap: cfg.wordWrap ? 'on' : 'off',
                    lineNumbers: cfg.lineNumbers ? 'on' : 'off',
                    minimap: { enabled: cfg.minimap },
                    bracketPairColorization: { enabled: cfg.bracketPairColorization },
                    folding: cfg.folding,
                    glyphMargin: cfg.glyphMargin,
                    cursorStyle: cfg.cursorStyle as any,
                    cursorBlinking: cfg.cursorBlinking as any,
                    renderWhitespace: cfg.renderWhitespace,
                    renderLineHighlight: cfg.renderLineHighlight as any,
                    guides: cfg.guidesIndent === 'none' ? { indentation: false, bracketPairs: false } : { indentation: true, bracketPairs: true },
                    smoothScrolling: cfg.smoothScrolling,
                    mouseWheelZoom: cfg.mouseWheelZoom,
                    scrollBeyondLastLine: cfg.scrollBeyondLastLine,
                    stickyScroll: { enabled: cfg.stickyScroll },
                    contextmenu: cfg.contextmenu,
                    quickSuggestions: cfg.quickSuggestions,
                    insertSpaces: cfg.insertSpaces,
                    tabSize: cfg.tabSize,
                    detectIndentation: cfg.detectIndentation,
                    trimAutoWhitespace: cfg.trimAutoWhitespace,
                    wordBasedSuggestions: cfg.wordBasedSuggestions as any,
                    'semanticHighlighting.enabled': cfg.semanticHighlighting,
                });

                // ---- 同步 UI 控件到已保存配置 ----
                const $el = document.getElementById.bind(document);
                const setVal = (id: string, val: any) => { const el = $el(id); if (el) (el as HTMLInputElement | HTMLSelectElement).value = String(val); };
                const setCk = (id: string, val: boolean) => { const el = $el(id) as HTMLInputElement; if (el) el.checked = val; };
                setVal('ed-font-family', cfg.fontFamily);
                setVal('ed-font-size', cfg.fontSize);
                setVal('ed-line-height', cfg.lineHeight);
                setVal('ed-letter-spacing', cfg.letterSpacing);
                setVal('ed-font-weight', cfg.fontWeight);
                setCk('ed-font-ligatures', cfg.fontLigatures);
                setVal('ed-theme', cfg.theme);
                setVal('ed-cursor-style', cfg.cursorStyle);
                setVal('ed-cursor-blinking', cfg.cursorBlinking);
                setVal('ed-render-whitespace', cfg.renderWhitespace);
                setVal('ed-line-highlight', cfg.renderLineHighlight);
                setVal('ed-guides', cfg.guidesIndent);
                setCk('ed-word-wrap', cfg.wordWrap);
                setCk('ed-line-numbers', cfg.lineNumbers);
                setCk('ed-minimap', cfg.minimap);
                setCk('ed-bracket-pair-color', cfg.bracketPairColorization);
                setCk('ed-folding', cfg.folding);
                setCk('ed-glyph-margin', cfg.glyphMargin);
                setCk('ed-smooth-scrolling', cfg.smoothScrolling);
                setCk('ed-mouse-wheel-zoom', cfg.mouseWheelZoom);
                setCk('ed-scroll-beyond-last', cfg.scrollBeyondLastLine);
                setCk('ed-sticky-scroll', cfg.stickyScroll);
                setCk('ed-contextmenu', cfg.contextmenu);
                setCk('ed-quick-suggestions', cfg.quickSuggestions);
                setCk('ed-semantic-highlight', cfg.semanticHighlighting);
                setVal('ed-insert-spaces', cfg.insertSpaces ? 'spaces' : 'tabs');
                setVal('ed-tab-size', cfg.tabSize);
                setCk('ed-detect-indent', cfg.detectIndentation);
                setCk('ed-trim-auto-whitespace', cfg.trimAutoWhitespace);
                setVal('ed-word-based-suggestions', cfg.wordBasedSuggestions);

                // ---- IDE 风格菜单栏交互 ----
                const closeAllDropdowns = () => {
                    document.querySelectorAll('.ed-dropdown.open').forEach(d => d.classList.remove('open'));
                    document.querySelectorAll('.ed-menu-btn.active').forEach(b => b.classList.remove('active'));
                };
                document.querySelectorAll('.ed-menu-btn').forEach(btn => {
                    btn.addEventListener('click', (e: Event) => {
                        e.stopPropagation();
                        const menuId = (btn as HTMLElement).dataset.menu;
                        const dropdown = document.getElementById(menuId!);
                        if (!dropdown) return;
                        const isOpen = dropdown.classList.contains('open');
                        closeAllDropdowns();
                        if (!isOpen) {
                            dropdown.classList.add('open');
                            btn.classList.add('active');
                        }
                    });
                });
                // 点击下拉面板内部不关闭
                document.querySelectorAll('.ed-dropdown').forEach(dd => {
                    dd.addEventListener('click', (e: Event) => e.stopPropagation());
                });
                // 点击 menubar 非按钮区域也关闭（兜底）
                document.querySelector('.ed-menubar')?.addEventListener('click', (e: Event) => {
                    if (!(e.target as HTMLElement).classList.contains('ed-menu-btn')) {
                        closeAllDropdowns();
                    }
                });
                // 点击编辑器区域关闭所有下拉
                document.getElementById('editor-container')?.addEventListener('click', () => closeAllDropdowns());

                // ---- 事件绑定辅助函数 ----
                const on = (id: string, event: string, fn: EventListener) => $el(id)?.addEventListener(event, fn);

                // 字体
                on('ed-font-family', 'change', () => editor?.updateOptions({ fontFamily: ($el('ed-font-family') as HTMLSelectElement).value }));
                // 字号
                on('ed-font-size', 'input', () => editor?.updateOptions({ fontSize: Math.max(8, Math.min(48, parseInt(($el('ed-font-size') as HTMLInputElement).value, 10) || 14)) }));
                // 行高 (0 = auto)
                on('ed-line-height', 'input', () => editor?.updateOptions({ lineHeight: Math.max(0, Math.min(60, parseInt(($el('ed-line-height') as HTMLInputElement).value, 10) || 0)) }));
                // 字间距
                on('ed-letter-spacing', 'input', () => editor?.updateOptions({ letterSpacing: Math.max(0, Math.min(10, parseFloat(($el('ed-letter-spacing') as HTMLInputElement).value) || 0)) }));
                // 字重
                on('ed-font-weight', 'change', () => editor?.updateOptions({ fontWeight: ($el('ed-font-weight') as HTMLSelectElement).value }));
                // 连字
                on('ed-font-ligatures', 'change', () => editor?.updateOptions({ fontLigatures: ($el('ed-font-ligatures') as HTMLInputElement).checked }));
                // 主题
                on('ed-theme', 'change', () => monaco.editor.setTheme(($el('ed-theme') as HTMLSelectElement).value));
                // 光标样式
                on('ed-cursor-style', 'change', () => editor?.updateOptions({ cursorStyle: ($el('ed-cursor-style') as HTMLSelectElement).value }));
                // 光标闪烁
                on('ed-cursor-blinking', 'change', () => editor?.updateOptions({ cursorBlinking: ($el('ed-cursor-blinking') as HTMLSelectElement).value }));
                // 渲染空白
                on('ed-render-whitespace', 'change', () => editor?.updateOptions({ renderWhitespace: ($el('ed-render-whitespace') as HTMLSelectElement).value }));
                // 行高亮
                on('ed-line-highlight', 'change', () => editor?.updateOptions({ renderLineHighlight: ($el('ed-line-highlight') as HTMLSelectElement).value }));
                // 缩进参考线
                on('ed-guides', 'change', () => {
                    const v = ($el('ed-guides') as HTMLSelectElement).value;
                    editor?.updateOptions({ guides: v === 'none' ? { indentation: false, bracketPairs: false } : { indentation: true, bracketPairs: true } });
                });
                // 复选框类
                const bindCheck = (id: string, opt: string, map?: (v: boolean) => any) =>
                    on(id, 'change', () => editor?.updateOptions({ [opt]: map ? map(($el(id) as HTMLInputElement).checked) : ($el(id) as HTMLInputElement).checked }));
                bindCheck('ed-word-wrap', 'wordWrap', (v) => v ? 'on' : 'off');
                bindCheck('ed-line-numbers', 'lineNumbers', (v) => v ? 'on' : 'off');
                bindCheck('ed-minimap', 'minimap', (v) => ({ enabled: v }));
                bindCheck('ed-bracket-pair-color', 'bracketPairColorization', (v) => ({ enabled: v }));
                bindCheck('ed-folding', 'folding');
                bindCheck('ed-glyph-margin', 'glyphMargin');
                bindCheck('ed-smooth-scrolling', 'smoothScrolling');
                bindCheck('ed-mouse-wheel-zoom', 'mouseWheelZoom');
                bindCheck('ed-scroll-beyond-last', 'scrollBeyondLastLine');
                bindCheck('ed-sticky-scroll', 'stickyScroll', (v) => ({ enabled: v }));
                bindCheck('ed-contextmenu', 'contextmenu');
                bindCheck('ed-quick-suggestions', 'quickSuggestions');
                bindCheck('ed-semantic-highlight', 'semanticHighlighting.enabled');
                bindCheck('ed-detect-indent', 'detectIndentation');
                bindCheck('ed-trim-auto-whitespace', 'trimAutoWhitespace');
                // Tab缩进方式
                on('ed-insert-spaces', 'change', () => editor?.updateOptions({ insertSpaces: ($el('ed-insert-spaces') as HTMLSelectElement).value === 'spaces' }));
                // Tab宽度
                on('ed-tab-size', 'input', () => editor?.updateOptions({ tabSize: Math.max(1, Math.min(8, parseInt(($el('ed-tab-size') as HTMLInputElement).value, 10) || 4)) }));
                // 建议范围
                on('ed-word-based-suggestions', 'change', () => editor?.updateOptions({ wordBasedSuggestions: ($el('ed-word-based-suggestions') as HTMLSelectElement).value }));
            },
            onClose: () => {
                if (editor) {
                    saveEditorSettings(editor);
                    $(`#${ref}`).val(editor.getValue());
                    editor.dispose();
                }
            }
        }
    );
}
