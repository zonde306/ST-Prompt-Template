# Built-in Functions

```javascript
/**
 * Message Selection Filter
 * @interface MessageFilter
 * @property {('system' | 'user' | 'assistant' | 'any')} [role='assistant'] - Select the specified role.
 *       Can be 'system', 'user', 'assistant', or 'any'. Searches from the end. This item becomes invalid if id is set.
 * @property {number} [id=null] - Selects the specified message floor ID, can be negative (negative numbers start from the end).
 * @property {number} [swipe_id=null] - Selects the swipe ID of the specified message.
 */

/**
 * Set Variable Options
 * @typedef {Object} SetVarOption
 * @property {number} [index=null] - The variable index, same as the index in /setvar.
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} [scope='message'] - Variable type (scope), see below for details.
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Set condition, does not set if condition is not met, see details below.
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - Return value type, see details below.
 * @property {MessageFilter} [withMsg=null] - Message filter (if setting a message variable).
 * @property {boolean} [merge=false] - Whether to use merge to set the variable (_.merge).
 * @property {boolean} [dryRun=false] - Whether to allow setting variables during the preparation phase.
 * @property {boolean} [noCache=false] - Disable cache (e.g., reading immediately after setting a variable).
 */

/**
 * @typedef {('nx'|'xx'|'n'|'nxs'|'xxs')} FlagOption
 * @description Variable setting rules: nx=set only if not exists, xx=set only if exists, n=force set, etc.
 */

/**
 * @typedef {('global'|'local'|'message'|'cache'|'initial')} ScopeOption
 * @description Variable scope.
 */

/**
 * @typedef {('old'|'new'|'fullcache')} ResultOption
 * @description Return value type.
 */

/**
 * @typedef {boolean} DryRun
 * @description Force set variable.
 */

/**
 * @typedef {(FlagOption|ScopeOption|ResultOption|DryRun)} SimpleOptions
 * @description Shortcut options, supports shorthand for flags / scope / results / dryRun.
 */

/**
 * Set variable
 * 
 * @examples
 *    setvar('a', 1);
 *    setvar('a', 1, 'nx');
 *    setvar('a', 1, { flags: 'nx' });
 *    setvar('a', 1, { scope: 'global' });
 *    setvar('a', 1, { scope: 'global', flags: 'nx' });
 *
 * @param {(string|null)} key - Variable name, implemented based on lodash's _.get. null means replace the entire variable tree.
 * @param {any} value - Variable value.
 * @param {(SetVarOption|SimpleOptions)} [options={}] - Set variable options.
 * 
 * @returns Success is determined by options.results, returns undefined on failure.
 */
function setvar(key, value, options = {});
// Aliases for specific options.scope
function setLocalVar(key, value, options = {});
function setGlobalVar(key, value, options = {});
function setMessageVar(key, value, options = {});


/**
 * Get Variable Options
 * @typedef {Object} GetVarOption
 * @property {number} [index=null] - The variable index, same as the index in /getvar.
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} [scope='cache'] - Variable type (scope), see details below.
 * @property {any} [defaults=undefined] - Default value (returned when the variable does not exist).
 * @property {MessageFilter} [withMsg=undefined] - Message selection filter.
 * @property {boolean} [noCache=false] - Disable cache (e.g., reading immediately after setting a variable).
 * @property {boolean} [clone=false] - Return a deep copy of the object (otherwise returns a reference).
 */

/**
 * Read Variable
 * @note: You should avoid modifying object references.
 * 
 * @examples
 *    getvar('a');
 *    getvar('a', 'nx');
 *    getvar('a', { flags: 'nx' });
 *    getvar('a', { scope: 'global' });
 *    getvar('a', { scope: 'global', defaults: 0 });
 *
 * @param {(string|null)} key - Variable name, implemented based on lodash's _.get. null means get the entire variable tree.
 * @param {(GetVarOption|SimpleOptions)} [options={}] - Get variable options.
 * @returns {any} - Variable value, returns options.defaults value if not found (default is undefined).
 */
function getvar(key, options = {});
// Aliases for specific options.scope
function getLocalVar(key, options = {});
function getGlobalVar(key, options = {});
function getMessageVar(key, options = {});

/**
 * Update Variable Options
 * @typedef {Object} GetSetVarOption
 * @property {number} [index=null] - The variable index, same as the index in /getvar.
 * @property {unknown} [defaults=0] - Default value used when the variable does not exist.
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} [inscope='cache'] - The variable type (scope) to read from, see details below.
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} outscope='message'] - The variable type (scope) to set to, see details below.
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Update condition, does not update if condition is not met, see details below.
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - Return value type, see details below.
 * @property {MessageFilter} [withMsg=undefined] - Message filter (if setting a message variable).
 * @property {boolean} [dryRun=false] - Whether to allow updating variables during the preparation phase.
 * @property {boolean} [noCache=false] - Disable cache (e.g., reading immediately after setting a variable).
 * @property {number} [min=null] - Minimum value.
 * @property {number} [max=null] - Maximum value.
 */

/**
 * Increment variable value
 * 
 * @examples
 *    incvar('a');
 *    incvar('a', 1, { defaults: 1 });
 *
 * @param {string} key - Variable name, implemented based on lodash's _.get.
 * @param {number} [value=1] - Value to increment by.
 * @param {(GetSetVarOption|SimpleOptions)} [options={}] - Update variable options.
 * @returns Determined by options.results, returns undefined on failure.
 */
function incvar(key, value = 1, options = {});
// Aliases for specific options.outscope
function incLocalVar(key, value = 1, options = {});
function incGlobalVar(key, value = 1, options = {});
function incMessageVar(key, value = 1, options = {});

/**
 * Decrement variable value
 * 
 * @examples
 *    decvar('a.b');
 *    decvar('a.b', 1, { defaults: 1 });
 *
 * @param {string} key - Variable name, implemented based on lodash's _.get.
 * @param {number} [value=1] - Value to decrement by.
 * @param {(GetSetVarOption|SimpleOptions)} [options={}] - Update variable options.
 * @returns Determined by options.results, returns undefined on failure.
 */
function decvar(key, value = 1, options = {});
// Aliases for specific options.outscope
function decLocalVar(key, value = 1, options = {});
function decGlobalVar(key, value = 1, options = {});
function decMessageVar(key, value = 1, options = {});

/**
 * Execute SillyTavern commands, e.g., /setvar
 *
 * @param {string} cmd - Command.
 * @returns {Promise<string>} - Command return value.
 */
async function execute(cmd);

/**
 * Read World Book entry content
 *
 * @param {string} lorebook - World Book name (empty string/not passed for the current character card's primary World Book).
 * @param {string | RegExp | number} title - Entry uid/title.
 * @param {Record<string, any>} [data={}] - Data to pass.
 * @returns {Promise<string>} - Content of the World Book entry, returns empty string on failure.
 */
async function getwi(lorebook, title, data = {});
async function getWorldInfo(lorebook, title, data = {});
async function getwi(title, data = {});
async function getWorldInfo(title, data = {});

/**
 * Read character card definition
 *
 * @param {string | RegExp | number} [name=this_chid] - Character card name/ID.
 * @param {string} [template=DEFAULT_CHAR_DEFINE] - Output format.
 * @param {Object} [data={}] - Data to pass.
 * @returns {Promise<string>} - Character card definition content, returns empty string on failure.
 */
async function getchar(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});
async function getChara(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});

/**
 * Read preset prompt content
 *
 * @param {string | RegExp} name - Prompt name.
 * @param {Object} [data={}] - Data to pass.
 * @returns {Promise<string>} - Preset prompt content, returns empty string on failure.
 */
async function getpreset(name, data = {});
async function getPresetPrompt(name, data = {});

/**
 * Define global variable/function
 * @note Generally used for pre-definition within World Books, then called during rendering.
 *
 * @param {string} name - Variable/Function name.
 * @param {any} value - Variable/Function content.
 * @param {boolean} [merge=false] - Whether to use merge for definition (_.merge), attempts to merge if already exists, otherwise overwrites.
 * 
 * @note When defining a function, use this to access the context, e.g.: this.variables, this.getvar, this.setvar.
 */
function define(name, value, merge = false);

/**
 * Read Quick Reply content
 * Can only read from enabled Quick Reply sets.
 *
 * @param {string | RegExp} name - Quick Reply set name.
 * @param {string | RegExp} label - Quick Reply entry name.
 * @param {Object} [data={}] - Data to pass.
 * @returns {string} - Quick Reply content, returns empty string on failure.
 */
async function getqr(name, label, data = {});
async function getQuickReply(name, label, data = {});

/**
 * Read character card data
 * @note Returned data is not processed by templates.
 *
 * @param {string | RegExp | number} [name=this_chid] - Character card name/ID.
 * @returns {Promise<v1CharData | null>} - Character card data, returns null on failure.
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
 * Read World Book data
 * @note Returned data is not processed by templates.
 *
 * @param {string} name - World Book name/uid.
 * @returns {Promise<WorldInfoData[]>} - List of World Book entries, returns empty array on failure.
 */
async function getWorldInfoData(name);

/**
 * Read Quick Reply data
 * @note Returned data is not processed by templates.
 *
 * @param {string | RegExp} name - World Book name/uid.
 * @returns {QuickReplySetLink | null} - World Book data, returns null on failure.
 */
function getQuickReplyData(name);

/**
 * Read World Book data, containing only activated parts.
 * @note Returned data is not processed by templates.
 *
 * @param {string} name - World Book name/uid.
 * @param {(string|string[])} keyword - Keyword(s) (content) used to activate the World Book.
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation condition.
 * @returns {Promise<WorldInfoData[]>} - List of World Book entries, returns empty array on failure.
 */
async function getWorldInfoActivatedData(name, keyword, condition = {});

/**
 * Process string content with templates.
 *
 * @param {string} content - The string content to process.
 * @param {Object} [data={}] - Data to pass.
 * @param {Object} [options={}] - ejs parameters.
 * 
 * @errors Code execution exceptions are thrown as-is.
 * 
 * @returns {Promise<string>} - Processed string content.
 */
async function evalTemplate(content, data = {}, options = {});

/**
 * Get all entries from all World Books that might be used.
 * @note Even disabled entries are returned.
 *
 * @param {boolean} chara - Whether to include character-embedded knowledge books.
 * @param {boolean} global - Whether to include globally enabled World/Knowledge Books.
 * @param {boolean} persona - Whether to include user persona's World Books.
 * @param {boolean} charaExtra - Whether to include character card attached Knowledge Books.
 * @param {boolean} onlyExisting - Only include existing World/Knowledge Books.
 * @returns {Promise<WorldInfoData[]>} - List of World Book entries, returns empty array on failure.
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true, onlyExisting = true);

/**
 * Output one or more strings.
 * @note Cannot be used within <%- or <%= statement blocks.
 *
 * @param {string} args - String content.
 */
function print(...args);

/**
 * Activate World Book entry.
 *
 * @param {string} lorebook - World Book name.
 * @param {string | RegExp | number} title - Entry uid/title.
 * @param {boolean} [force=false] - Force activate World Book.
 * @returns {Promise<WorldInfoData | null>} - The activated World Book entry, returns null if entry is not found.
 */
async function activewi(lorebook, title, force = false);
async function activateWorldInfo(lorebook, title, force = false);
async function activewi(title, force = false);
async function activateWorldInfo(title, force = false);

/**
 * Activate World Book condition.
 * null means no restriction.
 * @typedef {Object} ActivateWorldInfoCondition
 * @property {boolean | null} [constant=null] - Restrict to entries that must be/not be Permanent 🔵.
 * @property {boolean | null} [disabled=null] - Restrict to entries that must be/not be Disabled.
 * @property {boolean | null} [vectorized=null] - Restrict to entries that must be/not be 🔗Vectorized.
 */

/**
 * Activate World Book.
 * Activate via keywords.
 *
 * @param {string} worldinfo - World Book name.
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation options.
 * @returns {Promise<WorldInfoData[]>} - List of activated World Book entries, returns empty array if no entries found.
 */
async function activateWorldInfoByKeywords(keywords, condition = {});

/**
 * Get the collection of all entries from currently opened World Books.
 *
 * @param {boolean} chara - Whether to include the character card's built-in World Book.
 * @param {boolean} global - Whether to include globally enabled World Books.
 * @param {boolean} persona - Whether to include user persona bound World Books.
 * @param {boolean} persona - Whether to include character card's attached World Books.
 * @param {boolean} onlyExisting - Only include existing World/Knowledge Books.
 * @returns {Promise<WorldInfoData[]>} - List of World Book entries, returns empty array on failure.
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true, onlyExisting = true);

/**
 * Filter activated entries from a list of World Book entries.
 *
 * @param {WorldInfoData[]} entries - List of World Book entries.
 * @param {string | string[]} keywords - Content used for activation.
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation condition.
 * @returns {WorldInfoData[]} - List of activated World Book entries, returns empty array if no entries found.
 */
function selectActivatedEntries(entries, keywords, condition = {});

/**
 * Get specified chat (floor) message content.
 *
 * @param {number} idx - Chat (floor) message ID.
 * @param {'user' | 'assistant' | 'system' | undefined} role - Only select messages of the specified role, no filter if not provided.
 * @returns {string} - Chat (floor) message content, returns empty string on failure.
 */
function getChatMessage(idx, role = undefined);

/**
 * Get a list of chat (floor) message contents within a specified range.
 *
 * @param {number} count - Number of chat (floor) messages.
 * @param {'user' | 'assistant' | 'system'} role - Only select messages of the specified role.
 * @param {number} start - Chat (floor) message starting position ID.
 * @param {number} end - Chat (floor) message ending position ID.
 * @returns {string[]} - List of chat (floor) message contents, returns empty array on failure.
 */
function getChatMessages(count);
function getChatMessages(count, role);
function getChatMessages(start, end);
function getChatMessages(start, end, role);

/**
 * Regular Expression Options
 * Execution order: Start generation -> basic -> generate -> Process Template -> LLM Response -> message -> Process Template -> Render floor message.
 * Regexes injected in basic mode are automatically deleted after prompt processing is complete.
 *
 * @typedef {Object} RegexOptions
 * @property {string} [uuid=undefined] - Unique ID, modify if same, create if different.
 * @property {number} [minDepth=NaN] - Minimum depth.
 * @property {number} [maxDepth=NaN] - Maximum depth.
 * @property {boolean} [user=true] - Effective on user input.
 * @property {boolean} [assistant=true] - Effective on AI output.
 * @property {boolean} [worldinfo=false] - Effective on World Info.
 * @property {boolean} [reasoning=false] - Effective on reasoning.
 * @property {boolean} [message=false] - Apply regex to floor messages (extended implementation, supports replacement functions).
 * @property {boolean} [generate=false] - Apply regex to generated messages (extended implementation, supports replacement functions).
 * @property {boolean} [basic=true] - Use Tavern's built-in regex (Tavern implementation, does not support replacement functions).
 * @property {number} [order=100] - Execution order, ascending.
 * @property {boolean} [before=true] - Allow processing of original floor messages, requires the message item to be enabled.
 * @property {boolean} [html=false] - Allow processing of floor message HTML, requires the message item to be enabled.
 * @property {number} [sticky=0] - Sticky.
 */

/**
 * Create a temporary regular expression during generation to process chat message content.
 *
 * @param {string | RegExp} pattern - Regular expression.
 * @param {string | ((substring: string, ...args: any[]) => string) } replace - Replacement content/replacement function.
 * @param {RegexOptions} opts - Options.
 */
function activateRegex(pattern, string, opts = {});

/**
 * Add prompt injection.
 * Functionality similar to World Book, but manually activated and placed.
 *
 * @param {string} key - Injection key (group).
 * @param {string} prompt - Prompt content.
 * @param {number} [order=100] - Order.
 * @param {number} [sticky=0] - Stickiness.
 * @param {string} [uid=''] - Unique ID.
 */
function injectPrompt(key, prompt, order = 100, sticky = 0, uid = '');

/**
 * Content Processor
 * @typedef {Object} PostProcess
 * @property {(string|RegExp)} search - Content to search for.
 * @property {string} replace - Content to replace with.
 */

/**
 * Read prompt injection.
 *
 * @param {string} key - Injection key (group).
 * @param {PostProcess[]} [postprocess=[]] - Content processing.
 * @returns {string} - Injected prompt content.
 */
function getPromptsInjected(key, postprocess = []);

/**
 * Check if prompt injection exists.
 *
 * @param {string} key - Injection key (group).
 * @returns {boolean} - Whether the prompt injection exists.
 */
function hasPromptsInjected(key);

/**
 * @interface GetChatMessageOptions
 * @property {number} [start=-2] - Start position.
 * @property {number} [end=null] - End position.
 * @property {'user'|'assistant'|'system'} [role=null] - Select only specified role.
 * @property {boolean} [and] - Valid when pattern is an array, whether complete match is required, otherwise matches any one.
 */

/**
 * Find if specified content exists in floor messages.
 * @see getChatMessages
 * 
 * @param {string|RegExp|(string|RegExp)[]} pattern - Search keyword.
 *   - Single string: string search.
 *   - Single regex: regex search.
 *   - Array: based on options.and, determines whether to match one or match all.
 * @param {GetChatMessageOptions} [options={}] - Options.
 * @returns {boolean} Returns true if a match is found, otherwise false.
 */
function matchChatMessages(pattern, options = {});

/*
 * A more lenient JSON Parser implementation, capable of parsing malformed JSON strings output by LLMs to some extent.
 * 
 * @see JSON.parse
 *
 * @param {string} text - The JSON string to parse.
 * @returns {(object|array|string|null|number|boolean)} - Parsing result.
*/
function parseJSON(text);

/*
 * Apply JSON Patch modifications to dest, returns the modified dest.
 * Does not modify dest in place, but returns a new object.
 * @see https://www.rfc-editor.org/rfc/rfc6902
 *
 * @param {object} dest - The object to be modified.
 * @param {object[]} change - JSON Patch operation list.
 * @returns {object} - The modified object.
*/
function jsonPatch(dest, change);

/*
 * Apply JSON Patch modifications to variables.
 * @see jsonPatch
 * @see setvar
 *
 * @param {(string|null)} key - The variable to modify, null means modify the entire variable tree.
 * @param {object[]} change - JSON Patch operation list.
 * @param {SetVarOption} [options={}] - Parameters passed for modifying variables.
 * @returns Return value is determined by options.
*/
function patchVariables(key, change, options = {});

/**
 * Delete variable
 * If the variable corresponding to the key is an object/array, delete the property/value corresponding to the index.
 * If the variable corresponding to the key is a string, delete the substring at the index.
 * If index is provided but does not exist, does nothing and does not throw an exception.
 * 
 * @param {string} key - Variable name.
 * @param {string|number} [index=undefined] - Index, if unspecified, deletes the entire corresponding variable.
 * @param {SetVarOption} [options={}] - Options for setting the variable.
 * @returns Determined by options.results, returns undefined on failure.
 */
function delvar(key, index = undefined, options = {});

// Corresponding specialized versions
function delLocalVar(key, index = undefined, options = {});
function delGlobalVar(key, index = undefined, options = {});
function delMessageVar(key, index = undefined, options = {});

/**
 * Insert element into variable
 * If the variable corresponding to the key is an object, use index as the object's key and set value into it.
 * If the variable corresponding to the key is an array, insert value at the index position.
 * If the variable corresponding to the key is a string, insert value at the index position.
 * For other types or if index does not exist, does nothing and does not throw an exception.
 * 
 * @param {string} key - Variable name.
 * @param {any} value - Value to insert.
 * @param {string|number} [index=undefined] - Index, if unspecified, inserts at the end.
 * @param {SetVarOption} [options={}] - Options for setting the variable.
 * @returns Determined by options.results, returns undefined on failure.
 */
function insvar(key, value, index = undefined, options = {});

// Corresponding specialized versions
function insertLocalVar(key, value, index = undefined, options = {});
function insertGlobalVar(key, value, index = undefined, options = {});
function insertMessageVar(key, value, index = undefined, options = {});
```

