# Built-in Functions

```javascript
/**
 * Message selection filter
 * @interface MessageFilter
 * @property {('system' | 'user' | 'assistant' | 'any')} [role='assistant'] - Select by role. 
 *      Can be 'system', 'user', 'assistant', or 'any'. Searches from end. Invalid if id is set.
 * @property {number} [id=null] - Select message by floor ID (negative numbers count from end)
 * @property {number} [swipe_id=null] - Select message by swipe ID
 */
/**
 * Variable setting options
 * @typedef {Object} SetVarOption
 * @property {number} [index=null] - Variable index (same as /setvar command)
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='message'] - Variable scope (see below)
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Set conditions (see below)
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - Return type (see below)
 * @property {MessageFilter} [withMsg=null] - Message filter (for message variables)
 * @property {boolean} [merge=false] - Use _.merge to update variables
 * @property {boolean} [dryRun=false] - Allow setting during preparation phase
 * @property {boolean} [noCache=false] - Disable caching (for immediate read after write)
 */
/**
 * Set variable
 *
 * @param {string} key - Variable name
 * @param {any} value - Variable value
 * @param {SetVarOption} [options={}] - Options
 * @returns Success: determined by options.results; Failure: undefined
 */
function setvar(key, value, options = {});
// Scope-specific aliases
function setLocalVar(key, value, options = {});
function setGlobalVar(key, value, options = {});
function setMessageVar(key, value, options = {});
/**
 * Variable getting options
 * @typedef {Object} GetVarOption
 * @property {number} [index=null] - Variable index (same as /getvar command)
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='cache'] - Variable scope (see below)
 * @property {any} [defaults=undefined] - Default value if not found
 * @property {MessageFilter} [withMsg=undefined] - Message filter
 * @property {boolean} [noCache=false] - Disable caching
 */
/**
 * Get variable
 *
 * @param {string} key - Variable name
 * @param {GetVarOption} [options={}] - Options
 * @returns {any} Variable value or default
 */
function getvar(key, options = {});
// Scope-specific aliases
function getLocalVar(key, options = {});
function getGlobalVar(key, options = {});
function getMessageVar(key, options = {});
/**
 * Variable update options
 * @typedef {Object} GetSetVarOption
 * @property {number} [index=null] - Variable index
 * @property {unknown} [defaults=0] - Default value if not exists
 * @property {'global' | 'local' | 'message' | 'cache'} [inscope='cache'] - Read scope
 * @property {'global' | 'local' | 'message' | 'cache'} [outscope='message'] - Write scope
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Update conditions
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - Return type
 * @property {MessageFilter} [withMsg=undefined] - Message filter
 * @property {boolean} [dryRun=false] - Allow during preparation phase
 * @property {boolean} [noCache=false] - Disable caching
 * @property {number} [min=null] - Minimum value
 * @property {number} [max=null] - Maximum value
 */
/**
 * Increment variable
 *
 * @param {string} key - Variable name
 * @param {number} [value=1] - Increment value
 * @param {GetSetVarOption} [options={}] - Options
 * @returns Determined by options.results
 */
function incvar(key, value = 1, options = {});
// Scope-specific aliases
function incLocalVar(key, value = 1, options = {});
function incGlobalVar(key, value = 1, options = {});
function incMessageVar(key, value = 1, options = {});
/**
 * Decrement variable
 *
 * @param {string} key - Variable name
 * @param {number} [value=1] - Decrement value
 * @param {GetSetVarOption} [options={}] - Options
 * @returns Determined by options.results
 */
function decvar(key, value = 1, options = {});
// Scope-specific aliases
function decLocalVar(key, value = 1, options = {});
function decGlobalVar(key, value = 1, options = {});
function decMessageVar(key, value = 1, options = {});
/**
 * Execute command (e.g., /setvar)
 *
 * @param {string} cmd - Command string
 * @returns {Promise<string>} Command output
 */
async function execute(cmd);
/**
 * Get World Info entry content
 *
 * @param {string} worldinfo - World name (empty string for current in recursion)
 * @param {string | RegExp | number} title - Entry UID/title
 * @param {Record<string, any>} [data={}] - Context data
 * @returns {Promise<string>} Entry content
 */
async function getwi(worldinfo, title, data = {});
async function getWorldInfo(worldinfo, title, data = {});
async function getwi(title, data = {});
async function getWorldInfo(title, data = {});
/**
 * Get character definition
 *
 * @param {string | RegExp | number} [name=this_chid] - Character name/ID
 * @param {string} [template=DEFAULT_CHAR_DEFINE] - Output format
 * @param {Object} [data={}] - Context data
 * @returns {Promise<string>} Formatted character definition
 */
async function getchr(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});
async function getChara(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});
/**
 * Get preset prompt content
 *
 * @param {string | RegExp} name - Preset name
 * @param {Object} [data={}] - Context data
 * @returns {Promise<string>} Formatted content
 */
async function getprp(name, data = {});
async function getPresetPrompt(name, data = {});
/**
 * Define global variables/functions
 * For use in World Info predefinitions
 *
 * @param {string} name - Variable/function name
 * @param {any} value - Content (use function(){} for methods)
 * @param {boolean} [merge=false] - Use _.merge for definitions
 */
function define(name, value, merge = false);
/**
 * Get quick reply content
 *
 * @param {string | RegExp} name - Quick reply set name
 * @param {string | RegExp} label - Entry label
 * @param {Object} [data={}] - Context data
 * @returns {string} Formatted content
 */
async function getqr(name, label, data = {});
async function getQuickReply(name, label, data = {});
/**
 * Get raw character data
 *
 * @param {string | RegExp | number} [name=this_chid] - Character name/ID
 * @returns {Promise<v1CharData | null>} Raw character data
 */
async function getCharaData(name = this_chid);
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
 * Get raw World Info data
 *
 * @param {string} name - World name/UID
 * @returns {Promise<WorldInfoData[]>} Entry list
 */
async function getWorldInfoData(name);
/**
 * Get raw quick reply data
 *
 * @param {string | RegExp} name - Set name
 * @returns {QuickReplySetLink | null} Raw data
 */
function getQuickReplyData(name);
/**
 * Get activated World Info entries
 *
 * @param {string} name - World name/UID
 * @param {(string|string[])} keyword - Activation keyword(s)
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation conditions
 * @returns {Promise<WorldInfoData[]>} Filtered entries
 */
async function getWorldInfoActivatedData(name, keyword, condition = {});
/**
 * Process template string
 *
 * @param {string} content - Template content
 * @param {Object} [data={}] - Context data
 * @param {Object} [options={}] - EJS options
 * @returns {Promise<string>} Processed content
 */
async function evalTemplate(content, data = {}, options = {});
/**
 * Get all enabled World Info entries
 *
 * @param {boolean} chara - Include character embedded
 * @param {boolean} global - Include global worlds
 * @param {boolean} persona - Include user persona
 * @param {boolean} charaExtra - Include character extras
 * @returns {Promise<WorldInfoData[]>} All entries
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true);
/**
 * Print output (not in <%= blocks)
 *
 * @param {string} args - Output content
 */
function print(...args);
/**
 * Activate World Info entry
 *
 * @param {string} worldinfo - World name
 * @param {string | RegExp | number} title - Entry UID/title
 * @returns {Promise<WorldInfoData | null>} Activated entry
 */
async function activewi(worldinfo, title);
async function activateWorldInfo(worldinfo, title);
/**
 * Activation conditions for World Info
 * @typedef {Object} ActivateWorldInfoCondition
 * @property {boolean} [withConstant=false] - Allow permanent 🔵 entries
 * @property {boolean} [withDisabled=false] - Allow disabled entries
 * @property {boolean} [onlyDisabled=false] - Only activate disabled entries (forces withDisabled)
 */
/**
 * Activate World Info by keywords
 *
 * @param {string} worldinfo - World name
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation options
 * @returns {Promise<WorldInfoData[]>} Activated entries
 */
async function activateWorldInfoByKeywords(keywords, condition = {});
/**
 * Get all entries from enabled World Info books
 *
 * @param {boolean} chara - Include character embedded World Info
 * @param {boolean} global - Include globally enabled World Info
 * @param {boolean} persona - Include user persona World Info
 * @param {boolean} charaExtra - Include character extra World Info
 * @returns {Promise<WorldInfoData[]>} List of World Info entries
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true);
/**
 * Filter activated entries from World Info list
 *
 * @param {WorldInfoData[]} entries - World Info entry list
 * @param {string | string[]} keywords - Activation content
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation conditions
 * @returns {WorldInfoData[]} Activated entries
 */
function selectActivatedEntries(entries, keywords, condition = {});
/**
 * Get specified chat message content
 *
 * @param {number} idx - Message ID
 * @param {'user' | 'assistant' | 'system' | undefined} role - Filter by role
 * @returns {string} Message content (empty string on failure)
 */
function getChatMessage(idx, role = undefined);
/**
 * Get chat message content list within range
 *
 * @param {number} count - Number of messages
 * @param {'user' | 'assistant' | 'system'} role - Filter by role
 * @param {number} start - Start message ID
 * @param {number} end - End message ID
 * @returns {string[]} Message content list
 */
function getChatMessages(count);
function getChatMessages(count, role);
function getChatMessages(start, end);
function getChatMessages(start, end, role);
/**
 * Regular expression options
 * @typedef {Object} RegexOptions
 * @property {string} [uuid=undefined] - Unique ID (modify if exists, create if not)
 * @property {number} [minDepth=NaN] - Minimum depth
 * @property {number} [maxDepth=NaN] - Maximum depth
 * @property {boolean} [user=true] - Apply to user input
 * @property {boolean} [assistant=true] - Apply to AI output
 * @property {boolean} [worldinfo=false] - Apply to World Info
 * @property {boolean} [reasoning=true] - Apply to reasoning
 */
/**
 * Create temporary regex for message processing
 *
 * @param {string | RegExp} pattern - Regular expression
 * @param {string} replace - Replacement string
 * @param {RegexOptions} opts - Options
 */
function activateRegex(pattern, replace, opts = {});
/**
 * Add prompt injection (manual activation)
 *
 * @param {string} key - Injection key (group)
 * @param {string} prompt - Prompt content
 * @param {number} [order=100] - Priority order
 * @param {number} [sticky=0] - Persistence level
 * @param {string} [uid=''] - Unique ID
 */
function injectPrompt(key, prompt, order = 100, sticky = 0, uid = '');
/**
 * Get injected prompts by key
 *
 * @param {string} key - Injection key (group)
 * @returns {string} Concatenated injected prompt content
 */
function getPromptsInjected(key);
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
 * Collection of all variables
 * Variables are merged in the following order (priority), with higher priority overwriting lower priority variables of the same name:
 * 1. Message variables (floor numbers from end to start)
 * 2. Local (chat) variables
 * 3. Global variables
 * 
 * @note: When processing floor message variables, this value does not include the current and subsequent floor variables.
 *        Conflict handling: If the types are both [] or {}, they are merged; otherwise, they are replaced.
 * @see: https://lodash.com/docs/4.17.15#merge
 */
variables = {}

/**
 * SillyTavern's SillyTavern.getContext() return content
 * Detailed content can be viewed by entering SillyTavern.getContext() in the console.
 */
SillyTavern = SillyTavern.getContext()

/**
 * faker library content, used to generate random content
 * Usage: faker.fakerEN, faker.fakerCN, etc.
 * Example: faker.fakerEN.lastName() to get a random English last name.
 * @see: https://fakerjs.dev/api/
 */
faker = require("faker")

/*
 * Lodash library
 * Usage: _.get, _.set, etc.
 * Example: _.toArray('abc') outputs ['a','b','c'].
 * @see: https://lodash.com/docs/4.17.15
 */
_ = require("lodash")

/*
 * JQuery library
 * Usage: $()
 * Example: $('.mes_text') to get the text box.
 * @see: https://api.jquery.com/
 */
$ = require("JQuery")

/*
 * toastr library
 * Usage: toastr.info, toastr.error
 * Example: toastr.info('hello world')
 * @see: https://codeseven.github.io/toastr/
 */
toastr = require("toastr")

/**
 * Phase during template calculation
 * generate: Generation phase
 * preparation: Preparation phase
 * render: Rendering (floor message) phase
 */
runType = 'generate' | 'preparation' | 'render'
```

