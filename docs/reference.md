# Built-in Functions

```javascript
/**
 * Message selection filter
 * @interface MessageFilter
 * @property {('system' | 'user' | 'assistant' | 'any')} [role='assistant'] - Select messages of specified role.
 *      Can be 'system', 'user', 'assistant', or 'any'. Searches from the end. If id is set, this option becomes ineffective.
 * @property {number} [id=null] - Select message by floor number, can be negative (negative numbers count from the end).
 * @property {number} [swipe_id=null] - Select message by swipe ID.
 */
/**
 * Set variable options
 * @typedef {Object} SetVarOption
 * @property {number} [index=null] - Variable index, same as index in /setvar command.
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='message'] - Variable type (scope), see details below
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Set conditions, won't set if not met, see details below
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - Return value type, see details below
 * @property {MessageFilter} [withMsg=null] - Message filter (if setting message variables)
 * @property {boolean} [merge=false] - Whether to use merge (_.merge) when setting variables
 * @property {boolean} [dryRun=false] - Whether to allow setting variables during preparation phase
 * @property {boolean} [noCache=false] - Disable cache (e.g., when reading immediately after setting)
 */
/**
 * Set variable
 *
 * @param {string} key - Variable name
 * @param {any} value - Variable value
 * @param {SetVarOption} [options={}] - Set variable options.
 * @returns Success depends on options.results, returns undefined on failure
 */
function setvar(key, value, options = {});
// Aliases for specific options.scope
function setLocalVar(key, value, options = {});
function setGlobalVar(key, value, options = {});
function setMessageVar(key, value, options = {});
/**
 * Get variable options
 * @typedef {Object} GetVarOption
 * @property {number} [index=null] - Variable index, same as index in /getvar command
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='cache'] - Variable type (scope), see details below
 * @property {any} [defaults=undefined] - Default value (returned when variable doesn't exist)
 * @property {MessageFilter} [withMsg=undefined] - Message selection filter
 * @property {boolean} [noCache=false] - Disable cache (e.g., when reading immediately after setting)
 * @property {boolean} [clone=false] - Return deep cloned object (otherwise returns reference)
 */
/**
 * Get variable
 * @note: Should avoid modifying object references
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
 * Update variable options
 * @typedef {Object} GetSetVarOption
 * @property {number} [index=null] - Variable index, same as index in /getvar command
 * @property {unknown} [defaults=0] - Default value used when variable doesn't exist
 * @property {'global' | 'local' | 'message' | 'cache'} [inscope='cache'] - Variable type (scope) for reading, see details below
 * @property {'global' | 'local' | 'message' | 'cache'} [outscope='message'] - Variable type (scope) for setting, see details below
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Update conditions, won't update if not met, see details below
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - Return value type, see details below
 * @property {MessageFilter} [withMsg=undefined] - Message filter (if setting message variables)
 * @property {boolean} [dryRun=false] - Whether to allow updating variables during preparation phase
 * @property {boolean} [noCache=false] - Disable cache (e.g., when reading immediately after setting)
 * @property {number} [min=null] - Minimum value
 * @property {number} [max=null] - Maximum value
 */
/**
 * Increment variable value
 *
 * @param {string} key - Variable name
 * @param {number} [value=1] - Value to increment by
 * @param {GetSetVarOption} [options={}] - Update variable options
 * @returns Depends on options.results, returns undefined on failure.
 */
function incvar(key, value = 1, options = {});
// Aliases for specific options.outscope
function incLocalVar(key, value = 1, options = {});
function incGlobalVar(key, value = 1, options = {});
function incMessageVar(key, value = 1, options = {});
/**
 * Decrement variable value
 *
 * @param {string} key - Variable name
 * @param {number} [value=1] - Value to decrement by
 * @param {GetSetVarOption} [options={}] - Update variable options
 * @returns Depends on options.results, returns undefined on failure.
 */
function decvar(key, value = 1, options = {});
// Aliases for specific options.outscope
function decLocalVar(key, value = 1, options = {});
function decGlobalVar(key, value = 1, options = {});
function decMessageVar(key, value = 1, options = {});
/**
 * Execute command, e.g., /setvar
 *
 * @param {string} cmd - Command
 * @returns {Promise<string>} - Command return value
 */
async function execute(cmd);
/**
 * Get world info entry content
 *
 * @param {string} lorebook - Lorebook name (can pass empty when recursive, will automatically infer current lorebook)
 * @param {string | RegExp | number} title - Entry uid/title
 * @param {Record<string, any>} [data={}] - Data to pass
 * @returns {Promise<string>} - Content of the world info entry
 */
async function getwi(lorebook, title, data = {});
async function getWorldInfo(lorebook, title, data = {});
async function getwi(title, data = {});
async function getWorldInfo(title, data = {});
/**
 * Get character card definition
 *
 * @param {string | RegExp | number} [name=this_chid] - Character card name/ID
 * @param {string} [template=DEFAULT_CHAR_DEFINE] - Output format
 * @param {Object} [data={}] - Data to pass
 * @returns {Promise<string>} - Content of character card definition
 */
async function getchr(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});
async function getChara(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});
/**
 * Get preset prompt content
 *
 * @param {string | RegExp} name - Prompt name
 * @param {Object} [data={}] - Data to pass
 * @returns {Promise<string>} - Content of preset prompt
 */
async function getprp(name, data = {});
async function getPresetPrompt(name, data = {});
/**
 * Define global variables/functions
 * @note Typically used for pre-definition in world info, then called during rendering
 *
 * @param {string} name - Variable/function name
 * @param {any} value - Content of variable/function
 * @param {boolean} [merge=false] - Whether to use merge when defining (_.merge)
 * @note When defining functions, should use this to access context, e.g.: this.variables, this.getvar, this.setvar
 */
function define(name, value, merge = false);
/**
 * Get quick reply content
 * Can only read enabled quick reply sets
 *
 * @param {string | RegExp} name - Quick reply set name
 * @param {string | RegExp} label - Quick reply entry name
 * @param {Object} [data={}] - Data to pass
 * @returns {string} - Quick reply content
 */
async function getqr(name, label, data = {});
async function getQuickReply(name, label, data = {});
/**
 * Get character card data
 * @note Returns data without template processing
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
 * Get world info data
 * @note Returns data without template processing
 *
 * @param {string} name - World info name/uid
 * @returns {Promise<WorldInfoData[]>} - World info entry list
 */
async function getWorldInfoData(name);
/**
 * Get quick reply data
 * @note Returns data without template processing
 *
 * @param {string | RegExp} name - World info name/uid
 * @returns {QuickReplySetLink | null} - World info data
 */
function getQuickReplyData(name);
/**
 * Get world info data, containing only activated entries
 * @note Returns data without template processing
 *
 * @param {string} name - World info name/uid
 * @param {(string|string[])} keyword - Keywords used to activate world info (content)
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation conditions
 * @returns {Promise<WorldInfoData[]>} - World info entry list
 */
async function getWorldInfoActivatedData(name, keyword, condition = {});
/**
 * Process string content with template
 *
 * @param {string} content - String content to process
 * @param {Object} [data={}] - Data to pass
 * @param {Object} [options={}] - EJS parameters
 * @returns {Promise<string>} - Processed string content
 */
async function evalTemplate(content, data = {}, options = {});
/**
 * Get all potentially used world info entries
 * @note Even disabled entries will be returned
 *
 * @param {boolean} chara - Whether to include knowledge books embedded in character cards
 * @param {boolean} global - Whether to include globally enabled world/knowledge books
 * @param {boolean} persona - Whether to include world books bound to user persona
 * @param {boolean} charaExtra - Whether to include additional knowledge books from character cards
 * @returns {Promise<WorldInfoData[]>} - World info entry list
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true);
/**
 * Output one or more strings
 * @note Cannot be used within <%- or <%= statement blocks
 *
 * @param {string} args - String content
 */
function print(...args);
/**
 * Activate world info entry
 *
 * @param {string} lorebook - Lorebook name
 * @param {string | RegExp | number} title - Entry uid/title
 * @param {boolean} [force=false] - Force activate world info
 * @returns {Promise<WorldInfoData | null>} - Activated world info entry, returns null if entry not found
 */
async function activewi(lorebook, title, force = false);
async function activateWorldInfo(lorebook, title, force = false);
async function activewi(title, force = false);
async function activateWorldInfo(title, force = false);
/**
 * Activate world info condition
 * null means no restriction
 * @typedef {Object} ActivateWorldInfoCondition
 * @property {boolean | null} [constant=null] - Restrict to must be/NOT constant (blue) entries
 * @property {boolean | null} [disabled=null] - Restrict to must be/NOT disabled entries
 * @property {boolean | null} [vectorized=null] - Restrict to must be/NOT vectorized (🔗) entries
 */
/**
 * Activate world info
 * Activate through keywords
 *
 * @param {string} worldinfo - World info name
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation options
 * @returns {Promise<WorldInfoData[]>} - Activated world info entry list
 */
async function activateWorldInfoByKeywords(keywords, condition = {});
/**
 * Get all entries of currently enabled world info
 *
 * @param {boolean} chara - Whether to include character card's built-in world info
 * @param {boolean} global - Whether to include globally enabled world info
 * @param {boolean} persona - Whether to include user persona bound world info
 * @param {boolean} charaExtra - Whether to include external world info from character cards
 * @returns {Promise<WorldInfoData[]>} - World info entry list
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true);
/**
 * Filter activated entries from world info entry list
 *
 * @param {WorldInfoData[]} entries - World info entry list
 * @param {string | string[]} keywords - User activated content
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation conditions
 * @returns {WorldInfoData[]} - Activated world info entry list
 */
function selectActivatedEntries(entries, keywords, condition = {});
/**
 * Get specified chat (floor) message content
 *
 * @param {number} idx - Chat (floor) message ID
 * @param {'user' | 'assistant' | 'system' | undefined} role - Only select messages of specified role, no filter if not provided
 * @returns {string} - Chat (floor) message content, returns empty string on failure
 */
function getChatMessage(idx, role = undefined);
/**
 * Get content list of chat (floor) messages within specified range
 *
 * @param {number} count - Number of chat (floor) messages
 * @param {'user' | 'assistant' | 'system'} role - Only select messages of specified role
 * @param {number} start - Start position ID of chat (floor) messages
 * @param {number} end - End position ID of chat (floor) messages
 * @returns {string[]} - Chat (floor) message content list
 */
function getChatMessages(count);
function getChatMessages(count, role);
function getChatMessages(start, end);
function getChatMessages(start, end, role);
/**
 * Regular expression options
 * Execution order: start generation -> basic -> generate -> process template -> LLM response -> message -> process template -> render floor message
 * Basic mode injected regex will be automatically deleted after prompt processing is complete
 *
 * @typedef {Object} RegexOptions
 * @property {string} [uuid=undefined] - Unique ID, same ID will modify existing, different ID will create new
 * @property {number} [minDepth=NaN] - Minimum depth
 * @property {number} [maxDepth=NaN] - Maximum depth
 * @property {boolean} [user=true] - Apply to user input
 * @property {boolean} [assistant=true] - Apply to AI output
 * @property {boolean} [worldinfo=false] - Apply to world information
 * @property {boolean} [reasoning=false] - Apply to reasoning
 * @property {boolean} [message=false] - Apply regex to floor messages (implemented by prompt template extension, supports replacement functions)
 * @property {boolean} [generate=false] - Apply regex to generated messages (prompt template extension, supports replacement functions)
 * @property {boolean} [basic=true] - Use tavern built-in regex (implemented by tavern, doesn't support replacement functions)
 * @property {number} [order=100] - Execution order, executed in ascending order
 * @property {boolean} [raw=true] - Allow processing of raw floor messages, requires message option to be enabled
 * @property {boolean} [display=false] - Allow processing of floor message HTML, requires message option to be enabled
 * @property {number} [sticky=0] - Stickiness
 */
/**
 * Create temporary regular expression during generation to process chat message content
 *
 * @param {string | RegExp} pattern - Regular expression pattern
 * @param {string | ((substring: string, ...args: any[]) => string) } replace - Replacement content/function
 * @param {RegexOptions} opts - Options
 */
function activateRegex(pattern, string, opts = {});
/**
 * Add prompt injection
 * Functionality similar to world info, but manually activated and placed
 *
 * @param {string} key - Injection key (group)
 * @param {string} prompt - Prompt content
 * @param {number} [order=100] - Order
 * @param {number} [sticky=0] - Stickiness
 * @param {string} [uid=''] - Unique ID
 */
function injectPrompt(key, prompt, order = 100, sticky = 0, uid = '');
/**
 * Content processor
 * @typedef {Object} PostProcess
 * @property {(string|RegExp)} search - Content to search for
 * @property {string} replace - Content to replace with
 */
/**
 * Get injected prompt
 *
 * @param {string} key - Injection key (group)
 * @param {PostProcess[]} [postprocess=[]] - Content processing
 * @returns {string} - Injected prompt content
 */
function getPromptsInjected(key, postprocess = []);
/**
 * Check if prompt injection exists
 *
 * @param {string} key - Injection key (group)
 * @returns {boolean} - Whether prompt injection exists
 */
function hasPromptsInjected(key);
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