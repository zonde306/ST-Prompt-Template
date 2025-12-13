/**
 * Message Selection Filter
 * @interface MessageFilter
 * @property {('system' | 'user' | 'assistant' | 'any')} [role='assistant'] - Select specific role.
 *      Can be 'system', 'user', 'assistant', or 'any'. Searches from the end. Ignored if id is set.
 * @property {number} [id=null] - Select specific chat message index (can be negative; negative numbers count from the end).
 * @property {number} [swipe_id=null] - Select the swipe ID of the specified message.
 */

/**
 * Set Variable Options
 * @typedef {Object} SetVarOption
 * @property {number} [index=null] - Variable index, same as /setvar index.
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} [scope='message'] - Variable type (scope), see details below.
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Set condition; will not set if condition is not met, see details below.
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - Return value type, see details below.
 * @property {MessageFilter} [withMsg=null] - Message filter (if setting a message variable).
 * @property {boolean} [merge=false] - Whether to use merge (_.merge) to set the variable.
 * @property {boolean} [dryRun=false] - Whether to allow setting variables during the preparation phase.
 * @property {boolean} [noCache=false] - Disable cache (e.g., reading immediately after setting a variable).
 */

/**
 * @typedef {('nx'|'xx'|'n'|'nxs'|'xxs')} FlagOption
 * @description Variable setting rules: nx=set if not exists, xx=set if exists, n=force set, etc.
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
 * Set Variable
 * 
 * @examples
 *    setvar('a', 1);
 *    setvar('a', 1, 'nx');
 *    setvar('a', 1, { flags: 'nx' });
 *    setvar('a', 1, { scope: 'global' });
 *    setvar('a', 1, { scope: 'global', flags: 'nx' });
 *
 * @param {(string|null)} key - Variable name, based on lodash's _.get implementation. null represents replacing the entire variable tree.
 * @param {any} value - Variable value.
 * @param {(SetVarOption|SimpleOptions)} [options={}] - Options for setting the variable.
 * 
 * @returns Success depends on options.results; returns undefined on failure.
 */
function setvar(key, value, options = {});
// Aliases for specific options.scope
function setLocalVar(key, value, options = {});
function setGlobalVar(key, value, options = {});
function setMessageVar(key, value, options = {});


/**
 * Get Variable Options
 * @typedef {Object} GetVarOption
 * @property {number} [index=null] - Variable index, same as /getvar index.
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} [scope='cache'] - Variable type (scope), see details below.
 * @property {any} [defaults=undefined] - Default value (returned if variable does not exist).
 * @property {MessageFilter} [withMsg=undefined] - Message selection filter.
 * @property {boolean} [noCache=false] - Disable cache (e.g., reading immediately after setting a variable).
 * @property {boolean} [clone=false] - Return a deep copy of the object (otherwise returns a reference).
 */

/**
 * Read Variable
 * @note: You should avoid modifying object references directly.
 * 
 * @examples
 *    getvar('a');
 *    getvar('a', 'nx');
 *    getvar('a', { flags: 'nx' });
 *    getvar('a', { scope: 'global' });
 *    getvar('a', { scope: 'global', defaults: 0 });
 *
 * @param {(string|null)} key - Variable name, based on lodash's _.get implementation. null retrieves the entire variable tree.
 * @param {(GetVarOption|SimpleOptions)} [options={}] - Options for getting the variable.
 * @returns {any} - Variable value; returns options.defaults (default undefined) if not found.
 */
function getvar(key, options = {});
// Aliases for specific options.scope
function getLocalVar(key, options = {});
function getGlobalVar(key, options = {});
function getMessageVar(key, options = {});