Available only during `render` phase:

```javascript
/**
 * Aggregated variables collection
 * Merges variables in the following priority order (highest to lowest):
 * 1. Message variables (from latest to earliest floor)
 * 2. Local (chat) variables
 * 3. Global variables
 * 
 * @note: During message processing, this excludes variables from current/subsequent floors
 *        Conflict resolution: Merge if both types are [] or {}, otherwise replace
 * @see: https://lodash.com/docs/4.17.15 #merge
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
charaLoreBook = ''

/*
 * User persona bound World Info name
 * undefined when unbound
 * @type {(String|undefined)}
 */
personaLoreBook = ''

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
assistantName = 'SillyTavern System'

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

Executes EJS (Embedded JavaScript) code

Named parameters:

- `ctx` Execution context (input parameters). Example: `ctx={ a: 1, b: 2 }` allows accessing `a` and `b` in code like `<%= a %>`
- `block` If true, automatically wraps the code in `<%= ... %>` tags. When `block=true`, `variables.a` becomes `<%= variables.a %>`

Unnamed parameters:

- `code` The actual EJS code content

### Examples

```
// Outputs "hello world"
/ejs <%= "hello world" %>

// Outputs a=1
/ejs ctx="{ a : 1 }" "a=<%= a %>"

// Outputs b=2 using template literals
/ejs ctx="{ b : 2 }" "`b=${b}`"
```

---

# Exported Functions

Functions exported by the extension, accessible in other extensions

These functions reside within the `globalThis.EjsTemplate` scope

```javascript
/**
 * Processes template syntax in text
 * @note Context data is typically obtained from prepareContext. To modify, directly alter the original object
 *
 * @param {string} code - Template code
 * @param {object} [context={}] - Execution context
 * @param {Object} [options={}] - ejs options
 * @returns {string} Processed template content
 */
