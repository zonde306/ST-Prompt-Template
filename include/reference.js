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
 * @property {boolean} [message=true] - Apply to chat message (permanent)
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
 * Content processor
 * @typedef {Object} PostProcess
 * @property {(string|RegExp)} search - Search content
 * @property {string} replace - Replace content
 */

/**
 * Read merged prompt injection
 *
 * @param {string} key - Injection key (group)
 * @param {PostProcess[]} [postprocess=[]] - Content processor
 * @returns {string} - Merged injection prompt words
 */
function getPromptsInjected(key, postprocess = []);

/**
* Check if prompt injection exists
*
* @param {string} key - injection key (group)
* @returns {boolean} - whether prompt injection exists
*/
function hasPromptsInjected(key);

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