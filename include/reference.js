/**
 * Message selection filter
 * @interface MessageFilter
 * @property {('system' | 'user' | 'assistant' | 'any')} [role='assistant'] - Select a specific role.
 *      Can be 'system', 'user', 'assistant', or 'any'. Searches from the end. If 'id' is set, this option will be invalid.
 * @property {number} [id=null] - Select a specific message index. Can be negative (negative numbers search from the end).
 * @property {number} [swipe_id=null] - Select the swipe ID of a specific message.
 */

/**
 * Set variable options
 * @typedef {Object} SetVarOption
 * @property {number} [index=null] - Index of the variable, same as /setvar's index.
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='message'] - Variable type (scope), see below for details.
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Setting conditions; if not met, the variable is not set. See below for details.
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - Return value type, see below for details.
 * @property {MessageFilter} [withMsg=null] - Message filter (if setting a message variable).
 * @property {boolean} [merge=false] - Whether to use merge (_.merge) to set the variable.
 * @property {boolean} [dryRun=false] - Whether to allow setting variables during the preparation phase.
 * @property {boolean} [noCache=false] - Disable caching (e.g., for immediate read after setting a variable).
 */

/**
 * Set a variable
 *
 * @param {string} key - Variable name.
 * @param {any} value - Variable value.
 * @param {SetVarOption} [options={}] - Options for setting the variable.
 * @returns Success determined by options.results, returns undefined on failure.
 */
function setvar(key, value, options = {});
// Aliases for specific options.scope
function setLocalVar(key, value, options = {});
function setGlobalVar(key, value, options = {});
function setMessageVar(key, value, options = {});


/**
 * Get variable options
 * @typedef {Object} GetVarOption
 * @property {number} [index=null] - Index of the variable, same as /getvar's index.
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='cache'] - Variable type (scope), see below for details.
 * @property {any} [defaults=undefined] - Default value (returned if the variable does not exist).
 * @property {MessageFilter} [withMsg=undefined] - Message selection filter.
 * @property {boolean} [noCache=false] - Disable caching (e.g., for immediate read after setting a variable).
 * @property {boolean} [clone=false] - Returns a deep copy of the object (otherwise returns an object reference)
 */

/**
 * Read a variable
 * @note: Modifying object references should be avoided
 *
 * @param {string} key - Variable name.
 * @param {GetVarOption} [options={}] - Options for getting the variable.
 * @returns {any} - The variable's value, returns options.defaults if not found.
 */
function getvar(key, options = {});
// Aliases for specific options.scope
function getLocalVar(key, options = {});
function getGlobalVar(key, options = {});
function getMessageVar(key, options = {});

/**
 * Update variable options
 * @typedef {Object} GetSetVarOption
 * @property {number} [index=null] - Index of the variable, same as /getvar's index.
 * @property {unknown} [defaults=0] - Default value to use if the variable does not exist.
 * @property {'global' | 'local' | 'message' | 'cache'} [inscope='cache'] - Variable type (scope) for reading, see below for details.
 * @property {'global' | 'local' | 'message' | 'cache'} outscope='message'] - Variable type (scope) for setting, see below for details.
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - Update conditions; if not met, the variable is not updated. See below for details.
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - Return value type, see below for details.
 * @property {MessageFilter} [withMsg=undefined] - Message filter (if setting a message variable).
 * @property {boolean} [dryRun=false] - Whether to allow updating variables during the preparation phase.
 * @property {boolean} [noCache=false] - Disable caching (e.g., for immediate read after setting a variable).
 * @property {number} [min=null] - Minimum value.
 * @property {number} [max=null] - Maximum value.
 */

/**
 * Increment the value of a variable
 *
 * @param {string} key - Variable name.
 * @param {number} [value=1] - Value to increment by.
 * @param {GetSetVarOption} [options={}] - Options for updating the variable.
 * @returns Determined by options.results, returns undefined on failure.
 */
function incvar(key, value = 1, options = {});
// Aliases for specific options.outscope
function incLocalVar(key, value = 1, options = {});
function incGlobalVar(key, value = 1, options = {});
function incMessageVar(key, value = 1, options = {});

/**
 * Decrement the value of a variable
 *
 * @param {string} key - Variable name.
 * @param {number} [value=1] - Value to decrement by.
 * @param {GetSetVarOption} [options={}] - Options for updating the variable.
 * @returns Determined by options.results, returns undefined on failure.
 */
function decvar(key, value = 1, options = {});
// Aliases for specific options.outscope
function decLocalVar(key, value = 1, options = {});
function decGlobalVar(key, value = 1, options = {});
function decMessageVar(key, value = 1, options = {});