/**
 * Update Variable Options
 * @typedef {Object} GetSetVarOption
 * @property {number} [index=null] - Variable index, same as /getvar index.
 * @property {unknown} [defaults=0] - Default value used if variable does not exist.
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} [inscope='cache'] - Scope to read from.
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} outscope='message'] - Scope to set to.
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Update condition; will not update if condition is not met.
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - Return value type.
 * @property {MessageFilter} [withMsg=undefined] - Message filter (if setting a message variable).
 * @property {boolean} [dryRun=false] - Whether to allow updating variables during the preparation phase.
 * @property {boolean} [noCache=false] - Disable cache (e.g., reading immediately after setting a variable).
 * @property {number} [min=null] - Minimum value.
 * @property {number} [max=null] - Maximum value.
 */

/**
 * Increment Variable Value
 * 
 * @examples
 *    incvar('a');
 *    incvar('a', 1, { defaults: 1 });
 *
 * @param {string} key - Variable name, based on lodash's _.get implementation.
 * @param {number} [value=1] - Value to increment by.
 * @param {(GetSetVarOption|SimpleOptions)} [options={}] - Options for updating the variable.
 * @returns Determined by options.results; returns undefined on failure.
 */
function incvar(key, value = 1, options = {});
// Aliases for specific options.outscope
function incLocalVar(key, value = 1, options = {});
function incGlobalVar(key, value = 1, options = {});
function incMessageVar(key, value = 1, options = {});

/**
 * Decrement Variable Value
 * 
 * @examples
 *    decvar('a.b');
 *    decvar('a.b', 1, { defaults: 1 });
 *
 * @param {string} key - Variable name, based on lodash's _.get implementation.
 * @param {number} [value=1] - Value to decrement by.
 * @param {(GetSetVarOption|SimpleOptions)} [options={}] - Options for updating the variable.
 * @returns Determined by options.results; returns undefined on failure.
 */
function decvar(key, value = 1, options = {});
// Aliases for specific options.outscope
function decLocalVar(key, value = 1, options = {});
function decGlobalVar(key, value = 1, options = {});
function decMessageVar(key, value = 1, options = {});

/**
 * Execute SillyTavern command, e.g., /setvar
 *
 * @param {string} cmd - Command string.
 * @returns {Promise<string>} - Command return value.
 */
async function execute(cmd);

/**
 * Read World/lorebook entry content
 *
 * @param {string} lorebook - Lorebook name (current character's primary lorebook if empty string/omitted).
 * @param {string | RegExp | number} title - Entry UID/Title.
 * @param {Record<string, any>} [data={}] - Data to pass.
 * @returns {Promise<string>} - Content of the lorebook entry; returns empty string on failure.
 */
async function getwi(lorebook, title, data = {});
async function getWorldInfo(lorebook, title, data = {});
async function getwi(title, data = {});
async function getWorldInfo(title, data = {});

/**
 * Read Character Card Definition
 *
 * @param {string | RegExp | number} [name=this_chid] - Character name/ID.
 * @param {string} [template=DEFAULT_CHAR_DEFINE] - Output format.
 * @param {Object} [data={}] - Data to pass.
 * @returns {Promise<string>} - Content of the character definition; returns empty string on failure.
 */
async function getchar(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});
async function getChara(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});

/**
 * Read preset prompt content
 *
 * @param {string | RegExp} name - Name of the prompt.
 * @param {Object} [data={}] - Data to pass.
 * @returns {Promise<string>} - Content of the preset prompt; returns empty string on failure.
 */
async function getpreset(name, data = {});
async function getPresetPrompt(name, data = {});

/**
 * Define global variable/function
 * @note Generally used to pre-define within a World/lorebook, then call during rendering.
 *
 * @param {string} name - Variable/Function name.
 * @param {any} value - Content of the variable/function.
 * @param {boolean} [merge=false] - Whether to use merge (_.merge) for definition. Attempts to merge if exists, otherwise overwrites.
 * 
 * @note When defining a function, use `this` to access the context, e.g., this.variables, this.getvar, this.setvar.
 */
function define(name, value, merge = false);

