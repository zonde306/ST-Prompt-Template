# Built-in Functions

```javascript
/**
 * Message Selection Filter
 * @interface MessageFilter
 * @property {('system' | 'user' | 'assistant' | 'any')} [role='assistant'] - Select messages by role. 
 *      Can be 'system', 'user', 'assistant', or 'any'. Searches from the end. This is ignored if id is set.
 * @property {number} [id=undefined] - Select message by index (supports negative values for reverse indexing).
 * @property {number} [swipe_id=undefined] - Select message by swipe ID.
 */

/**
 * Set Variable Options
 * @typedef {Object} SetVarOption
 * @property {number} [index=undefined] - Variable index (same as /setvar's index)
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='message'] - Variable scope, see details below
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Set conditions (no-op if not met), see details below
 * @property {'old' | 'new' | 'fullcache'} [results='fullcache'] - Return type, see details below
 * @property {MessageFilter} [withMsg=undefined] - Message filter (for message-scoped variables)
 * @property {boolean} [merge=false] - Use _.merge to set the variable
 * @property {boolean} [dryRun=false] - Allow setting variables during preparation phase
 * @property {boolean} [noCache=false] - Bypass cache (e.g., when reading immediately after setting)
 */

/**
 * Set a variable
 *
 * @param {string} key - Variable name
 * @param {any} value - Variable value
 * @param {SetVarOption} [options={}] - Set variable options
 * @returns Returns based on options.results on success, undefined on failure
 */
function setvar(key, value, options = {});
// Scope-specific aliases
function setLocalVar(key, value, options = {});
function setGlobalVar(key, value, options = {});
function setMessageVar(key, value, options = {});


/**
 * Get Variable Options
 * @typedef {Object} GetVarOption
 * @property {number} [index=undefined] - Variable index (same as /getvar's index)
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='cache'] - Variable scope, see details below
 * @property {any} [defaults=undefined] - Default value if variable not found
 * @property {MessageFilter} [withMsg=undefined] - Message selection filter
 * @property {boolean} [noCache=false] - Bypass cache (e.g., when reading immediately after setting)
 */

/**
 * Retrieve a variable
 *
 * @param {string} key - Variable name
 * @param {GetVarOption} [options={}] - Get variable options
 * @returns {any} - Variable value or options.defaults if not found
 */
function getvar(key, options = {});
// Scope-specific aliases
function getLocalVar(key, options = {});
function getGlobalVar(key, options = {});
function getMessageVar(key, options = {});

/**
 * Update Variable Options
 * @typedef {Object} GetSetVarOption
 * @property {number} [index] - Variable index (same as /getvar's index)
 * @property {unknown} [defaults=0] - Default value if variable not found
 * @property {'global' | 'local' | 'message' | 'cache'} [inscope='cache'] - Input scope (read from)
 * @property {'global' | 'local' | 'message' | 'cache'} [outscope='message'] - Output scope (write to)
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Update conditions (no-op if not met)
 * @property {'old' | 'new' | 'fullcache'} [results='fullcache'] - Return type
 * @property {MessageFilter} [withMsg=undefined] - Message filter for message-scoped variables
 * @property {boolean} [dryRun=false] - Allow updates during preparation phase
 * @property {boolean} [noCache=false] - Bypass cache
 */

/**
 * Increment a variable's value
 *
 * @param {string} key - Variable name
 * @param {number} [value=1] - Increment amount
 * @param {GetSetVarOption} [options={}] - Update options
 * @returns Based on options.results, undefined on failure
 */
function incvar(key, value = 1, options = {});
// Scope-specific aliases
function incLocalVar(key, value = 1, options = {});
function incGlobalVar(key, value = 1, options = {});
function incMessageVar(key, value = 1, options = {});

/**
 * Decrement a variable's value
 *
 * @param {string} key - Variable name
 * @param {number} [value=1] - Decrement amount
 * @param {GetSetVarOption} [options={}] - Update options
 * @returns Based on options.results, undefined on failure
 */
function decvar(key, value = 1, options = {});
// Scope-specific aliases
function decLocalVar(key, value = 1, options = {});
function decGlobalVar(key, value = 1, options = {});
function decMessageVar(key, value = 1, options = {});

/**
 * Execute a command (e.g., /setvar)
 *
 * @param {string} cmd - Command to execute
 * @returns {Promise<string>} - Command output
 */
async function execute(cmd);

/**
 * Get World Info entry content
 *
 * @param {string} worldinfo - World Info name
 * @param {string | RegExp | number} title - Entry UID/title
 * @param {Record<string, any>} [data={}] - Context data
 * @returns {Promise<string>} - Entry content
 */
async function getwi(worldinfo, title, data = {});
async function getWorldInfo(worldinfo, title, data = {});

/**
 * Get character definition
 *
 * @param {string | RegExp} name - Character name
 * @param {string} [template=DEFAULT_CHAR_DEFINE] - Output format
 * @param {Record<string, any>} [data={}] - Context data
 * @returns {Promise<string>} - Character definition
 */
async function getchr(name, template = DEFAULT_CHAR_DEFINE, data = {});
async function getChara(name, template = DEFAULT_CHAR_DEFINE, data = {});

/**
 * Get preset prompt content
 *
 * @param {string | RegExp} name - Preset name
 * @param {Record<string, any>} [data={}] - Context data
 * @returns {Promise<string>} - Preset prompt content
 */
async function getprp(name, data = {});
async function getPresetPrompt(name, data = {});

/**
 * Define global variables/functions
 *
 * @param {string} name - Variable/function name
 * @param {any} value - Content/value
 * @note Use 'this' to access context in functions (e.g., this.variables, this.getvar, this.setvar)
 */
function define(name, value);

/**
 * Retrieve Quick Reply content
 * Can only read from enabled Quick Reply sets
 *
 * @param {string | RegExp} name - Quick Reply set name
 * @param {string | RegExp} label - Quick Reply entry name
 * @returns {string} Content of the Quick Reply
 */
function getqr(name, label);
function getQuickReply(name, label);
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

Functions exported by the extension, accessible to other extensions

```javascript
/**
 * Process text with template syntax
 *
 * @param {string} content - Template code
 * @param {object} data - Execution context (data environment)
 * @returns {string} Processed content after template evaluation
 */
async function evalTemplate(code, context = {});

/**
 * Create execution context for template processing
 *
 * @param {number} last_message_id - Maximum message ID for variable merging
 * @param {object} context - Additional execution context
 * @returns {object} Prepared execution context
 */
async function prepareContext(last_message_id = 65535, context = {});

/**
 * Check for template syntax errors without execution
 *
 * @param {string} content - Template code to validate
 * @param {number} max_lines - Number of surrounding lines to show for errors
 * @returns {string} Syntax error message, or empty string if valid
 */
async function getSyntaxErrorInfo(code, max_lines = 4);
```

> These functions can be accessed via `window` (i.e., `globalThis`*)* 

---

# Notes

1.  Both the preparation phase and the generation phase trigger world book calculations.
2.  The rendering phase does not trigger world book calculations.
3.  After `define` is executed, it remains valid until the page is refreshed or closed, but be mindful of the impact of the outer closure.