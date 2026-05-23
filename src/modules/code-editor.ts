import loader from '@monaco-editor/loader';
import { eventSource, event_types } from '../../../../../events.js';
import { callGenericPopup, POPUP_TYPE } from '../../../../../popup.js';

let monaco: any = null;

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
        detail: 'setVariableSchema(schema: object): void',
        documentation: { value: 'Sets a Zod schema for variable validation. Any subsequent modifications failing validation will throw an error.' },
        insertText: "setVariableSchema(${1:schema})",
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
    loader.config({
        paths: {
            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs'
        },
        "vs/nls": {
            availableLanguages: {
                // '*': 'zh-CN',
            }
        }
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