async function evalTemplate(code, context = {}, options = {});

/**
 * Creates execution context for template processing
 *
 * @param {object} [context={}] - Additional context data
 * @param {number} [last_message_id=65535] - Maximum message ID for merging message variables
 * @returns {object} Prepared execution context
 */
async function prepareContext(context = {}, last_message_id = 65535);

/**
 * Checks for template syntax errors without execution
 *
 * @param {string} content - Template code
 * @param {number} [max_lines=4] - Number of surrounding lines to show for errors
 * @returns {string} Syntax error message, empty if no errors
 */
async function getSyntaxErrorInfo(code, max_lines = 4);

/**
 * @typedef {Object} EjsSettings
 * @property {boolean} enabled - Enable Prompt template
 * @property {boolean} generate_enabled - Generate-time evaluation
 * @property {boolean} generate_loader_enabled - [GENERATE] evaluation
 * @property {boolean} render_enabled - Chat message evaluation
 * @property {boolean} render_loader_enabled - [RENDER] evaluation
 * @property {boolean} strict_enabled - Use strict mode
 * @property {boolean} debug_enabled - Enable debug logging
 * @property {boolean} autosave_enabled - Save variables after updating
 * @property {boolean} preload_worldinfo_enabled - Preload world info
 * @property {boolean} code_blocks_enabled - Evaluate inside a code block
 * @property {boolean} world_active_enabled - Enable activewi to take effect this time
 * @property {boolean} raw_message_evaluation_enabled - Evaluate raw message
 * @property {boolean} filter_message_enabled - Filter chat messages when generating
 * @property {boolean} cache_enabled - Enable cache
 */

/**
 * Turn features on or off
 *
 * @param {EjsSettings} features - setting options
 */
function setFeatures(features = {});
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