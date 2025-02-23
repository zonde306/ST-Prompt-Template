# Built-in Functions

```javascript
/**
 * Message selection filter
 * @interface MessageFilter
 * @property {('system' | 'user' | 'assistant' | 'any')} [role='assistant'] - Select the specified role.
 *      Can be 'system', 'user', 'assistant', or 'any'. Searches from the end. If id is set, this will be invalid.
 * @property {number} [id=undefined] - Select the specified message floor, can be negative (negative numbers start from the end).
 * @property {number} [swipe_id=undefined] - Select the specified message's swipe ID.
 */

/**
 * Set variable options
 * @typedef {Object} SetVarOption
 * @property {number} [index=undefined] - The index of the variable, same as the index in /setvar.
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='message'] - Variable type (scope), see below for details.
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Set conditions, if not met, the variable will not be set, see below for details.
 * @property {'old' | 'new' | 'fullcache'} [results='fullcache'] - Return value type, see below for details.
 * @property {MessageFilter} [withMsg=undefined] - Message filter (if setting message variables).
 * @property {boolean} [merge=false] - Whether to use merge to set variables (_.merge).
 * @property {boolean} [dryRun=false] - Whether to allow setting variables during the preparation phase.
 */

/**
 * Set variable
 *
 * @param {string} key - Variable name
 * @param {any} value - Variable value
 * @param {SetVarOption} [options={}] - Set variable options.
 * @returns Success determined by options.results, failure returns undefined.
 */
function setvar(key, value, options = {});

/**
 * Get variable options
 * @typedef {Object} GetVarOption
 * @property {number} [index=undefined] - The index of the variable, same as the index in /getvar.
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='cache'] - Variable type (scope), see below for details.
 * @property {any} [defaults=undefined] - Default value (returned if the variable does not exist).
 * @property {MessageFilter} [withMsg=undefined] - Message selection filter.
 */

/**
 * Get variable
 *
 * @param {string} key - Variable name
 * @param {GetVarOption} [options={}] - Get variable options
 * @returns {any} - Variable value, returns options.defaults if not found.
 */
function getvar(key, options = {});

/**
 * Update variable options
 * @typedef {Object} GetSetVarOption
 * @property {number} [index] - The index of the variable, same as the index in /getvar.
 * @property {unknown} [defaults=0] - Default value to use if the variable does not exist.
 * @property {'global' | 'local' | 'message' | 'cache'} [inscope='cache'] - Variable type (scope) to read, see below for details.
 * @property {'global' | 'local' | 'message' | 'cache'} outscope='message'] - Variable type (scope) to set, see below for details.
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags] - Update conditions, if not met, the variable will not be updated, see below for details.
 * @property {'old' | 'new' | 'fullcache'} [results='fullcache'] - Return value type, see below for details.
 * @property {MessageFilter} [withMsg=undefined] - Message filter (if setting message variables).
 * @property {boolean} [dryRun=false] - Whether to allow updating variables during the preparation phase.
 */

/**
 * Increment variable value
 *
 * @param {string} key - Variable name
 * @param {number} [value=1] - Variable value
 * @param {GetSetVarOption} [options={}] - Update variable options
 * @returns Determined by options.results, failure returns undefined.
 */
function incvar(key, value = 1, options = {});

/**
 * Decrement variable value
 *
 * @param {string} key - Variable name
 * @param {number} [value=1] - Variable value
 * @param {GetSetVarOption} [options={}] - Update variable options
 * @returns Determined by options.results, failure returns undefined.
 */
function decvar(key, value = 1, options = {});

/**
 * Execute command, e.g., /setvar
 *
 * @param {string} cmd - Command
 * @returns {Promise<string>} - Command return value
 */
async function execute(cmd);

/**
 * Read world book entry content
 *
 * @param {string} worldinfo - World book name
 * @param {string | RegExp | number} title - Entry uid/title
 * @param {Record<string, any>} [data={}] - Data to pass
 * @returns {Promise<string>} - World book entry content
 */
async function getwi(worldinfo, title, data = {});

/**
 * Read character card definition
 *
 * @param {string | RegExp} name - Character card name
 * @param {string} [template=DEFAULT_CHAR_DEFINE] - Output format
 * @param {Record<string, any>} [data={}] - Data to pass
 * @returns {Promise<string>} - Character card definition content
 */
async function getchr(name, template = DEFAULT_CHAR_DEFINE, data = {});

/**
 * Read preset prompt content
 *
 * @param {string | RegExp} name - Prompt name
 * @param {Record<string, any>} [data={}] - Data to pass
 * @returns {Promise<string>} - Preset prompt content
 */
async function getprp(name, data = {});

/**
 * Define global variable/function
 *
 * @param {string} name - Variable/function name
 * @param {any} value - Variable/function content
 */
function define(name, value);
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
 * Merged in the following order (priority):
 * 1. Message variables (from end to start)
 * 2. Local (chat) variables
 * 3. Global variables
 * 
 * Note: When processing floor message variables, this value does not include the current and subsequent floor variables.
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
 * @see: https://www.runoob.com/manual/jquery/
 */
$ = require("JQuery")

/**
 * Phase during template calculation
 * generate: Generation phase
 * preparation: Preparation phase
 * render: Rendering (floor message) phase
 */
runType = 'generate' | 'preparation' | 'render'

/*
 * Floor message ID (i.e., floor number)
 * Only exists when runType is 'render'
 */
message_id = 0

/*
 * Floor message page ID
 * Only exists when runType is 'render'
 */
swipe_id = 0
```

---

# Notes

1.  Both the preparation phase and the generation phase trigger world book calculations.
2.  The rendering phase does not trigger world book calculations.
3.  After `define` is executed, it remains valid until the page is refreshed or closed.