/**
 * Read Quick Reply content
 * Can only read from enabled Quick Reply sets.
 *
 * @param {string | RegExp} name - Quick Reply set name.
 * @param {string | RegExp} label - Quick Reply entry label.
 * @param {Object} [data={}] - Data to pass.
 * @returns {string} - Content of the quick reply; returns empty string on failure.
 */
async function getqr(name, label, data = {});
async function getQuickReply(name, label, data = {});

/**
 * Read Character Card Data
 * @note Returned data is not template-processed.
 *
 * @param {string | RegExp | number} [name=this_chid] - Character name/ID.
 * @returns {Promise<v1CharData | null>} - Character data; returns null on failure.
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
 * Read World/lorebook Data
 * @note Returned data is not template-processed.
 *
 * @param {string} name - Lorebook name/UID.
 * @returns {Promise<WorldInfoData[]>} - List of lorebook entries; returns empty array on failure.
 */
async function getWorldInfoData(name);

/**
 * Read Quick Reply Data
 * @note Returned data is not template-processed.
 *
 * @param {string | RegExp} name - Lorebook name/UID.
 * @returns {QuickReplySetLink | null} - Data; returns null on failure.
 */
function getQuickReplyData(name);

/**
 * Read World/lorebook data, containing only activated parts.
 * @note Returned data is not template-processed.
 *
 * @param {string} name - Lorebook name/UID.
 * @param {(string|string[])} keyword - Keyword (content) used to activate the lorebook.
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation condition.
 * @returns {Promise<WorldInfoData[]>} - List of lorebook entries; returns empty array on failure.
 */
async function getWorldInfoActivatedData(name, keyword, condition = {});

/**
 * Process string content with template engine.
 *
 * @param {string} content - String content to process.
 * @param {Object} [data={}] - Data to pass.
 * @param {Object} [options={}] - ejs options.
 * 
 * @errors Exceptions encountered during code execution will be thrown as is.
 * 
 * @returns {Promise<string>} - Processed string content.
 */
async function evalTemplate(content, data = {}, options = {});

/**
 * Get all entries of all World/lorebooks that might be used.
 * @note Even disabled entries are returned.
 *
 * @param {boolean} chara - Whether to include character embedded lorebooks.
 * @param {boolean} global - Whether to include globally enabled World/lorebooks.
 * @param {boolean} persona - Whether to include user persona lorebooks.
 * @param {boolean} charaExtra - Whether to include character attached lorebooks.
 * @param {boolean} onlyExisting - Only include existing World/lorebooks.
 * @returns {Promise<WorldInfoData[]>} - List of lorebook entries; returns empty array on failure.
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true, onlyExisting = true);

/**
 * Output one or more strings.
 * @note Cannot be used inside <%- or <%= blocks.
 *
 * @param {string} args - String content.
 */
function print(...args);

/**
 * Activate World/lorebook entry.
 *
 * @param {string} lorebook - Lorebook name.
 * @param {string | RegExp | number} title - Entry UID/Title.
 * @param {boolean} [force=false] - Force activate lorebook.
 * @returns {Promise<WorldInfoData | null>} - The activated lorebook entry; returns null if not found.
 */
async function activewi(lorebook, title, force = false);
async function activateWorldInfo(lorebook, title, force = false);
async function activewi(title, force = false);
async function activateWorldInfo(title, force = false);

/**
 * Activation World/lorebook Condition
 * null means no restriction.
 * @typedef {Object} ActivateWorldInfoCondition
 * @property {boolean | null} [constant=null] - Restrict to must be/not be Permanent 🔵 entry.
 * @property {boolean | null} [disabled=null] - Restrict to must be/not be Disabled entry.
 * @property {boolean | null} [vectorized=null] - Restrict to must be/not be 🔗Vectorized entry.
 */

