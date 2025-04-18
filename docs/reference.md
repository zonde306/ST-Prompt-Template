# Built-in Functions

```javascript
/**
 * Message Selection Filter
 * @interface MessageFilter
 * @property {('system' | 'user' | 'assistant' | 'any')} [role='assistant'] - Select messages by role. 
 *      Can be 'system', 'user', 'assistant', or 'any'. Searches from the end. This is ignored if id is set.
 * @property {number} [id=undefined] - Select message by floor number (negative numbers count from the end)
 * @property {number} [swipe_id=undefined] - Select message by swipe ID
 */

/**
 * Set Variable Options
 * @typedef {Object} SetVarOption
 * @property {number} [index=undefined] - Variable index (same as /setvar's index)
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='message'] - Variable scope, see details below
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Set conditions, see details below
 * @property {'old' | 'new' | 'fullcache'} [results='fullcache'] - Return type, see details below
 * @property {MessageFilter} [withMsg=undefined] - Message filter (for message variables)
 * @property {boolean} [merge=false] - Use _.merge to set variables
 * @property {boolean} [dryRun=false] - Allow setting variables during preparation phase
 * @property {boolean} [noCache=false] - Disable caching (when reading immediately after setting)
 */

/**
 * Set Variable
 *
 * @param {string} key - Variable name
 * @param {any} value - Variable value
 * @param {SetVarOption} [options={}] - Set variable options
 * @returns Returns based on options.results when successful, undefined on failure
 */
function setvar(key, value, options = {});
// Aliases for specific options.scope
function setLocalVar(key, value, options = {});
function setGlobalVar(key, value, options = {});
function setMessageVar(key, value, options = {});


/**
 * Get Variable Options
 * @typedef {Object} GetVarOption
 * @property {number} [index=undefined] - Variable index (same as /getvar's index)
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='cache'] - Variable scope, see details below
 * @property {any} [defaults=undefined] - Default value when not found
 * @property {MessageFilter} [withMsg=undefined] - Message selection filter
 * @property {boolean} [noCache=false] - Disable caching (when reading immediately after setting)
 */

/**
 * Read Variable
 *
 * @param {string} key - Variable name
 * @param {GetVarOption} [options={}] - Get variable options
 * @returns {any} - Variable value, returns options.defaults if not found
 */
function getvar(key, options = {});
// Aliases for specific options.scope
function getLocalVar(key, options = {});
function getGlobalVar(key, options = {});
function getMessageVar(key, options = {});

/**
 * Update Variable Options
 * @typedef {Object} GetSetVarOption
 * @property {number} [index] - Variable index (same as /getvar's index)
 * @property {unknown} [defaults=0] - Default value when variable doesn't exist
 * @property {'global' | 'local' | 'message' | 'cache'} [inscope='cache'] - Read scope, see details below
 * @property {'global' | 'local' | 'message' | 'cache'} [outscope='message'] - Write scope, see details below
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Update conditions, see details below
 * @property {'old' | 'new' | 'fullcache'} [results='fullcache'] - Return type, see details below
 * @property {MessageFilter} [withMsg=undefined] - Message filter (for message variables)
 * @property {boolean} [dryRun=false] - Allow updates during preparation phase
 * @property {boolean} [noCache=false] - Disable caching (when reading immediately after setting)
 * @property {number} [min=null] - Minimum
 * @property {number} [max=null] - Maximum
 */

/**
 * Increment Variable
 *
 * @param {string} key - Variable name
 * @param {number} [value=1] - Increment value
 * @param {GetSetVarOption} [options={}] - Update options
 * @returns Returns based on options.results, undefined on failure
 */
function incvar(key, value = 1, options = {});
// Aliases for specific options.outscope
function incLocalVar(key, value = 1, options = {});
function incGlobalVar(key, value = 1, options = {});
function incMessageVar(key, value = 1, options = {});

/**
 * Decrement Variable
 *
 * @param {string} key - Variable name
 * @param {number} [value=1] - Decrement value
 * @param {GetSetVarOption} [options={}] - Update options
 * @returns Returns based on options.results, undefined on failure
 */
function decvar(key, value = 1, options = {});
// Aliases for specific options.outscope
function decLocalVar(key, value = 1, options = {});
function decGlobalVar(key, value = 1, options = {});
function decMessageVar(key, value = 1, options = {});

/**
 * Execute command like /setvar
 *
 * @param {string} cmd - Command to execute
 * @returns {Promise<string>} - Command output
 */
async function execute(cmd);

/**
 * Read World Book entry content
 *
 * @param {string} worldinfo - World Book name (leave empty for current in recursion)
 * @param {string | RegExp | number} title - Entry UID/title
 * @param {Record<string, any>} [data={}] - Additional data
 * @returns {Promise<string>} - World Book entry content
 */
async function getwi(worldinfo, title, data = {});
async function getWorldInfo(worldinfo, title, data = {});

/**
 * Read character card definition
 *
 * @param {string | RegExp | number} [name=this_chid] - Character card name/ID
 * @param {string} [template=DEFAULT_CHAR_DEFINE] - Output format
 * @param {Object} [data={}] - Additional data
 * @returns {Promise<string>} - Character card content
 */
async function getchr(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});
async function getChara(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});

/**
 * Read preset prompt content
 *
 * @param {string | RegExp} name - Preset name
 * @param {Object} [data={}] - Additional data
 * @returns {Promise<string>} - Preset prompt content
 */
async function getprp(name, data = {});
async function getPresetPrompt(name, data = {});

/**
 * Define global variables/functions
 * @note Typically used for pre-defining in World Books and calling during rendering
 *
 * @param {string} name - Variable/function name
 * @param {any} value - Content
 * @note Use 'this' to access context in function definitions (e.g., this.variables, this.getvar)
 */
function define(name, value);

/**
 * Read Quick Reply content
 * Only works for enabled quick reply sets
 *
 * @param {string | RegExp} name - Quick reply set name
 * @param {string | RegExp} label - Quick reply entry name
 * @param {Object} [data={}] - Additional data
 * @returns {string} - Quick reply content
 */
async function getqr(name, label, data = {});
async function getQuickReply(name, label, data = {});

/**
 * Read raw character card data
 * @note Returns unprocessed template data
 *
 * @param {string | RegExp | number} [name=this_chid] - Character card name/ID
 * @returns {Promise<v1CharData | null>} - Character card data
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
 * Read raw World Book data
 * @note Returns unprocessed template data
 *
 * @param {string} name - World Book name/UID
 * @returns {Promise<WorldInfoData[]>} - World Book entries list
 */
async function getWorldInfoData(name);

/**
 * Read raw Quick Reply data
 * @note Returns unprocessed template data
 *
 * @param {string | RegExp} name - Quick reply set name/UID
 * @returns {QuickReplySetLink | null} - Quick reply data
 */
function getQuickReplyData(name);

/**
 * Read activated World Book data
 * @note Returns unprocessed template data
 *
 * @param {string} name - World Book name/UID
 * @param {string} keyword - Activation keyword/content
 * @returns {Promise<WorldInfoData[]>} - Activated World Book entries
 */
async function getWorldInfoActivatedData(name, keyword);

/**
 * Process template string
 *
 * @param {string} content - Template content to process
 * @param {Object} [data={}] - Additional data
 * @param {Object} [options={}] - ejs options
 * @returns {Promise<string>} - Processed content
 */
async function evalTemplate(content, data = {}, options = {});

/**
 * Get all possible entries of World Books that might be used.
 * @note This includes entries that are disabled.
 *
 * @param {boolean} chara - Whether to include knowledge books embedded in character cards
 * @param {boolean} global - Whether to include globally enabled World/Knowledge Books
 * @param {boolean} persona - Whether to include World Books related to the user's persona
 * @param {boolean} charaExtra - Whether to include additional knowledge books attached to character cards
 * @returns {Promise<WorldInfoData[]>} - List of World Book entries
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true);

/**
 * Output one or more strings
 * @note Cannot be used inside <%- or <%= statement blocks
 *
 * @param {string} args - String content
 */
function print(...args);

/**
 * Activation a World Book entry
 *
 * @param {string} worldinfo - World Book name
 * @param {string | RegExp | number} title - Entry UID/title
 * @returns {Promise<WorldInfoData | null>} - World Book entry
 */
async function activewi(worldinfo, title);
async function activateWorldInfo(worldinfo, title);

/**
 * Get all entries from currently enabled World Info books
 *
 * @param {boolean} chara - Include character embedded World Info
 * @param {boolean} global - Include globally enabled World Info
 * @param {boolean} persona - Include user persona World Info
 * @param {boolean} charaExtra - Include character extra World Info
 * @returns {Promise<WorldInfoData[]>} List of World Info entries
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true);

/**
 * Filter activated entries from World Info entry list
 *
 * @param {WorldInfoData[]} entries - World Info entry list
 * @param {string | string[]} keywords - User activation content
 * @param {boolean} withConstant - Allow permanent 🔵 entries
 * @param {boolean} withDisabled - Allow disabled entries
 * @returns {WorldInfoData[]} Activated World Info entries
 */
function selectActivatedEntries(entries, keywords, withConstant = true, withDisabled = false);

/**
 * Get specified chat (floor) message content
 *
 * @param {number} idx - Chat (floor) message ID
 * @param {'user' | 'assistant' | 'system' | undefined} role - Filter by role, no filter if undefined
 * @returns {string} Chat message content, empty string on failure
 */
function getChatMessage(idx, role = undefined);

/**
 * Get chat (floor) message content list within specified range
 *
 * @param {number} count - Number of chat messages
 * @param {'user' | 'assistant' | 'system'} role - Filter by role
 * @param {number} start - Start message ID
 * @param {number} end - End message ID
 * @returns {string[]} Chat message content list
 */
function getChatMessages(count);
function getChatMessages(count, role);
function getChatMessages(start, end);
function getChatMessages(start, end, role);
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
> <%- await getwi('', 'Test Entry 3') -%>
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
/*
 * Message ID
 */
message_id = 0

/*
 * Swipe ID
 */
swipe_id = 0

/*
 * Message role name
 */
name = 'User'

/*
 * Whether this is the last message
 */
is_last = false

/*
 * Whether message is from user
 */
is_user = false

/*
 * Whether message is system message
 */
is_system = false
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