/**
 * Execute a command, e.g., /setvar
 *
 * @param {string} cmd - The command.
 * @returns {Promise<string>} - The return value of the command.
 */
async function execute(cmd);

/**
 * Read World Info entry content
 *
 * @param {string} lorebook - World Info name (can be empty for recursion, automatically infers current World Info).
 * @param {string | RegExp | number} title - Entry UID/title.
 * @param {Record<string, any>} [data={}] - Data to pass.
 * @returns {Promise<string>} - The content of the World Info entry.
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
 * @returns {Promise<string>} - The content of the character card definition.
 */
async function getchr(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});
async function getChara(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});

/**
 * Read preset prompt content
 *
 * @param {string | RegExp} name - Name of the prompt.
 * @param {Object} [data={}] - Data to pass.
 * @returns {Promise<string>} - The content of the preset prompt.
 */
async function getprp(name, data = {});
async function getPresetPrompt(name, data = {});

/**
 * Define global variables/functions
 * @note Generally used for pre-defining in World Info, then calling during rendering.
 *
 * @param {string} name - Variable/function name.
 * @param {any} value - Variable/function content.
 * @param {boolean} [merge=false] - Whether to use merge (_.merge) to define.
 * @note When defining functions, 'this' should be used to access the context, e.g.: this.variables, this.getvar, this.setvar
 */
function define(name, value, merge = false);

/**
 * Read Quick Reply content
 * Only enabled Quick Reply sets can be read.
 *
 * @param {string | RegExp} name - Quick Reply set name.
 * @param {string | RegExp} label - Quick Reply entry name.
 * @param {Object} [data={}] - Data to pass.
 * @returns {string} - The content of the Quick Reply.
 */
async function getqr(name, label, data = {});
async function getQuickReply(name, label, data = {});

/**
 * Read character card data
 * @note Returned data is not templated.
 *
 * @param {string | RegExp | number} [name=this_chid] - Character card name/ID.
 * @returns {Promise<v1CharData | null>} - The character card data.
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
 * Read World Info data
 * @note Returned data is not templated.
 *
 * @param {string} name - World Info name/UID.
 * @returns {Promise<WorldInfoData[]>} - List of World Info entries.
 */
async function getWorldInfoData(name);

/**
 * Read Quick Reply data
 * @note Returned data is not templated.
 *
 * @param {string | RegExp} name - Quick Reply set name/UID.
 * @returns {QuickReplySetLink | null} - The Quick Reply set data.
 */
function getQuickReplyData(name);

/**
 * Read World Info data, including only active parts.
 * @note Returned data is not templated.
 *
 * @param {string} name - World Info name/UID.
 * @param {(string|string[])} keyword - Keyword (content) used to activate World Info.
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation conditions.
 * @returns {Promise<WorldInfoData[]>} - List of activated World Info entries.
 */
async function getWorldInfoActivatedData(name, keyword, condition = {});

/**
 * Process string content with a template.
 *
 * @param {string} content - String content to process.
 * @param {Object} [data={}] - Data to pass.
 * @param {Object} [options={}] - EJS parameters.
 * @returns {Promise<string>} - Processed string content.
 */
async function evalTemplate(content, data = {}, options = {});

/**
 * Get all entries from World Info that might be used.
 * @note Even disabled entries are returned.
 *
 * @param {boolean} chara - Whether to include knowledge books embedded in character cards.
 * @param {boolean} global - Whether to include globally enabled World/Knowledge Books.
 * @param {boolean} persona - Whether to include the user persona's World Info.
 * @param {boolean} charaExtra - Whether to include additional knowledge books attached to character cards.
 * @returns {Promise<WorldInfoData[]>} - List of World Info entries.
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true);

/**
 * Output one or more strings.
 * @note Cannot be used inside <%- or <%= blocks.
 *
 * @param {string} args - String content.
 */
function print(...args);

/**
 * Activate World Info.
 * Requires a specific entry.
 *
 * @param {string} lorebook - World Info name.
 * @param {string | RegExp | number} title - Entry UID/title.
 * @param {boolean | undefined} constant - Force constant
 * @returns {Promise<WorldInfoData | null>} - The activated World Info entry.
 */
async function activewi(lorebook, title, constant = undefined);
async function activateWorldInfo(lorebook, title, constant = undefined);
async function activewi(title, constant = undefined);
async function activateWorldInfo(title, constant = undefined);

