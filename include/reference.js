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
 * @returns {any} - Variable value, or `options.defaults` if not found.
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