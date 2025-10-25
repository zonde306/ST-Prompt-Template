# Built-in Functions

```javascript
/**
 * Message selection filter
 * @interface MessageFilter
 * @property {('system' | 'user' | 'assistant' | 'any')} [role='assistant'] - Select messages by role.
 *      Valid values: 'system', 'user', 'assistant', or 'any'. Search starts from the end of the chat history.
 *      This option is ignored if `id` is specified.
 * @property {number} [id=null] - Select a specific chat message by index (can be negative; negative values count from the end).
 * @property {number} [swipe_id=null] - Select a specific swipe (alternative response) of a message.
 */

/**
 * Options for setting variables
 * @typedef {Object} SetVarOption
 * @property {number} [index=null] - Variable index (same as the `index` parameter in `/setvar`).
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} [scope='message'] - Variable scope. See details below.
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Conditional flags for setting. If condition is not met, the variable is not set. See below.
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - Type of return value. See below.
 * @property {MessageFilter} [withMsg=null] - Message filter (required when setting message-scoped variables).
 * @property {boolean} [merge=false] - Whether to merge the value using `_.merge` instead of replacing.
 * @property {boolean} [dryRun=false] - Allow setting variables during the preparation phase (non-persistent).
 * @property {boolean} [noCache=false] - Disable caching (e.g., to read a variable immediately after setting it).
 */

/**
 * @typedef {('nx'|'xx'|'n'|'nxs'|'xxs')} FlagOption
 * @description Variable assignment conditions:
 *   - `nx`: Set only if the variable does **not** exist.
 *   - `xx`: Set only if the variable **already** exists.
 *   - `n`: Always set (default).
 *   - `nxs`/`xxs`: Same as `nx`/`xx`, but also return success status.
 */

/**
 * @typedef {('global'|'local'|'message'|'cache'|'initial')} ScopeOption
 * @description Variable scopes:
 *   - `global`: Persistent across all chats.
 *   - `local`: Persistent within the current chat.
 *   - `message`: Attached to a specific chat message.
 *   - `cache`: Temporary, cleared after generation.
 *   - `initial`: Initial state of variables (read-only in most contexts).
 */

/**
 * @typedef {('old'|'new'|'fullcache')} ResultOption
 * @description Return value types:
 *   - `old`: Return the value **before** update.
 *   - `new`: Return the value **after** update (default).
 *   - `fullcache`: Return the entire variable cache.
 */

/**
 * @typedef {boolean} DryRun
 * @description When `true`, simulates variable assignment without persisting changes.
 */

/**
 * @typedef {(FlagOption|ScopeOption|ResultOption|DryRun)} SimpleOptions
 * @description Shorthand for specifying `flags`, `scope`, `results`, or `dryRun` directly as a single value.
 */

/**
 * Sets a variable in SillyTavern.
 *
 * @param {(string|null)} key - Variable name. If `null`, replaces the entire variable tree.
 * @param {any} value - Value to assign.
 * @param {(SetVarOption|SimpleOptions)} [options={}] - Options for setting the variable.
 * @returns {any} - Returns a value based on `options.results`; `undefined` on failure.
 */
function setvar(key, value, options = {});
// Aliases for specific scopes
function setLocalVar(key, value, options = {});
function setGlobalVar(key, value, options = {});
function setMessageVar(key, value, options = {});


/**
 * Options for getting variables
 * @typedef {Object} GetVarOption
 * @property {number} [index=null] - Variable index (same as in `/getvar`).
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} [scope='cache'] - Variable scope.
 * @property {any} [defaults=undefined] - Default value to return if the variable is not found.
 * @property {MessageFilter} [withMsg=undefined] - Message filter (for message-scoped variables).
 * @property {boolean} [noCache=false] - Disable caching.
 * @property {boolean} [clone=false] - Return a deep clone instead of a reference.
 */

/**
 * Reads a variable from SillyTavern.
 * @note Avoid mutating returned object references unless `clone: true` is used.
 *
 * @param {(string|null)} key - Variable name. If `null`, returns the entire variable tree.
 * @param {(GetVarOption|SimpleOptions)} [options={}] - Options for retrieving the variable.
 * @returns {any} - Variable value, or `options.defaults` if not found (or `undefined` if `options.defaults` is not specified).
 */
function getvar(key, options = {});
// Aliases for specific scopes
function getLocalVar(key, options = {});
function getGlobalVar(key, options = {});
function getMessageVar(key, options = {});

/**
 * Options for updating (get-and-set) variables
 * @typedef {Object} GetSetVarOption
 * @property {number} [index=null] - Variable index.
 * @property {unknown} [defaults=0] - Default value if variable doesn't exist.
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} [inscope='cache'] - Scope to **read** from.
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} [outscope='message'] - Scope to **write** to.
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Update condition flags.
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - Return value type.
 * @property {MessageFilter} [withMsg=undefined] - Message filter (for message-scoped operations).
 * @property {boolean} [dryRun=false] - Allow update during preparation phase.
 * @property {boolean} [noCache=false] - Disable caching.
 * @property {number} [min=null] - Enforce minimum numeric value.
 * @property {number} [max=null] - Enforce maximum numeric value.
 */

/**
 * Increments a numeric variable.
 *
 * @param {string} key - Variable name.
 * @param {number} [value=1] - Amount to increment by.
 * @param {(GetSetVarOption|SimpleOptions)} [options={}] - Update options.
 * @returns {any} - Return value based on `options.results`; `undefined` on failure.
 */
function incvar(key, value = 1, options = {});
// Aliases for specific output scopes
function incLocalVar(key, value = 1, options = {});
function incGlobalVar(key, value = 1, options = {});
function incMessageVar(key, value = 1, options = {});

/**
 * Decrements a numeric variable.
 *
 * @param {string} key - Variable name.
 * @param {number} [value=1] - Amount to decrement by.
 * @param {(GetSetVarOption|SimpleOptions)} [options={}] - Update options.
 * @returns {any} - Return value based on `options.results`; `undefined` on failure.
 */
function decvar(key, value = 1, options = {});
// Aliases for specific output scopes
function decLocalVar(key, value = 1, options = {});
function decGlobalVar(key, value = 1, options = {});
function decMessageVar(key, value = 1, options = {});

/**
 * Executes a SillyTavern command (e.g., `/setvar`).
 *
 * @param {string} cmd - Command string.
 * @returns {Promise<string>} - Command output.
 */
async function execute(cmd);

/**
 * Retrieves content from a World/Lorebook entry.
 *
 * @param {string} [lorebook=''] - Lorebook name. Empty or omitted uses the character's primary lorebook.
 * @param {string | RegExp | number} title - Entry UID, title, or regex pattern.
 * @param {Record<string, any>} [data={}] - Template data for rendering.
 * @returns {Promise<string>} - Rendered content of the lorebook entry.
 */
async function getwi(lorebook, title, data = {});
async function getWorldInfo(lorebook, title, data = {});
async function getwi(title, data = {});
async function getWorldInfo(title, data = {});

/**
 * Retrieves a character definition (formatted via template).
 *
 * @param {string | RegExp | number} [name=this_chid] - Character name or ID.
 * @param {string} [template=DEFAULT_CHAR_DEFINE] - Output template.
 * @param {Object} [data={}] - Template data.
 * @returns {Promise<string>} - Rendered character definition.
 */
async function getchar(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});
async function getChara(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});

/**
 * Retrieves a preset prompt.
 *
 * @param {string | RegExp} name - Preset name or regex.
 * @param {Object} [data={}] - Template data.
 * @returns {Promise<string>} - Rendered preset prompt content.
 */
async function getpreset(name, data = {});
async function getPresetPrompt(name, data = {});

/**
 * Defines a global variable or function.
 * @note Typically used in lorebook preambles for later use during rendering.
 *
 * @param {string} name - Variable or function name.
 * @param {any} value - Value or function.
 * @param {boolean} [merge=false] - Whether to merge using `_.merge`.
 * @note When defining functions, use `this` to access context (e.g., `this.getvar`, `this.variables`).
 */
function define(name, value, merge = false);

/**
 * Retrieves a quick reply entry.
 * @note Only enabled quick reply sets are accessible.
 *
 * @param {string | RegExp} name - Quick reply set name.
 * @param {string | RegExp} label - Entry label/name.
 * @param {Object} [data={}] - Template data.
 * @returns {string} - Rendered quick reply content.
 */
async function getqr(name, label, data = {});
async function getQuickReply(name, label, data = {});

/**
 * Retrieves raw character data (unrendered).
 *
 * @param {string | RegExp | number} [name=this_chid] - Character name or ID.
 * @returns {Promise<v1CharData | null>} - Raw character data object, or `null` if not found.
 */
async function getCharData(name = this_chid);

/**
 * @typedef {Object} WorldInfoData
 * @property {number} uid
 * @property {Array<string>} key
 * @property {Array<string>} keysecondary
 * @property {string} comment
 * @property {string} content
 * @property {boolean} constant
 * @property {boolean} vectorized
 * @property {boolean} selective
 * @property {number} selectiveLogic
 * @property {boolean} addMemo
 * @property {number} order
 * @property {number} position
 * @property {boolean} disable
 * @property {boolean} excludeRecursion
 * @property {boolean} preventRecursion
 * @property {boolean} delayUntilRecursion
 * @property {number} probability
 * @property {boolean} useProbability
 * @property {number} depth
 * @property {string} group
 * @property {boolean} groupOverride
 * @property {number} groupWeight
 * @property {(number|null)} scanDepth
 * @property {(boolean|null)} caseSensitive
 * @property {(number|null)} matchWholeWords
 * @property {(boolean|null)} useGroupScoring
 * @property {string} automationId
 * @property {(number|null)} role
 * @property {number} sticky
 * @property {number} cooldown
 * @property {number} delay
 * @property {number} displayIndex
 * @property {string} world
 */

/**
 * Retrieves raw lorebook entries (unrendered).
 *
 * @param {string} name - Lorebook name or UID.
 * @returns {Promise<WorldInfoData[]>} - Array of raw lorebook entries.
 */
async function getWorldInfoData(name);

/**
 * Retrieves raw quick reply set data (unrendered).
 *
 * @param {string | RegExp} name - Quick reply set name.
 * @returns {QuickReplySetLink | null} - Raw quick reply set data, or `null` if not found.
 */
function getQuickReplyData(name);

/**
 * Retrieves only the **activated** entries from a lorebook (based on keywords).
 *
 * @param {string} name - Lorebook name or UID.
 * @param {(string|string[])} keyword - Keyword(s) used to activate entries.
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation constraints.
 * @returns {Promise<WorldInfoData[]>} - Activated lorebook entries.
 */
async function getWorldInfoActivatedData(name, keyword, condition = {});

/**
 * Renders a string using SillyTavern's template engine (EJS-based).
 *
 * @param {string} content - Template string to render.
 * @param {Object} [data={}] - Template context data.
 * @param {Object} [options={}] - EJS rendering options.
 * @returns {Promise<string>} - Rendered string.
 */
async function evalTemplate(content, data = {}, options = {});

/**
 * Retrieves all lorebook entries that **could** be used (including disabled ones).
 *
 * @param {boolean} chara - Include character-embedded lorebooks.
 * @param {boolean} global - Include globally enabled lorebooks.
 * @param {boolean} persona - Include user persona lorebooks.
 * @param {boolean} charaExtra - Include character-attached external lorebooks.
 * @param {boolean} onlyExisting - Only include entries from existing lorebooks.
 * @returns {Promise<WorldInfoData[]>} - All eligible lorebook entries.
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true, onlyExisting = true);

/**
 * Outputs one or more strings to the log or UI.
 * @note Cannot be used inside `<%- ... %>` or `<%= ... %>` EJS blocks.
 *
 * @param {...string} args - Strings to output.
 */
function print(...args);

/**
 * Activates a specific lorebook entry.
 *
 * @param {string} lorebook - Lorebook name.
 * @param {string | RegExp | number} title - Entry UID, title, or regex.
 * @param {boolean} [force=false] - Force activation even if conditions aren't met.
 * @returns {Promise<WorldInfoData | null>} - Activated entry, or `null` if not found.
 */
async function activewi(lorebook, title, force = false);
async function activateWorldInfo(lorebook, title, force = false);
async function activewi(title, force = false);
async function activateWorldInfo(title, force = false);

/**
 * Conditions for activating lorebook entries.
 * `null` means no constraint.
 * @typedef {Object} ActivateWorldInfoCondition
 * @property {boolean | null} [constant=null] - Must (or must not) be a "Constant" (🔵) entry.
 * @property {boolean | null} [disabled=null] - Must (or must not) be disabled.
 * @property {boolean | null} [vectorized=null] - Must (or must not) be "Vectorized" (🔗).
 */

/**
 * Activates lorebook entries by keyword matching.
 *
 * @param {string | string[]} keywords - Keyword(s) to match against entry keys.
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation constraints.
 * @returns {Promise<WorldInfoData[]>} - Activated entries.
 */
async function activateWorldInfoByKeywords(keywords, condition = {});

// Note: The duplicate `getEnabledWorldInfoEntries` declaration was removed.

/**
 * Filters a list of lorebook entries to only those activated by given keywords.
 *
 * @param {WorldInfoData[]} entries - List of lorebook entries.
 * @param {string | string[]} keywords - Keyword(s) for activation.
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation constraints.
 * @returns {WorldInfoData[]} - Activated entries.
 */
function selectActivatedEntries(entries, keywords, condition = {});

/**
 * Retrieves the content of a specific chat message.
 *
 * @param {number} idx - Message index (can be negative).
 * @param {'user' | 'assistant' | 'system' | undefined} [role] - Filter by role; if omitted, no filtering.
 * @returns {string} - Message content, or empty string on failure.
 */
function getChatMessage(idx, role = undefined);

/**
 * Retrieves a range of chat messages.
 *
 * @overload
 * @param {number} count - Number of recent messages to retrieve.
 * @returns {string[]}
 *
 * @overload
 * @param {number} count - Number of messages.
 * @param {'user' | 'assistant' | 'system'} role - Role filter.
 * @returns {string[]}
 *
 * @overload
 * @param {number} start - Start index (inclusive).
 * @param {number} end - End index (exclusive).
 * @returns {string[]}
 *
 * @overload
 * @param {number} start - Start index.
 * @param {number} end - End index.
 * @param {'user' | 'assistant' | 'system'} role - Role filter.
 * @returns {string[]}
 */
function getChatMessages(...args);

/**
 * Options for regex-based message processing.
 * Execution order:
 *   Start → basic → generate → template processing → LLM response → message → template processing → render chat message.
 * Regexes added in `basic` mode are automatically removed after prompt processing.
 *
 * @typedef {Object} RegexOptions
 * @property {string} [uuid=undefined] - Unique ID; same UUID updates existing rule, different creates new.
 * @property {number} [minDepth=NaN] - Minimum recursion depth.
 * @property {number} [maxDepth=NaN] - Maximum recursion depth.
 * @property {boolean} [user=true] - Apply to user input.
 * @property {boolean} [assistant=true] - Apply to AI output.
 * @property {boolean} [worldinfo=false] - Apply to lorebook content.
 * @property {boolean} [reasoning=false] - Apply to reasoning blocks.
 * @property {boolean} [message=false] - Apply to rendered chat messages (supports replacement functions).
 * @property {boolean} [generate=false] - Apply during message generation (supports replacement functions).
 * @property {boolean} [basic=true] - Use SillyTavern's built-in regex system (no replacement functions).
 * @property {number} [order=100] - Execution order (lower = earlier).
 * @property {boolean} [before=true] - Process raw message before rendering (requires `message: true`).
 * @property {boolean} [html=false] - Process HTML output (requires `message: true`).
 * @property {number} [sticky=0] - Persistence level.
 */

/**
 * Activates a temporary regex rule during generation to process chat content.
 *
 * @param {string | RegExp} pattern - Regex pattern.
 * @param {string | ((substring: string, ...args: any[]) => string)} replace - Replacement string or function.
 * @param {RegexOptions} [opts={}] - Regex options.
 */
function activateRegex(pattern, replace, opts = {});

/**
 * Injects a prompt fragment manually (similar to lorebook, but programmatically controlled).
 *
 * @param {string} key - Injection group/key.
 * @param {string} prompt - Prompt content to inject.
 * @param {number} [order=100] - Injection order.
 * @param {number} [sticky=0] - Stickiness (persistence).
 * @param {string} [uid=''] - Unique identifier.
 */
function injectPrompt(key, prompt, order = 100, sticky = 0, uid = '');

/**
 * Post-processing rule for injected prompts.
 * @typedef {Object} PostProcess
 * @property {(string|RegExp)} search - Pattern to search for.
 * @property {string} replace - Replacement string.
 */

/**
 * Retrieves all prompts injected under a given key, with optional post-processing.
 *
 * @param {string} key - Injection group/key.
 * @param {PostProcess[]} [postprocess=[]] - Post-processing rules.
 * @returns {string} - Concatenated injected prompt content.
 */
function getPromptsInjected(key, postprocess = []);

/**
 * Checks whether any prompts have been injected under a given key.
 *
 * @param {string} key - Injection group/key.
 * @returns {boolean} - `true` if prompts exist for the key.
 */
function hasPromptsInjected(key);

/**
 * @interface GetChatMessageOptions
 * @property {number} [start=-2] - Start index (default: second-to-last message).
 * @property {number} [end=null] - End index (default: last message).
 * @property {'user'|'assistant'|'system'} [role=null] - Filter by role.
 * @property {boolean} [and=false] - If `pattern` is an array, require **all** patterns to match (default: match any).
 */

/**
 * Checks if specified content exists in chat messages.
 * @see getChatMessages
 *
 * @param {string|RegExp|(string|RegExp)[]} pattern - Search pattern(s).
 *   - String: literal substring search.
 *   - RegExp: regex search.
 *   - Array: match any (default) or all (if `options.and === true`).
 * @param {GetChatMessageOptions} [options={}] - Search options.
 * @returns {boolean} - `true` if match found.
 */
function matchChatMessages(pattern, options = {});

/**
 * A lenient JSON parser that can recover from common LLM output formatting errors.
 *
 * @see JSON.parse
 * @param {string} text - JSON-like string to parse.
 * @returns {(object|array|string|null|number|boolean)} - Parsed value.
 */
function parseJSON(text);

/**
 * A single JSON Patch operation as defined in RFC 6902.
 * @typedef {Object} JsonPatchOperation
 * @property {('add'|'remove'|'replace'|'move'|'copy'|'test')} op - The operation to perform.
 * @property {string} path - A JSON Pointer (RFC 6901) to the target location.
 * @property {any} [value] - The value to add, replace, or test (required for 'add', 'replace', 'test').
 * @property {string} [from] - A JSON Pointer to the source location (required for 'move' and 'copy').
 * @see {@link https://www.rfc-editor.org/rfc/rfc6902|RFC 6902}
 */

/**
 * A JSON Patch document: an array of patch operations.
 * @typedef {JsonPatchOperation[]} JsonPatchDocument
 */

/**
 * Applies a JSON Patch (RFC 6902) to an object and returns a new modified object.
 * Does **not** mutate the original object.
 * @see https://www.rfc-editor.org/rfc/rfc6902
 *
 * @param {object} dest - Target object to patch.
 * @param {JsonPatchDocument} change - Array of JSON Patch operations.
 * @returns {object} - New patched object.
 */
function jsonPatch(dest, change);

/**
 * Applies a JSON Patch to a SillyTavern variable.
 * @see jsonPatch
 * @see setvar
 *
 * @param {(string|null)} key - Variable name (or `null` for entire variable tree).
 * @param {JsonPatchDocument} change - JSON Patch operations.
 * @param {SetVarOption} [options={}] - Options passed to `setvar`.
 * @returns {any} - Return value determined by `options.results`.
 */
function patchVariables(key, change, options = {});
```