> `flags` types:
>
> - `nx`: Set when **not exists** (based on `scope=cache`).
>
> - `xx`: Set when **exists**  (based on `scope=cache`).
>
> - `n`: Set directly (no check).
>
> - `nxs`: Set when **not exists** (based on the corresponding `scope`).
>
> - `xxs`: Set when **exists** (based on the corresponding `scope`).
>
> ---
>
> `scope`/`inscope`/`scope` types:
>
> `global`: Global variables (Tavern's `extension_settings.variables.global`).
>
> `local`: Local (chat) variables (Tavern's `chat_metadata.variables`).
>
> `message`: Message variables (extension-added `chat[msg_id].variables[swipe_id]`).
>
> `cache`: Temporary variables (template's `variables`, e.g., `<% variables.variableName %>`).
>
> `initial`: Initial variables, provided by `[InitialVariables]`.
>
> - Temporary variables are **not saved**, they become invalid after generation ends.
> - Regardless of which `scope` is selected, temporary variables will be updated.
>
> ---
>
> `results` types:
>
> `old`: Returns the old value (returns `undefined` if none).
>
> `new`: Returns the new value (i.e., the passed `value`).
>
> `fullcache`: Returns the entire updated cache `variables` content.
>
> ---
>
> `dryRun`:
>
> The Tavern performs World Book/Preset/Character Card calculations multiple times during the preparation phase. Allowing variable setting during the preparation phase will cause variables to be set multiple times.
>
> Unless there is a special requirement, there is no need to set it to `true`.
>
> **Updating floor messages is not considered part of the preparation phase.**
>
> ---
>
> `define`:
>
> If defining a function, the following rules must be followed:
>
> - Must use the `function` statement to define, e.g., `define('myfunc', function() { ... })`.
> - Access `getvar`, `setvar` and other variables and properties must use `this`, e.g., `this.getvar(...)`, `this.setvar(...)`.
> - ~~It is not recommended to directly use `variables`, as it will not be updated within the function (e.g., after calling `setvar`), instead use `this.getvar(...)`.~~
>
> ---
>
> `noCache`:
>
> After setting a variable, if you need to immediately access the new value, you need to disable the cache (`noCache=true`).
>
> The cache is not updated immediately, it only loads at the beginning and does not update midway.
>
> ---
>
> `getwi`, `getWorldInfo`:
>
> During recursive imports, `worldinfo` can automatically infer the current World Book name, just pass an empty value.
>
> Recursion only includes `getwi` and `getWorldInfo`, those activated by the Tavern itself are not included.
>
> Example:
>
> `Test World Book`: `Test Entry 1`
>
> ```javascript
> // When activated by Tavern, worldinfo must be provided.
> <%- await getwi('Test World Book', 'Test Entry 2') -%>
> ```
>
> `Test World Book`: `Test Entry 2`
>
> ```javascript
> // If worldinfo is not provided, it is automatically inferred.
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
// Default character card definition output format.
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

> `name`: Character name.
>
> `system_prompt`: Prompt override.
>
> `personality`: Character setting summary.
>
> `description`: Character description.
>
> `scenario`: Scenario.
>
> `first_message`: First message.
>
> `message_example`: Dialogue example.
>
> `creatorcomment`: Creator's comment.
>
> `alternate_greetings[]`: List of additional messages.
>
> `depth_prompt`: Character note.

---

# Built-in Constants

These are global constants, accessible via `<% xxx %>`.

```javascript
/**
 * Collection of all variables.
 * Variables are merged in the following order (priority), higher priority overrides variables of the same name with lower priority:
 * 1. Message variables (floor number from end to beginning).
 * 2. Local (chat) variables.
 * 3. Global variables.
 * 
 * @note: When processing floor message variables, this value does not include the current and subsequent floor variables.
 *        Conflict handling: If types are both [] or {} they are merged, otherwise replaced.
 * @see: https://lodash.com/docs/4.17.15#merge
 * @type {object}
 */
variables = {}

/**
 * Content returned by SillyTavern.getContext().
 * Detailed content can be viewed by typing SillyTavern.getContext() in the console.
 */
SillyTavern = SillyTavern.getContext()

/**
 * Contents of the faker library, for generating random content.
 * Usage: faker.fakerEN, faker.fakerCN, etc.
 * Example: faker.fakerEN.lastName() gets a random English last name.
 * @see: https://fakerjs.dev/api/
 * @type {object}
 */
faker = require("faker")

/*
 * Lodash library.
 * Usage: _.get, _.set, etc.
 * Example: _.toArray('abc') outputs ['a','b','c'].
 * @see: https://lodash.com/docs/4.17.15
 */
_ = require("lodash")

/*
 * JQuery library.
 * Usage: $()
 * Example: $('.mes_text') gets the text box.
 * @see: https://api.jquery.com/
 */
$ = require("JQuery")

/*
 * toastr library.
 * Usage: toastr.info, toastr.error.
 * Example: toastr.info('hello world').
 * @see: https://codeseven.github.io/toastr/
 */
toastr = require("toastr")

/**
 * Phase during template calculation.
 * generate: Generation phase.
 * preparation: Preparation phase.
 * render: Rendering (floor message) phase.
 * render_permanent: Special case of rendering (floor message), this phase permanently modifies messages.
 * @type {(String|undefined)}
 */
runType = 'generate' | 'preparation' | 'render' | 'render_permanent'

/*
 * Character card embedded World Book name.
 * undefined when not bound.
 * @type {(String|undefined)}
 */
charLoreBook = ''

/*
 * User persona bound World Book name.
 * undefined when not bound.
 * @type {(String|undefined)}
 */
userLoreBook = ''

/*
 * Chat file bound World Book name.
 * undefined when not bound.
 * @type {(String|undefined)}
 */
chatLoreBook = ''

/*
 * User persona name.
 * @type {String}
 */
userName = 'User'

/*
 * Character card character name.
 * @type {String}
 */
charName = 'SillyTavern System'

/*
 * Chat session ID.
 * @note The chat file name, without .json suffix.
 * @type {String}
 */
chatId = ''

/*
 * Character card ID.
 * @type {String}
 */
characterId = ''

/*
 * Group chat ID.
 * @type {(String|null)}
 */
groupId = null

/*
 * Group chat status information.
 * @type {array}
 */
groups = []

/*
 * Character card avatar URL.
 * @type {string}
 */
charAvatar = ""

/*
 * User avatar URL.
 * @type {string}
 */
userAvatar = ""

/*
 * Latest user message ID.
 * @note i.e., floor ID.
 * @type {number}
 */
lastUserMessageId = 0

/*
 * Latest character message ID.
 * @note i.e., floor ID.
 * @type {number}
 */
lastCharMessageId = 0

/*
 * Currently selected model.
 */
model = 'gpt-3.5'

/*
 * Current generation type.
 * Empty string if not generating.
 */
generateType = '' | 'custom' | 'normal' | 'continue' | 'impersonate' | 'regenerate' | 'swipe' | 'quiet';

/*
 * Last user message content.
 * Empty string if none.
 * @type {string}
 */
lastUserMessage = '';

/*
 * Last character message content.
 * Empty string if none.
 * @type {string}
 */
lastCharMessage = '';

/*
 * Last message ID.
 * -1 if none.
 * @type {number}
 */
lastMessageId = 0;
```

Fields that only appear when `runType` is `render`.

```javascript
/*
 * Message ID (i.e., floor number).
 * @type {number}
 */
message_id = 0

/*
 * Message swipe ID.
 * @type {number}
 */
swipe_id = 0

/*
 * Role name corresponding to the message.
 * @type {string}
 */
name = 'User'

/*
 * Whether the message is the last one.
 * @type {boolean}
 */
is_last = false

/*
 * Whether the message is from user.
 * @type {boolean}
 */
is_user = false

/*
 * Whether the message is from system.
 * @type {boolean}
 */
is_system = false
```

Fields that only appear during `@@generate_*`/`[GENERATE:*]`.

```javascript
/*
 * The currently processing World Book entry object.
 * @type {WorldInfoEntry}
 */
world_info: {}

/*
 * The already processed preceding context content.
 * @type {string}
 */
generateBuffer = ''

/*
 * Current generation content.
 * Not processed by templates.
 * @type {({ role: string, content: string })[]}
 */
generateData = [{ role: '', content: '' }]
```

---

# Special Variables

> Variables here should not be modified manually.

The following global variables will be set after prompt processing is complete.

```javascript
/*
 * Input (processed) token count from last generation.
 * @note Actual count used for billing.
 */
LAST_SEND_TOKENS = 0

/*
 * Input (processed) prompt character count from last generation.
 */
LAST_SEND_CHARS = 0

/*
 * Output (processed) token count from last generation.
 * @note Not the actual count used for billing.
 */
LAST_RECEIVE_TOKENS = 0

/*
 * Output (processed) prompt character count from last generation.
 */
LAST_RECEIVE_CHARS = 0
```

---

# STscript Commands

## /ejs

```
/ejs [ctx=object]? [block=boolean]? code
```

Execute `ejs` code.

Named parameters:

- `ctx` Execution context (passed arguments), e.g.: `ctx={ a: 1, b: 2 }` then you can access in code: `Value of a: <%= a %>, Value of b:<%= b %>`.

- `block` Whether to treat as a complete code block. If `true`, automatically wraps the `code` parameter with `<%= ... %>` symbols externally, e.g.: when `block=true`, `variables.a` is treated as `<%= variables.a %>`.

Unnamed parameters:

- `code` is the code content.

### Examples

```
// Output "hello world"
/ejs <%= hello world %>

// Output a=1
/ejs ctx="{ a : 1 }" "a=<%= a %>"

// Output b=2
/ejs ctx="{ b : 2 }" "`b=${b}`"
```

---

## /ejs-refresh

Reload all World Books and re-process them.

> Generally not needed, as modifying World Books will automatically trigger reloading and processing.

---

# Exported Functions

Functions exported by the extension, accessible within other extensions.

These functions are in the `globalThis.EjsTemplate` scope.

```javascript
/**
 * @typedef {Object} IncluderResult
 * @property {string} filename - The final resolved path.
 * @property {string} template - The included content.
 */

/**
 * @typedef {Object} EjsOptions
 * @property {boolean} [cache] - Compiled functions are cached, requires `filename`.
 * @property {string} [filename] - The name of the file being rendered. Not required if you are using renderFile(). Used by cache to key caches, and for includes.
 * @property {string|string[]} [root] - Set template root(s) for includes with an absolute path (e.g, /file.ejs). Can be array to try to resolve include from multiple directories.
 * @property {string[]} [views] - An array of paths to use when resolving includes with relative paths.
 * @property {Record<string, unknown>} [context] - Function execution context.
 * @property {boolean} [compileDebug] - When false no debug instrumentation is compiled.
 * @property {string} [delimiter] - Character to use with angle brackets for open/close.
 * @property {boolean} [client] - When true, compiles a function that can be rendered in the browser without needing to load the EJS Runtime (ejs.min.js).
 * @property {string} [openDelimiter] - Character to use for opening delimiter, by default '<'.
 * @property {string} [closeDelimiter] - Character to use for closing delimiter, by default '>'.
 * @property {boolean} [debug] - Outputs generated function body.
 * @property {boolean} [strict] - When set to true, generated function is in strict mode.
 * @property {boolean} [_with] - Whether or not to use with() {} constructs. If false then the locals will be stored in the locals object. Set to false in strict mode.
 * @property {string[]} [destructuredLocals] - An array of local variables that are always destructured from the locals object, available even in strict mode.
 * @property {string} [localsName] - Name to use for the object storing local variables when not using with Defaults to locals.
 * @property {boolean} [rmWhitespace] - Remove all safe-to-remove whitespace, including leading and trailing whitespace. It also enables a safer version of -%> line slurping for all scriptlet tags (it does not strip new lines of tags in the middle of a line).
 * @property {function(string): string} [escape] - The escaping function used with <%= construct. It is used in rendering and is .toString()ed in the generation of client functions. (By default escapes XML).
 * @property {string} [outputFunctionName] - Set to a string (e.g., 'echo' or 'print') for a function to print output inside scriptlet tags.
 * @property {boolean} [async] - When true, EJS will use an async function for rendering. (Depends on async/await support in the JS runtime).
 * @property {function(string, string): IncluderResult} [includer] - Custom function to handle EJS includes, receives (originalPath, parsedPath) parameters, where originalPath is the path in include as-is and parsedPath is the previously resolved path. Should return an object { filename, template }, you may return only one of the properties, where filename is the final parsed path and template is the included content.
 */

/**
 * @typedef {Object} EvalTemplateOptions
 * @property {function(string): string} [escaper]
 * @property {function(string, string): IncluderResult} [includer]
 * @property {boolean} [logging]
 * @property {string} [when]
 * @property {EjsOptions} [options]
 * @property {string} [disableMarkup]
 * @property {FunctionSandbox|null} [sandbox]
 */

/**
 * Process text with template syntax.
 * @note data is generally obtained from prepareContext. If modification is needed, the original object should be modified directly.
 * @see prepareContext
 * 
 * @errors Code exceptions are thrown as-is.
 *
 * @param {string} code - Template code.
 * @param {object} [context={}] - Execution environment (context).
 * @param {EvalTemplateOptions} [options={}] - ejs parameters.
 * @returns {string} The content after template calculation.
 */
async function evalTemplate(code, context = {}, options = {});

/**
 * Create an execution environment (context) for template syntax processing.
 * @see evalTemplate
 *
 * @param {object} [context={}] - Additional execution environment (context).
 * @param {last_message_id} [number=65535] - Maximum ID for merging message variables.
 * @returns {object} Execution environment (context).
 */
async function prepareContext(context = {}, last_message_id = 65535);

/**
 * Check if the template has syntax errors.
 * Does not actually execute.
 *
 * @param {string} content - Template code.
 * @param {number} [max_lines=4] - Number of nearby lines to output when an error occurs.
 * @returns {string} Syntax error information, returns empty string if no errors.
 */
async function getSyntaxErrorInfo(code, max_lines = 4);

/**
 * @typedef {Object} EjsSettings
 * @property {boolean} enabled - Whether the extension is enabled.
 * @property {boolean} generate_enabled - Process generation content.
 * @property {boolean} generate_loader_enabled - Inject [GENERATE] World Book entry during generation.
 * @property {boolean} render_enabled - Process floor messages.
 * @property {boolean} render_loader_enabled - Inject [RENDER] World Book entry when rendering floors.
 * @property {boolean} with_context_disabled - Disable with statement blocks.
 * @property {boolean} debug_enabled - Show detailed information in console.
 * @property {boolean} autosave_enabled - Automatically save variable updates.
 * @property {boolean} preload_worldinfo_enabled - Load World Books immediately.
 * @property {boolean} code_blocks_enabled - Process code blocks.
 * @property {boolean} raw_message_evaluation_enabled - Process raw message content.
 * @property {boolean} filter_message_enabled - Ignore floor message processing during generation.
 * @property {number} cache_enabled - Cache (experimental) (0=experience, 1=all, 2=World Books only).
 * @property {number} cache_size - Cache size.
 * @property {string} cache_hasher - Cache Hash function (h32ToString, h64ToString).
 * @property {boolean} inject_loader_enabled - Inject @INJECT World Book entry during generation.
 * @property {boolean} invert_enabled - Legacy compatibility mode, GENERATE/RENDER/INJECT entries in World Books that are disabled are treated as enabled.
 * @property {boolean} compile_workers - Whether to enable background compilation (using web workers to compile).
 * @property {boolean} sandbox - Whether to enable sandboxed code execution (performance decrease, increased security).
 */

/**
 * Modify extension settings from outside (enable or disable features).
 *
 * @param {EjsSettings} features - Setting options.
 */
function setFeatures(features = {});

/**
 * Get the variables object.
 *
 * @param {number} end - End floor.
 * @returns {object} Variable object.
 */
function allVariables(end = Infinity);

/**
 * Restore all settings to default state.
 */
function resetFeatures();

/**
 * Reload all World Books and re-process them.
 */
async function refreshWorldInfo();

/*
 * All global variables/functions created via define.
 * @note Returns a reference, meaning it can be modified externally.
*/
defines = {};

/*
 * All initial variables created via InitialVariables.
 * @note Returns a reference.
*/
initialVariables = {};

/*
 * Save modified variables.
 * Must be called if setvar has been called.
 * @see evalTemplate
*/
async function saveVariables();

/*
 * A more lenient JSON Parser implementation, capable of parsing malformed JSON strings output by LLMs to some extent.
 * 
 * @see JSON.parse
 *
 * @param {string} text - The JSON string to parse.
 * @returns {(object|array|string|null|number|boolean)} - Parsing result.
*/
function parseJSON(text);

/*
 * Apply JSON Patch modifications to dest, returns the modified dest.
 * Does not modify dest in place, but returns a new object.
 * @see https://www.rfc-editor.org/rfc/rfc6902
 *
 * @param {object} dest - The object to be modified.
 * @param {object[]} change - JSON Patch operation list.
 * @returns {object} - The modified object.
*/
function jsonPatch(dest, change);

/**
 * Get current extension settings.
 *
 * @returns {EjsSettings} - Current settings.
 */
function getFeatures();

/**
 * Compile code.
 *
 * @param {string} code - Code content.
 * @param {EvalTemplateOptions} [options] - Compilation options.
 *
 * @returns {((data: object) => string)} - Compiled function body.
 */
async function compileTemplate(code, options = {});
```

> These functions can be accessed via `globalThis.EjsTemplate` (e.g., `EjsTemplate.evalTemplate`).
>
> If you need to modify the prepared `context` during `evalTemplate`, you should directly modify the original object, not pass a new object.
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
> // Use lodash's merge to modify in place.
> await evalTemplate('a is <%= a %>', _.merge(env, { a: 1 }));
> ```
>
> Or set directly in `prepareContext`:
>
> ```javascript
> const env = await prepareContext({ a: 1 });
> await evalTemplate('a is <%= a %>', env);
> ```

---

# Remarks

1. Both preparation phase and generation phase trigger World Book calculations.
2. Rendering phase does not trigger World Book calculations.
3. After `define` is executed, it remains effective until the page is refreshed/closed, but be aware of the impact of outer closures.