/**
 * Activate World Info conditions.
 * @typedef {Object} ActivateWorldInfoCondition
 * @property {boolean} [withConstant=false] - Whether to allow activating permanent 🔵 entries.
 * @property {boolean} [withDisabled=false] - Whether to allow activating disabled entries.
 * @property {boolean} [onlyDisabled=false] - Whether to activate only disabled entries (forces withDisabled option when enabled).
 */

/**
 * Activate World Info.
 * Activated by keywords.
 *
 * @param {string} worldinfo - World Info name.
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation options.
 * @returns {Promise<WorldInfoData[]>} - List of activated World Info entries.
 */
async function activateWorldInfoByKeywords(keywords, condition = {});

/**
 * Get all entries from currently enabled World Info sets.
 *
 * @param {boolean} chara - Whether to include built-in World Info from character cards.
 * @param {boolean} global - Whether to include globally enabled World Info.
 * @param {boolean} persona - Whether to include World Info bound to the user persona.
 * @param {boolean} persona - Whether to include external World Info attached to character cards.
 * @returns {Promise<WorldInfoData[]>} - List of World Info entries.
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true);

/**
 * Filter activated entries from a list of World Info entries.
 *
 * @param {WorldInfoData[]} entries - List of World Info entries.
 * @param {string | string[]} keywords - Content that activates the entries.
 * @param {ActivateWorldInfoCondition} [condition={}] - Activation conditions.
 * @returns {WorldInfoData[]} - List of activated World Info entries.
 */
function selectActivatedEntries(entries, keywords, condition = {});

/**
 * Get message content from a specific chat (floor).
 *
 * @param {number} idx - Chat (floor) message ID.
 * @param {'user' | 'assistant' | 'system' | undefined} role - Only select messages of a specific role; no filtering if not provided.
 * @returns {string} - Chat (floor) message content, returns empty string on failure.
 */
function getChatMessage(idx, role = undefined);

/**
 * Get a list of chat (floor) message contents within a specified range.
 *
 * @param {number} count - Number of chat (floor) messages.
 * @param {'user' | 'assistant' | 'system'} role - Only select messages of a specific role.
 * @param {number} start - Starting ID of the chat (floor) messages.
 * @param {number} end - Ending ID of the chat (floor) messages.
 * @returns {string[]} - List of chat (floor) message contents.
 */
function getChatMessages(count);
function getChatMessages(count, role);
function getChatMessages(start, end);
function getChatMessages(start, end, role);

/**
 * Regular expression options
 * Execution order: Start Generation -> basic -> generate -> Process Template -> LLM Response -> message -> Process Template -> Render Floor Message
 * Regular expressions injected in basic mode are automatically removed after prompt processing is complete.
 *
 * @typedef {Object} RegexOptions
 * @property {string} [uuid=undefined] - Unique ID; if same, modify, if different, create.
 * @property {number} [minDepth=NaN] - Minimum depth.
 * @property {number} [maxDepth=NaN] - Maximum depth.
 * @property {boolean} [user=true] - Applies to user input.
 * @property {boolean} [assistant=true] - Applies to AI output.
 * @property {boolean} [worldinfo=false] - Applies to World Info.
 * @property {boolean} [reasoning=false] - Applies to reasoning.
 * @property {boolean} [message=false] - Applies regex to raw floor messages (prompt template, supports replace functions).
 * @property {boolean} [generate=false] - Applies regex to generated messages (prompt template, supports replace functions).
 * @property {boolean} [basic=true] - Uses SillyTavern's built-in regex (SillyTavern implementation, does not support replace functions).
 * @property {number} [order=100] - Execution order, ascending
 * @property {boolean} [raw=true] - Allows processing of raw floor messages, requires enabling the message item
 * @property {boolean} [display=false] - Allows processing of floor message HTML, requires enabling the message item
 * @property {number} [sticky=0] - Stickiness.
 */

/**
 * Create temporary regular expressions during generation to process chat message content.
 *
 * @param {string | RegExp} pattern - Regular expression.
 * @param {string | ((substring: string, ...args: any[]) => string) } replace - Replacement content/replace function.
 * @param {RegexOptions} opts - Options.
 */
function activateRegex(pattern, string, opts = {});

/**
 * Add prompt injection.
 * Similar to World Info, but manually activated and placed.
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
 * Read injected prompt content.
 *
 * @param {string} key - Injection key (group).
 * @param {PostProcess[]} [postprocess=[]] - Content processing.
 * @returns {string} - The content of the injected prompt.
 */
function getPromptsInjected(key, postprocess = []);

/**
 * Check if a prompt injection exists.
 *
 * @param {string} key - Injection key (group).
 * @returns {boolean} - Whether the prompt injection exists.
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