/**
 * Activate World/lorebook
 * Activate via keywords.
 *
 * @param {string} worldinfo - Lorebook name.
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation options.
 * @returns {Promise<WorldInfoData[]>} - List of activated lorebook entries; returns empty array if not found.
 */
async function activateWorldInfoByKeywords(keywords, condition = {});

/**
 * Get the collection of all entries from currently enabled World/lorebooks.
 *
 * @param {boolean} chara - Whether to include character's built-in lorebook.
 * @param {boolean} global - Whether to include globally enabled lorebooks.
 * @param {boolean} persona - Whether to include user persona bound lorebooks.
 * @param {boolean} persona - (Duplicate in original) Whether to include character external lorebooks.
 * @param {boolean} onlyExisting - Only include existing World/lorebooks.
 * @returns {Promise<WorldInfoData[]>} - List of lorebook entries; returns empty array on failure.
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true, onlyExisting = true);

/**
 * Filter activated entries from a list of World/lorebook entries.
 *
 * @param {WorldInfoData[]} entries - List of lorebook entries.
 * @param {string | string[]} keywords - Content used for activation.
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation condition.
 * @returns {WorldInfoData[]} - List of activated lorebook entries; returns empty array if not found.
 */
function selectActivatedEntries(entries, keywords, condition = {});

/**
 * Get content of a specific chat message (floor).
 *
 * @param {number} idx - Chat message (floor) ID.
 * @param {'user' | 'assistant' | 'system' | undefined} role - Select only messages of specific role; no filter if not provided.
 * @returns {string} - Chat message content; returns empty string on failure.
 */
function getChatMessage(idx, role = undefined);

/**
 * Get a list of chat message (floor) contents within a specified range.
 *
 * @param {number} count - Quantity of chat messages (floors).
 * @param {'user' | 'assistant' | 'system'} role - Select only messages of specific role.
 * @param {number} start - Chat message (floor) start position ID.
 * @param {number} end - Chat message (floor) end position ID.
 * @returns {string[]} - List of chat message contents; returns empty array on failure.
 */
function getChatMessages(count);
function getChatMessages(count, role);
function getChatMessages(start, end);
function getChatMessages(start, end, role);

/**
 * Regular Expression Options
 * Execution order: Start Generation -> basic -> generate -> Process Template -> LLM Response -> message -> Process Template -> Render Chat Message
 * Regex injected via 'basic' mode will be automatically deleted after prompt processing is complete.
 *
 * @typedef {Object} RegexOptions
 * @property {string} [uuid=undefined] - Unique ID; modifies if exists, creates if distinct.
 * @property {number} [minDepth=NaN] - Minimum depth.
 * @property {number} [maxDepth=NaN] - Maximum depth.
 * @property {boolean} [user=true] - Effective on user input.
 * @property {boolean} [assistant=true] - Effective on AI output.
 * @property {boolean} [worldinfo=false] - Effective on World Info.
 * @property {boolean} [reasoning=false] - Effective on reasoning.
 * @property {boolean} [message=false] - Apply regex to chat messages (Extended implementation, supports replacement functions).
 * @property {boolean} [generate=false] - Apply regex to generated messages (Extended implementation, supports replacement functions).
 * @property {boolean} [basic=true] - Use SillyTavern built-in regex (SillyTavern implementation, does not support replacement functions).
 * @property {number} [order=100] - Execution order, ascending.
 * @property {boolean} [before=true] - Allow processing of original chat messages; requires 'message' to be enabled.
 * @property {boolean} [html=false] - Allow processing of chat message HTML; requires 'message' to be enabled.
 * @property {number} [sticky=0] - Sticky.
 */

/**
 * Create a temporary regular expression during generation to process chat message content.
 *
 * @param {string | RegExp} pattern - Regular expression.
 * @param {string | ((substring: string, ...args: any[]) => string) } replace - Replacement content / replacement function.
 * @param {RegexOptions} opts - Options.
 */
function activateRegex(pattern, string, opts = {});

