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
async function getchar(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});
async function getChara(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});

/**
 * Get preset prompt content
 *
 * @param {string | RegExp} name - Prompt name
 * @param {Object} [data={}] - Data to pass
 * @returns {Promise<string>} - Content of preset prompt
 */
async function getpreset(name, data = {});
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