> `flags` types:
>
> - `nx`: Set if **not exists** (based on `scope=cache`).
> - `xx`: Set if **exists** (based on `scope=cache`).
> - `n`: Set directly (no check).
> - `nxs`: Set if **not exists** (based on the corresponding `scope`).
> - `xxs`: Set if **exists** (based on the corresponding `scope`).
>
> ------
>
> `scope`/`inscope`/`scope` types:
>
> `global`: Global variable (SillyTavern's `extension_settings.variables.global`).
>
> `local`: Local (chat) variable (SillyTavern's `chat_metadata.variables`).
>
> `message`: Message variable (extension-added `chat[msg_id].variables[swipe_id]`).
>
> `cache`: Temporary variable (template's `variables`, e.g., `<% variables.variable_name %>`).
>
> `initial`: initial variables, from `[InitialVariables]`
>
> - Temporary variables **are not saved** and will expire after generation.
> - Regardless of `scope`, temporary variables will be updated.
>
> ------
>
> `results` types:
>
> `old`: Return the old value (returns `undefined` if it doesn't exist).
>
> `new`: Return the new value (i.e., the passed `value`).
>
> `fullcache`: Return the entire updated cache `variables` content.
>
> ------
>
> `dryRun`:
>
> SillyTavern performs multiple world book/preset/character card calculations during the preparation phase. Allowing variable setting during this phase may result in variables being set multiple times.
>
> If there is no special requirement, it does not need to be set to `true`.
>
> **Updating floor messages is not considered part of the preparation phase.**
>
> ---
>
> `define`:
>
> If defining a function, the following rules must be followed:
>
> - You must use the `function` statement to define it, for example: `define('myfunc', function() { ... })`
> - When accessing variables and properties like `getvar`, `setvar`, etc., you must use `this`, for example: `this.getvar(...)`, `this.setvar(...)`
> - ~~Avoid directly using `variables`, as it will not be updated within the function (e.g., after calling `setvar`). Instead, use `this.getvar(...)`~~
>
> ---
>
> `noCache`:
>
> If you need to access the new value immediately after setting a variable, you must disable caching (`noCache=true`).
>
> The cache is not updated immediately; it is only loaded at the beginning and does not update midway.
>
> ---
>
> `getwi`, `getWorldInfo`:
>
> During recursive imports, `worldinfo` can automatically infer the current world book title, requiring only an empty value to be passed.
>
> The recursion only includes `getwi` and `getWorldInfo`; those activated by the Tavern itself are not included.
>
> Example:
>
> `Test World Book`: `Test Entry 1`
>
> ```javascript
> // Must provide worldinfo when activated by the Tavern
> <%- await getwi('Test World Book', 'Test Entry 2') -%>
> ```
>
> `Test World Book`: `Test Entry 2`
>
> ```javascript
> // Can omit worldinfo when loaded via import, only an empty value needs to be passed
> <%- await getwi('Test Entry 3') -%>
> ```
>
> `Test World Book`: `Test Entry 3`
>
> ```javascript
> <%- 'hello world!' -%>
> ```
>
> The above outputs:
>
> ```
> hello world!
> ```

---

```javascript
// Default character card definition output format
const DEFAULT_CHAR_DEFINE = `\
<% if (name) { %>\
<<%- name %>>
<% if (system_prompt) { %>\
System: <%- system_prompt %>
<% } %>\
name: <%- name %>
<% if (personality) { %>\
personality: <%- personality %>
<% } %>\
<% if (description) { %>\
description: <%- description %>
<% } %>\
<% if (message_example) { %>\
example:
<%- message_example %>
<% } %>\
<% if (depth_prompt) { %>\
System: <%- depth_prompt %>
<% } %>\
</<%- name %>>\
<% } %>\
`;
```

> `name`: Character name
>
> `system_prompt`: Prompt override
>
> `personality`: Character summary
>
> `description`: Character description
>
> `scenario`: Scenario
>
> `first_message`: First message
>
> `message_example`: Dialogue example
>
> `creatorcomment`: Creator's comment
>
> `alternate_greetings[]`: Additional messages list
>
> `depth_prompt`: Character notes

---

# Built-in Variables/Libraries

```javascript
/**
 * Aggregated variables collection
 * Merges variables in the following priority order (highest to lowest):
 * 1. Message variables (from latest to earliest floor)
 * 2. Local (chat) variables
 * 3. Global variables
 * 
 * @note: Excludes variables from current/subsequent floors during message processing
 *        Conflict resolution: Merge if both types are [] or {}, otherwise replace
 * @see: https://lodash.com/docs/4.17.15#merge
 * @type {object}
 */
variables = {}

/**
 * SillyTavern.getContext() return value
 * Check console output of SillyTavern.getContext() for full details
 */
SillyTavern = SillyTavern.getContext()

/**
 * Faker library for generating random content
 * Usage: faker.fakerEN, faker.fakerCN, etc.
 * Example: faker.fakerEN.lastName() for random English surname
 * @see: https://fakerjs.dev/api/  
 * @type {object}
 */
faker = require("faker")

/*
 * Lodash utility library
 * Usage: _.get, _.set, etc.
 * Example: _.toArray('abc') returns ['a','b','c']
 * @see: https://lodash.com/docs/4.17.15  
 */
_ = require("lodash")

/*
 * jQuery library
 * Usage: $()
 * Example: $('.mes_text') selects message text elements
 * @see: https://api.jquery.com/  
 */
$ = require("JQuery")

/*
 * Toastr notification library
 * Usage: toastr.info, toastr.error
 * Example: toastr.info('hello world')
 * @see: https://codeseven.github.io/toastr/  
 */
toastr = require("toastr")

/**
 * Template processing phase indicator
 * generate: Content generation phase
 * preparation: Preprocessing phase
 * render: Message rendering phase
 * @type {(String|undefined)}
 */
runType = 'generate' | 'preparation' | 'render'

/*
 * Character card embedded World Info name
 * undefined when unbound
 * @type {(String|undefined)}
 */
charLoreBook = ''

/*
 * User persona bound World Info name
 * undefined when unbound
 * @type {(String|undefined)}
 */
userLoreBook = ''

/*
 * Chat file bound World Info name
 * undefined when unbound
 * @type {(String|undefined)}
 */
chatLoreBook = ''

/*
 * User role name
 * @type {String}
 */
userName = 'User'

/*
 * Character card role name
 * @type {String}
 */
charName = 'SillyTavern System'

/*
 * Chat session ID
 * @type {String}
 */
chatId = ''

/*
 * Character card ID
 * @type {String}
 */
characterId = ''

/*
 * Group chat ID
 * @type {(String|null)}
 */
groupId = null

/*
 * Group chat status information
 * @type {array}
 */
groups = []

/*
 * Character card avatar
 * @type {string}
 */
charAvatar = ""

/*
 * User avatar
 * @type {string}
 */
userAvatar = ""

/*
 * Latest user message ID
 * @type {number}
 */
lastUserMessageId = 0

/*
 * Latest character message ID
 * @type {number}
 */
lastCharMessageId = 0
```

Available only during `render` phase:

```javascript
/**
 * Collection of all variables
 * Variables are merged according to the following priority order (highest to lowest):
 * 1. Message variables (floor numbers from end to start)
 * 2. Local (chat) variables 
 * 3. Global variables
 *
 * @note: When processing message variables, this value excludes current and subsequent floor variables
 *        Conflict resolution: If both values are of type [] or {}, they are merged; otherwise, higher priority replaces lower
 * @see: https://lodash.com/docs/4.17.15#merge
 * @type {object}
 */
variables = {}

/**
 * Content returned by SillyTavern.getContext() in the Tavern
 * Detailed content can be viewed by entering SillyTavern.getContext() in the console
 */
SillyTavern = SillyTavern.getContext()

/**
 * Faker library content for generating random data
 * Usage: faker.fakerEN, faker.fakerCN, etc.
 * Example: faker.fakerEN.lastName() gets a random English surname
 * @see:  https://fakerjs.dev/api/ 
 * @type {object}
 */
faker = require("faker")

/*
 * Lodash library
 * Usage: _.get, _.set, etc.
 * Example: _.toArray('abc') outputs ['a','b','c']
 * @see: https://lodash.com/docs/4.17.15 
 */
_ = require("lodash")

/*
 * JQuery library 
 * Usage: $()
 * Example: $('.mes_text') gets text box
 * @see: https://api.jquery.com/ 
 */
$ = require("JQuery")

/*
 * Toastr library
 * Usage: toastr.info, toastr.error
 * Example: toastr.info('hello world')
 * @see: https://codeseven.github.io/toastr/ 
 */
toastr = require("toastr")

/**
 * Template calculation phase
 * generate: Generation phase
 * preparation: Preparation phase 
 * render: Rendering (message floor) phase
 * @type {(String|undefined)}
 */
runType = 'generate' | 'preparation' | 'render'

/*
 * Character card embedded world book name
 * Undefined when not bound
 * @type {(String|undefined)}
 */
charaLoreBook = ''

/*
 * User character bound world book name
 * Undefined when not bound
 * @type {(String|undefined)}
 */
personaLoreBook = ''

/*
 * Chat file bound world book name
 * Undefined when not bound
 * @type {(String|undefined)}
 */
chatLoreBook = ''

/*
 * User character name
 * @type {String}
 */
userName = 'User'

/*
 * Character card character name
 * @type {String}
 */
assistantName = 'SillyTavern System'
charName = 'SillyTavern System'

/*
 * Chat session ID
 * @type {String}
 */
chatId = ''

/*
 * Character card ID
 * @type {String}
 */
characterId = ''

/*
 * Group chat ID
 * @type {(String|null)}
 */
groupId = null

/*
 * Group chat status information
 * @type {array}
 */
groups = []

/*
 * Character card avatar
 * @type {string}
 */
charAvatar = ""

/*
 * User avatar
 * @type {string}
 */
userAvatar = ""
```

---

# Special Variables

> These variables should not be modified manually

After prompt processing completes, the following global variables will be set:

```javascript
/*
 * Number of processed input tokens from last generation
 * @note Actual amount billed for input
 */
LAST_SEND_TOKENS = 0

/*
 * Number of input characters from last generation
 */
LAST_SEND_CHARS = 0

/*
 * Number of processed output tokens from last generation
 * @note This may not match the actual billed amount
 */
LAST_RECEIVE_TOKENS = 0

/*
 * Number of output characters from last generation
 */
LAST_RECEIVE_CHARS = 0
```

---

# STscript Commands

## /ejs

```
/ejs [ctx=object]? [block=boolean]? code
```

Executes `ejs` code.

Named parameters:

- `ctx` Execution context (input parameters). Example: `ctx={ a: 1, b: 2 }` allows accessing values in the code: `a's value: <%= a %>, b's value: <%= b %>`

- `block` Whether to treat the input as a complete code block. If `true`, automatically wraps the `code` parameter with ` <%= ... %> ` delimiters. Example: When `block=true`, `variables.a` becomes `<%= variables.a %>`

Unnamed parameter:

- `code` The actual code content.

### Examples

```
// Outputs "hello world"
/ejs <%= hello world %>

// Outputs a=1
/ejs ctx="{ a : 1 }" "a=<%= a %>"

// Outputs b=2
/ejs ctx="{ b : 2 }" "`b=${b}`"
```

---

## /ejs-refresh

Re-reads all world books and reprocesses them.

> Generally not required, as modifications to world books automatically trigger reloading and processing.

---

# Exported Functions

Functions exported by the extension, accessible in other extensions

These functions reside within the `globalThis.EjsTemplate` scope

```javascript
/**
 * Process text using template syntax
 * @note data is usually obtained from prepareContext. To modify, directly edit the original object.
 *
 * @param {string} code - Template code
 * @param {object} [context={}] - Execution context/environment
 * @param {Object} [options={}] - EJS parameters
 * @returns {string} Processed content after evaluating the template
 */
async function evalTemplate(code, context = {}, options = {});

/**
 * Create execution context/environment for template processing
 *
 * @param {object} [context={}] - Additional execution context
 * @param {last_message_id} [number=65535] - Maximum ID for merging message variables
 * @returns {object} Execution context/environment
 */
async function prepareContext(context = {}, last_message_id = 65535);

/**
 * Check template for syntax errors
 * Does not execute the template
 *
 * @param {string} content - Template code
 * @param {number} [max_lines=4] - Number of lines to show around errors
 * @returns {string} Syntax error details, empty string if no errors
 */
async function getSyntaxErrorInfo(code, max_lines = 4);

/**
 * @typedef {Object} EjsSettings
 * @property {boolean} enabled - Whether the extension is enabled
 * @property {boolean} generate_enabled - Process generation content
 * @property {boolean} generate_loader_enabled - Inject [GENERATE] worldbook entries during generation
 * @property {boolean} render_enabled - Process message floor content
 * @property {boolean} render_loader_enabled - Inject [RENDER] worldbook entries during floor rendering
 * @property {boolean} with_context_disabled - Disable with() statement blocks
 * @property {boolean} debug_enabled - Show detailed console information
 * @property {boolean} autosave_enabled - Auto-save variable updates
 * @property {boolean} preload_worldinfo_enabled - Preload worldbook immediately
 * @property {boolean} code_blocks_enabled - Process code blocks
 * @property {boolean} worldactive_enabled - Process during fictional generation
 * @property {boolean} raw_message_evaluation_enabled - Process raw message content
 * @property {boolean} filter_message_enabled - Skip floor message processing during generation
 * @property {number} cache_enabled - Caching (experimental) (0=Contextual, 1=All, 2=Worldbook only)
 * @property {number} cache_size - Cache size limit
 * @property {string} cache_hasher - Cache hashing function (h32ToString, h64ToString)
 * @property {boolean} inject_loader_enabled - Inject @INJECT worldbook entries during generation
 */

/**
 * Modify extension settings (enable/disable features) externally
 *
 * @param {EjsSettings} features - Feature settings
 */
function setFeatures(features = {});

/**
 * Get the variables object
 *
 * @param {number} end - End floor number
 * @returns {object} Variables object
 */
function allVariables(end = Infinity);

/**
 * Reset all settings to default values
 */
function resetFeatures();

/**
 * Reload all worldbook entries and reprocess
 */
async function refreshWorldInfo();

/*
 * Global variables/functions created via define
 */
defines = {};

/*
 * Save modified variables
 * Required if setvar was called
 * @see evalTemplate
*/
async function saveVariables();

/**
 * A lenient JSON parser that can recover from common LLM output formatting errors.
 *
 * @see JSON.parse
 * @param {string} text - JSON-like string to parse.
 * @returns {(object|array|string|null|number|boolean)} - Parsed value.
 */
function parseJSON(text);

/**
 * A single JSON Patch operation as defined in RFC 6902.
 * @typedef {Object} JsonPatchOperation
 * @property {('add'|'remove'|'replace'|'move'|'copy'|'test')} op - The operation to perform.
 * @property {string} path - A JSON Pointer (RFC 6901) to the target location.
 * @property {any} [value] - The value to add, replace, or test (required for 'add', 'replace', 'test').
 * @property {string} [from] - A JSON Pointer to the source location (required for 'move' and 'copy').
 * @see {@link https://www.rfc-editor.org/rfc/rfc6902|RFC 6902}
 */

/**
 * A JSON Patch document: an array of patch operations.
 * @typedef {JsonPatchOperation[]} JsonPatchDocument
 */

/**
 * Applies a JSON Patch (RFC 6902) to an object and returns a new modified object.
 * Does **not** mutate the original object.
 * @see https://www.rfc-editor.org/rfc/rfc6902
 *
 * @param {object} dest - Target object to patch.
 * @param {JsonPatchDocument} change - Array of JSON Patch operations.
 * @returns {object} - New patched object.
 */
function jsonPatch(dest, change);
```

> Access via `globalThis.EjsTemplate` (e.g., `EjsTemplate.evalTemplate`)
>
> To modify prepared `context` in `evalTemplate`, modify the original object instead of passing new instances
>
> ❌ Incorrect usage:
>
> ```javascript
> const env = await prepareContext();
> await evalTemplate('a is <%= a %>', { ...env, a: 1 });
> ```
>
> ✅ Correct usage:
>
> ```javascript
> const env = await prepareContext();
> // Use lodash.merge to modify in-place
> await evalTemplate('a is <%= a %>', _.merge(env, { a: 1 }));
> ```
>
> Or set values directly during context preparation:
>
> ```javascript
> const env = await prepareContext({ a: 1 });
> await evalTemplate('a is <%= a %>', env);
> ```

---

# Notes

1.  Both the preparation phase and the generation phase trigger world book calculations.
2.  The rendering phase does not trigger world book calculations.
3.  After `define` is executed, it remains valid until the page is refreshed or closed, but be mindful of the impact of the outer closure.