/**
 * Add prompt injection.
 * Functionality similar to World/lorebook, but manually activated and placed.
 *
 * @param {string} key - Injection key (group).
 * @param {string} prompt - Prompt content.
 * @param {number} [order=100] - Order.
 * @param {number} [sticky=0] - Sticky.
 * @param {string} [uid=''] - Unique ID.
 */
function injectPrompt(key, prompt, order = 100, sticky = 0, uid = '');

/**
 * Content Processor
 * @typedef {Object} PostProcess
 * @property {(string|RegExp)} search - Content to search.
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
 * @property {'user'|'assistant'|'system'} [role=null] - Select only specific role.
 * @property {boolean} [and] - Valid if pattern is an array; whether exact matching is required (otherwise match any).
 */

/**
 * Search within chat messages for specific content.
 * @see getChatMessages
 * 
 * @param {string|RegExp|(string|RegExp)[]} pattern - Search keywords.
 *   - Single string: String search.
 *   - Single Regex: Regex search.
 *   - Array: Match one or exact match depending on options.and.
 * @param {GetChatMessageOptions} [options={}] - Options.
 * @returns {boolean} Returns true if matches found, otherwise false.
 */
function matchChatMessages(pattern, options = {});

/*
 * A more lenient JSON Parser implementation that can parse malformed JSON strings output by LLMs to some extent.
 * 
 * @see JSON.parse
 *
 * @param {string} text - The JSON string to parse.
 * @returns {(object|array|string|null|number|boolean)} - Parse result.
*/
function parseJSON(text);

/*
 * Apply JSON Patch modifications to dest and return the modified dest.
 * Does not modify dest in place, but returns a new object.
 * @see https://www.rfc-editor.org/rfc/rfc6902
 *
 * @param {object} dest - The object to be modified.
 * @param {object[]} change - List of JSON Patch operations.
 * @returns {object} - The modified object.
*/
function jsonPatch(dest, change);

/*
 * Apply JSON Patch modifications to variables.
 * @see jsonPatch
 * @see setvar
 *
 * @param {(string|null)} key - Variable to be modified; null means modify the entire variable tree.
 * @param {object[]} change - List of JSON Patch operations.
 * @param {SetVarOption} [options={}] - Arguments passed for modifying variables.
 * @returns Return value determined by options.
*/
function patchVariables(key, change, options = {});

/**
 * Delete Variable
 * If the key corresponds to an object/array, delete the property/value corresponding to the index.
 * If the key corresponds to a string, delete the substring at the index.
 * If index is provided but does not exist, nothing happens, and no exception is thrown.
 * 
 * @param {string} key - Variable name.
 * @param {string|number} [index=undefined] - Index; if unspecified, deletes the entire corresponding variable.
 * @param {SetVarOption} [options={}] - Options for setting variables.
 * @returns Determined by options.results; returns undefined on failure.
 */
function delvar(key, index = undefined, options = {});

// Corresponding specialized versions
function delLocalVar(key, index = undefined, options = {});
function delGlobalVar(key, index = undefined, options = {});
function delMessageVar(key, index = undefined, options = {});

/**
 * Insert Element into Variable
 * If the key corresponds to an object, use index as the object key and set value into it.
 * If the key corresponds to an array, insert value at the index position.
 * If the key corresponds to a string, insert value at the index position.
 * For other types or if index does not exist, nothing happens, and no exception is thrown.
 * 
 * @param {string} key - Variable name.
 * @param {any} value - Value to insert.
 * @param {string|number} [index=undefined] - Index; if unspecified, insert at the end.
 * @param {SetVarOption} [options={}] - Options for setting variables.
 * @returns Determined by options.results; returns undefined on failure.
 */
function insvar(key, value, index = undefined, options = {});

// Corresponding specialized versions
function insertLocalVar(key, value, index = undefined, options = {});
function insertGlobalVar(key, value, index = undefined, options = {});
function insertMessageVar(key, value, index = undefined, options = {});

/**
 * Collection of all variables
 * Variables are merged in the following order (priority); high priority overwrites variables of the same name with low priority:
 * 1. Message variables (floor number from end to beginning)
 * 2. Local (chat) variables
 * 3. Global variables
 * 
 * @note: When processing floor message variables, this value does not include the current and subsequent floor variables.
 *        Conflict handling: If types are both [] or {}, they are merged, otherwise replaced.
 * @see: https://lodash.com/docs/4.17.15#merge
 * @type {object}
 */
variables = {}

/**
 * SillyTavern's SillyTavern.getContext() return content
 * Detailed content can be viewed by entering SillyTavern.getContext() in the console.
 */
SillyTavern = SillyTavern.getContext()

/**
 * faker library content, used to generate random content.
 * Usage: faker.fakerEN, faker.fakerCN, etc.
 * Example: faker.fakerEN.lastName() gets a random English last name.
 * @see: https://fakerjs.dev/api/
 * @type {object}
 */
faker = require("faker")

/*
 * Lodash Library
 * Usage: _.get, _.set, etc.
 * Example: _.toArray('abc') outputs ['a','b','c']
 * @see: https://lodash.com/docs/4.17.15
 */
_ = require("lodash")

/*
 * JQuery Library
 * Usage: $()
 * Example: $('.mes_text') gets the text box.
 * @see: https://api.jquery.com/
 */
$ = require("JQuery")

/*
 * toastr Library
 * Usage: toastr.info, toastr.error
 * Example: toastr.info('hello world')
 * @see: https://codeseven.github.io/toastr/
 */
toastr = require("toastr")

/**
 * Phase during template calculation
 * generate: Generation phase
 * preparation: Preparation phase
 * render: Rendering (chat message) phase
 * @type {(String|undefined)}
 */
runType = 'generate' | 'preparation' | 'render'

/*
 * Character Card Embedded Lorebook Name
 * undefined when not bound
 * @type {(String|undefined)}
 */
charLoreBook = ''

/*
 * User Persona Bound Lorebook Name
 * undefined when not bound
 * @type {(String|undefined)}
 */
userLoreBook = ''

/*
 * Chat File Bound Lorebook Name
 * undefined when not bound
 * @type {(String|undefined)}
 */
chatLoreBook = ''

/*
 * User Name
 * @type {String}
 */
userName = 'User'

/*
 * Character Card Character Name
 * @type {String}
 */
charName = 'SillyTavern System'

/*
 * Chat Session ID
 * @type {String}
 */
chatId = ''

/*
 * Character Card ID
 * @type {String}
 */
characterId = ''

/*
 * Group Chat ID
 * @type {(String|null)}
 */
groupId = null

/*
 * Group Chat Status Information
 * @type {array}
 */
groups = []

/*
 * Character Card Avatar
 * @type {string}
 */
charAvatar = ""

/*
 * User Avatar
 * @type {string}
 */
userAvatar = ""

/*
 * Latest User Message ID
 * @type {number}
 */
lastUserMessageId = 0

/*
 * Latest Character Message ID
 * @type {number}
 */
lastCharMessageId = 0

/*
 * Currently selected model
 */
model = 'gpt-3.5'

/*
 * Current generation type
 * Empty string if not generating
 */
generateType = '' | 'custom' | 'normal' | 'continue' | 'impersonate' | 'regenerate' | 'swipe' | 'quiet';

/*
 * Message ID (i.e., floor number)
 */
message_id = 0

/*
 * Message Swipe ID
 */
swipe_id = 0

/*
 * Message Role Name
 */
name = 'User'

/*
 * Whether message is the last one
 */
is_last = false

/*
 * Whether message is the last one (Duplicate)
 */
is_last = false

/*
 * Whether message is from User
 */
is_user = false

/*
 * Whether message is from System
 */
is_system = false