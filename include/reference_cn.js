/**
 * 消息选择过滤器
 * @interface MessageFilter
 * @property {('system' | 'user' | 'assistant' | 'any')} [role='assistant'] - 选取指定角色. 
 *      可以是 'system', 'user', 'assistant', or 'any'. 从末尾开始搜索. 如果设置了id则此项会无效.
 * @property {number} [id=null] - 选取指定的消息楼层,可以是负数(负数为末尾开始).
 * @property {number} [swipe_id=null] - 选取指定消息的切换ID.
 */

/**
 * 设置变量选项
 * @typedef {Object} SetVarOption
 * @property {number} [index=null] - 变量的索引,与/setvar的index相同.
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} [scope='message'] - 变量类型(作用域),详见下方
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - 设置条件,不满足则不设置,详见下方
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - 返回值类型,详见下方
 * @property {MessageFilter} [withMsg=null] - 消息过滤器(如果要设置消息变量)
 * @property {boolean} [merge=false] - 是否使用合并来设置(_.merge)变量
 * @property {boolean} [dryRun=false] - 是否允许在准备阶段设置变量
 * @property {boolean} [noCache=false] - 禁用缓存(例如在设置变量后立即读取)
 */

/**
 * @typedef {('nx'|'xx'|'n'|'nxs'|'xxs')} FlagOption
 * @description 变量设置规则：nx=不存在才设, xx=存在才设, n=强制设等
 */

/**
 * @typedef {('global'|'local'|'message'|'cache'|'initial')} ScopeOption
 * @description 变量作用域
 */

/**
 * @typedef {('old'|'new'|'fullcache')} ResultOption
 * @description 返回值类型
 */

/**
 * @typedef {boolean} DryRun
 * @description 强制设置变量
 */

/**
 * @typedef {(FlagOption|ScopeOption|ResultOption|DryRun)} SimpleOptions
 * @description 快捷选项，支持 flags / scope / results / dryRun 三类简写
 */

/**
 * 设置变量
 * 
 * @examples
 *    setvar('a', 1);
 *    setvar('a', 1, 'nx');
 *    setvar('a', 1, { flags: 'nx' });
 *    setvar('a', 1, { scope: 'global' });
 *    setvar('a', 1, { scope: 'global', flags: 'nx' });
 *
 * @param {(string|null)} key - 变量名，基于 lodash 的 _.get 实现，null 表示整个替换变量树
 * @param {any} value - 变量值
 * @param {(SetVarOption|SimpleOptions)} [options={}] - 设置变量选项.
 * 
 * @returns 成功根据 options.results 决定，失败返回 undefined
 */
function setvar(key, value, options = {});
// 特定 options.scope 的别名
function setLocalVar(key, value, options = {});
function setGlobalVar(key, value, options = {});
function setMessageVar(key, value, options = {});


/**
 * 获取变量选项
 * @typedef {Object} GetVarOption
 * @property {number} [index=null] - 变量的索引,与/getvar的index相同
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} [scope='cache'] - 变量类型(作用域),详见下方
 * @property {any} [defaults=undefined] - 默认值(如果变量不存在时返回)
 * @property {MessageFilter} [withMsg=undefined] - 消息选择过滤器
 * @property {boolean} [noCache=false] - 禁用缓存(例如在设置变量后立即读取)
 * @property {boolean} [clone=false] - 返回深拷贝对象(否则返回引用)
 */

/**
 * 读取变量
 * @note: 应该避免修改对象引用
 * 
 * @examples
 *    getvar('a');
 *    getvar('a', 'nx');
 *    getvar('a', { flags: 'nx' });
 *    getvar('a', { scope: 'global' });
 *    getvar('a', { scope: 'global', defaults: 0 });
 *
 * @param {(string|null)} key - 变量名，基于 lodash 的 _.get 实现，null 表示整个获取变量树
 * @param {(GetVarOption|SimpleOptions)} [options={}] - 获取变量选项
 * @returns {any} - 变量值,找不到返回 options.defaults 的值(默认为undefined)
 */
function getvar(key, options = {});
// 特定 options.scope 的别名
function getLocalVar(key, options = {});
function getGlobalVar(key, options = {});
function getMessageVar(key, options = {});

/**
 * 更新变量选项
 * @typedef {Object} GetSetVarOption
 * @property {number} [index=null] - 变量的索引,与/getvar的index相同
 * @property {unknown} [defaults=0] - 如果变量不存在时使用的默认值
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} [inscope='cache'] - 读取的变量类型(作用域),详见下方
 * @property {'global' | 'local' | 'message' | 'cache' | 'initial'} outscope='message'] - 设置的变量类型(作用域),详见下方
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - 更新条件,不满足则不更新,详见下方
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - 返回值类型,详见下方
 * @property {MessageFilter} [withMsg=undefined] - 消息过滤器(如果要设置消息变量)
 * @property {boolean} [dryRun=false] - 是否允许在准备阶段更新变量
 * @property {boolean} [noCache=false] - 禁用缓存(例如在设置变量后立即读取)
 * @property {number} [min=null] - 最小值
 * @property {number} [max=null] - 最大值
 */

/**
 * 增加变量的值
 * 
 * @examples
 *    incvar('a');
 *    incvar('a', 1, { defaults: 1 });
 *
 * @param {string} key - 变量名，基于 lodash 的 _.get 实现
 * @param {number} [value=1] - 变量值
 * @param {(GetSetVarOption|SimpleOptions)} [options={}] - 更新变量选项
 * @returns 根据options.results决定, 失败返回undefined.
 */
function incvar(key, value = 1, options = {});
// 特定 options.outscope 的别名
function incLocalVar(key, value = 1, options = {});
function incGlobalVar(key, value = 1, options = {});
function incMessageVar(key, value = 1, options = {});

/**
 * 减少变量的值
 * 
 * @examples
 *    decvar('a.b');
 *    decvar('a.b', 1, { defaults: 1 });
 *
 * @param {string} key - 变量名，基于 lodash 的 _.get 实现
 * @param {number} [value=1] - 变量值
 * @param {(GetSetVarOption|SimpleOptions)} [options={}] - 更新变量选项
 * @returns 根据options.results决定, 失败返回 undefined.
 */
function decvar(key, value = 1, options = {});
// 特定 options.outscope 的别名
function decLocalVar(key, value = 1, options = {});
function decGlobalVar(key, value = 1, options = {});
function decMessageVar(key, value = 1, options = {});

/**
 * 执行 SillyTavern 命令, 例如 /setvar
 *
 * @param {string} cmd - 命令
 * @returns {Promise<string>} - 命令返回值
 */
async function execute(cmd);

/**
 * 读取世界书条目内容
 *
 * @param {string} lorebook - 世界书名(空字符串/不传递时为当前角色卡主要世界书)
 * @param {string | RegExp | number} title - 条目uid/标题
 * @param {Record<string, any>} [data={}] - 传递的数据
 * @returns {Promise<string>} - 世界书条目的内容, 失败返回空字符串
 */
async function getwi(lorebook, title, data = {});
async function getWorldInfo(lorebook, title, data = {});
async function getwi(title, data = {});
async function getWorldInfo(title, data = {});

/**
 * 读取角色卡定义
 *
 * @param {string | RegExp | number} [name=this_chid] - 角色卡名字/ID
 * @param {string} [template=DEFAULT_CHAR_DEFINE] - 输出格式
 * @param {Object} [data={}] - 传递的数据
 * @returns {Promise<string>} - 角色卡定义的内容, 失败返回空字符串
 */
async function getchar(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});
async function getChara(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});

/**
 * 读取预设的提示词内容
 *
 * @param {string | RegExp} name - 提示词的名字
 * @param {Object} [data={}] - 传递的数据
 * @returns {Promise<string>} - 预设的提示词的内容, 失败返回空字符串
 */
async function getpreset(name, data = {});
async function getPresetPrompt(name, data = {});

/**
 * 定义全局变量/函数
 * @note 一般用于在世界书内前置定义，然后在渲染时调用
 *
 * @param {string} name - 变量/函数名
 * @param {any} value - 变量/函数的内容
 * @param {boolean} [merge=false] - 是否使用合并来定义(_.merge), 已存在时尝试合并，否则覆盖
 * 
 * @note 定义函数时应该使用 this 访问上下文, 例如: this.variables, this.getvar, this.setvar
 */
function define(name, value, merge = false);

/**
 * 读取快速回复的内容
 * 只能读取已启用的快速回复集
 *
 * @param {string | RegExp} name - 快速回复集名字
 * @param {string | RegExp} label - 快速回复条目名字
 * @param {Object} [data={}] - 传递的数据
 * @returns {string} - 快速回复的内容, 失败返回空字符串
 */
async function getqr(name, label, data = {});
async function getQuickReply(name, label, data = {});

/**
 * 读取角色卡数据
 * @note 返回数据未进行模板处理
 *
 * @param {string | RegExp | number} [name=this_chid] - 角色卡名字/ID
 * @returns {Promise<v1CharData | null>} - 角色卡的数据，失败返回 null
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
 * 读取世界书数据
 * @note 返回数据未进行模板处理
 *
 * @param {string} name - 世界书的名字/uid
 * @returns {Promise<WorldInfoData[]>} - 世界书的条目列表，失败返回空数组
 */
async function getWorldInfoData(name);

/**
 * 读取快速回复数据
 * @note 返回数据未进行模板处理
 *
 * @param {string | RegExp} name - 世界书的名字/uid
 * @returns {QuickReplySetLink | null} - 世界书的数据，失败返回 null
 */
function getQuickReplyData(name);

/**
 * 读取世界书数据，并仅包含激活部分
 * @note 返回数据未进行模板处理
 *
 * @param {string} name - 世界书的名字/uid
 * @param {(string|string[])} keyword - 用于激活世界书的关键字(内容)
 * @param {ActivateWorldInfoCondition} [condition={}] - 激活条件
 * @returns {Promise<WorldInfoData[]>} - 世界书的条目列表，失败返回空数组
 */
async function getWorldInfoActivatedData(name, keyword, condition = {});

/**
 * 对字符串内容进行模板处理
 *
 * @param {string} content - 要处理的字符串内容
 * @param {Object} [data={}] - 传递的数据
 * @param {Object} [options={}] - ejs 参数
 * 
 * @errors 执行代码遇到异常会原样抛出
 * 
 * @returns {Promise<string>} - 处理后的字符串内容
 */
async function evalTemplate(content, data = {}, options = {});

/**
 * 获取所有可能会使用的世界书的全部条目
 * @note 即使是已禁用的条目也会返回
 *
 * @param {boolean} chara - 是否包含角色卡内嵌的知识书
 * @param {boolean} global - 是否包含全局启用的世界/知识书书
 * @param {boolean} persona - 是否包含用户角色的世界书
 * @param {boolean} charaExtra - 是否包含角色卡附加的知识书
 * @param {boolean} onlyExisting - 只包含已存在的世界/知识书书
 * @returns {Promise<WorldInfoData[]>} - 世界书的条目列表，失败返回空数组
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true, onlyExisting = true);

/**
 * 输出一个或更多字符串
 * @note 不能在 <%- 或者 <%= 语句块内使用
 *
 * @param {string} args - 字符串内容
 */
function print(...args);

/**
 * 激活世界书条目
 *
 * @param {string} lorebook - 世界书名
 * @param {string | RegExp | number} title - 条目uid/标题
 * @param {boolean} [force=false] - 强制激活世界书
 * @returns {Promise<WorldInfoData | null>} - 激活的世界书的条目，找不到条目返回 null
 */
async function activewi(lorebook, title, force = false);
async function activateWorldInfo(lorebook, title, force = false);
async function activewi(title, force = false);
async function activateWorldInfo(title, force = false);

/**
 * 激活世界书条件
 * null 表示不限制
 * @typedef {Object} ActivateWorldInfoCondition
 * @property {boolean | null} [constant=null] - 限制必须是/否 永久🔵 条目
 * @property {boolean | null} [disabled=null] - 限制必须是/否 禁用 条目
 * @property {boolean | null} [vectorized=null] - 限制必须是/否 🔗向量化 条目
 */

/**
 * 激活世界书
 * 通过关键字激活
 *
 * @param {string} worldinfo - 世界书名
 * @param {ActivateWorldInfoCondition} [condition={}] - 激活选项
 * @returns {Promise<WorldInfoData[]>} - 激活的世界书的条目列表，找不到条目返回空数组
 */
async function activateWorldInfoByKeywords(keywords, condition = {});

/**
 * 获取当前已开启的世界书的所有条目集合
 *
 * @param {boolean} chara - 是否包含角色卡的内置世界书
 * @param {boolean} global - 是否包全局启用的世界书
 * @param {boolean} persona - 是否包用户角色绑定的世界书
 * @param {boolean} persona - 是否包含角色卡的外挂世界书
 * @param {boolean} onlyExisting - 只包含已存在的世界/知识书书
 * @returns {Promise<WorldInfoData[]>} - 世界书的条目列表，失败返回空数组
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true, onlyExisting = true);

/**
 * 从世界书条目列表筛选出激活的条目
 *
 * @param {WorldInfoData[]} entries - 世界书条目列表
 * @param {string | string[]} keywords - 用户激活的内容
 * @param {ActivateWorldInfoCondition} [condition={}] - 激活条件
 * @returns {WorldInfoData[]} - 被激活的世界书的条目列表，找不到条目返回空数组
 */
function selectActivatedEntries(entries, keywords, condition = {});

/**
 * 获取指定聊天(楼层)消息内容
 *
 * @param {number} idx - 聊天(楼层)消息ID
 * @param {'user' | 'assistant' | 'system' | undefined} role - 仅选取指定角色的消息，不提供则不过滤
 * @returns {string} - 聊天(楼层)消息内容，失败返回空字符串
 */
function getChatMessage(idx, role = undefined);

/**
 * 获取指定范围内聊天(楼层)消息内容列表
 *
 * @param {number} count - 聊天(楼层)消息数量
 * @param {'user' | 'assistant' | 'system'} role - 仅选取指定角色的消息
 * @param {number} start - 聊天(楼层)消息开始位置ID
 * @param {number} end - 聊天(楼层)消息结束位置ID
 * @returns {string[]} - 聊天(楼层)消息内容列表，失败返回空数组
 */
function getChatMessages(count);
function getChatMessages(count, role);
function getChatMessages(start, end);
function getChatMessages(start, end, role);

/**
 * 正则表达式选项
 * 执行顺序：开始生成 -> basic -> generate -> 处理模板 -> LLM响应 -> message -> 处理模板 -> 渲染楼层消息
 * 提示词处理完毕后会自动删除basic模式注入的正则
 *
 * @typedef {Object} RegexOptions
 * @property {string} [uuid=undefined] - 唯一ID，相同则修改，不同则创建
 * @property {number} [minDepth=NaN] - 最小深度
 * @property {number} [maxDepth=NaN] - 最大深度
 * @property {boolean} [user=true] - 对用户输入生效
 * @property {boolean} [assistant=true] - 对AI输出生效
 * @property {boolean} [worldinfo=false] - 对世界信息生效
 * @property {boolean} [reasoning=false] - 对推理生效
 * @property {boolean} [message=false] - 对楼层消息应用正则（扩展实现、支持替换函数）
 * @property {boolean} [generate=false] - 对生成消息应用正则（扩展实现、支持替换函数）
 * @property {boolean} [basic=true] - 使用酒馆内置正则（酒馆实现、不支持替换函数）
 * @property {number} [order=100] - 执行顺序，升序执行
 * @property {boolean} [before=true] - 允许对原始楼层消息进行处理，需要开启 message 项
 * @property {boolean} [html=false] - 允许对楼层消息HTML进行处理，需要开启 message 项
 * @property {number} [sticky=0] - 粘性
 */

/**
 * 在生成时创建临时正则表达式，对聊天消息内容进行处理
 *
 * @param {string | RegExp} pattern - 正则表达式
 * @param {string | ((substring: string, ...args: any[]) => string) } replace - 替换内容/替换函数
 * @param {RegexOptions} opts - 选项
 */
function activateRegex(pattern, string, opts = {});

/**
 * 添加提示词注入
 * 功能类似世界书，但为手动激活以及放置
 *
 * @param {string} key - 注入键(组)
 * @param {string} prompt - 提示词内容
 * @param {number} [order=100] - 顺序
 * @param {number} [sticky=0] - 黏性
 * @param {string} [uid=''] - 唯一ID
 */
function injectPrompt(key, prompt, order = 100, sticky = 0, uid = '');

/**
 * 内容处理器
 * @typedef {Object} PostProcess
 * @property {(string|RegExp)} search - 搜索的内容
 * @property {string} replace - 替换的内容
 */

/**
 * 读取提示词注入
 *
 * @param {string} key - 注入键(组)
 * @param {PostProcess[]} [postprocess=[]] - 内容处理
 * @returns {string} - 已注入的提示词内容
 */
function getPromptsInjected(key, postprocess = []);

/**
 * 检查提示词注入是否存在
 *
 * @param {string} key - 注入键(组)
 * @returns {boolean} - 提示词注入是否存在
 */
function hasPromptsInjected(key);

/**
 * @interface GetChatMessageOptions
 * @property {number} [start=-2] - 开始位置
 * @property {number} [end=null] - 结束位置
 * @property {'user'|'assistant'|'system'} [role=null] - 仅选择指定角色
 * @property {boolean} [and] - 如果 pattern 是数组时有效，是否需要完全匹配，否则为匹配任意一个
 */

/**
 * 从楼层消息中查找是否存在指定内容
 * @see getChatMessages
 * 
 * @param {string|RegExp|(string|RegExp)[]} pattern - 搜索关键字
 *   - 单个字符串: 字符串搜索
 *   - 单个正则: 正则搜索
 *   - 数组: 根据 options.and 决定是匹配一个或者是完全匹配
 * @param {GetChatMessageOptions} [options={}] - 选项
 * @returns {boolean} 符合匹配项则返回true，否则false
 */
function matchChatMessages(pattern, options = {});

/*
 * 一个更宽松的 JSON Parser 实现，可以一定程度上解析 LLM 输出的格式错误的 JSON 字符串
 * 
 * @see JSON.parse
 *
 * @param {string} text - 要进行解析的 JSON 字符串
 * @returns {(object|array|string|null|number|boolean)} - 解析结果
*/
function parseJSON(text);

/*
 * 对 dest 应用 JSON Patch 修改，返回修改后的 dest
 * 不会原地修改 dest，而是返回新的 object
 * @see https://www.rfc-editor.org/rfc/rfc6902
 *
 * @param {object} dest - 要被修改的 object
 * @param {object[]} change - JSON Patch 操作列表
 * @returns {object} - 修改后的 object
*/
function jsonPatch(dest, change);

/*
 * 对变量应用 JSON Patch 修改
 * @see jsonPatch
 * @see setvar
 *
 * @param {(string|null)} key - 要被修改的变量，null 则表示修改整个变量树
 * @param {object[]} change - JSON Patch 操作列表
 * @param {SetVarOption} [options={}] - 修改变量传递的参数
 * @returns 返回值由 options 决定
*/
function patchVariables(key, change, options = {});

/**
 * 删除变量
 * 如果 key 对应变量是 object/array 则删除 index 对应属性/值
 * 如果 key 对应变量是 string 则从变量中删除 index 子串
 * 提供 index 但不存在时不做任何事情，也不会抛出异常
 * 
 * @param {string} key - 变量名
 * @param {string|number} [index=undefined] - 索引，未指定则删除对应的整个变量
 * @param {SetVarOption} [options={}] - 设置变量的选项
 * @returns 根据options.results决定, 失败返回undefined.
 */
function delvar(key, index = undefined, options = {});

// 对应的特化版本
function delLocalVar(key, index = undefined, options = {});
function delGlobalVar(key, index = undefined, options = {});
function delMessageVar(key, index = undefined, options = {});

/**
 * 在变量中插入元素
 * 如果 key 对应变量是 object 则用 index 作为 object 的 key，将 value 设置进去
 * 如果 key 对应变量是 array 则在 index 位置插入 value
 * 如果 key 对应变量是 string 则在 index 位置插入 value
 * 其他类型或者 index 不存在则不做任何事情，也不会抛出异常
 * 
 * @param {string} key - 变量名
 * @param {any} value - 要插入的值
 * @param {string|number} [index=undefined] - 索引，未指定则在末尾插入
 * @param {SetVarOption} [options={}] - 设置变量的选项
 * @returns 根据options.results决定, 失败返回undefined.
 */
function insvar(key, value, index = undefined, options = {});

// 对应的特化版本
function insertLocalVar(key, value, index = undefined, options = {});
function insertGlobalVar(key, value, index = undefined, options = {});
function insertMessageVar(key, value, index = undefined, options = {});

/**
 * 为变量设置zod格式验证，之后的所有修改变量操作如果验证失败会抛出异常
 * 为了兼容性，root必须是 loose
 * 
 * @param {z.ZodType<object>|object} schema - 变量 root 的 zod 结构
 */
function setVariableSchema(schema);

/**
 * 全部变量合集
 * 根据以下顺序(优先级)合并变量, 高优先级覆盖低优先级的同名变量:
 * 1.消息变量(楼层号从末尾到开头)
 * 2.局部(聊天)变量
 * 3.全局变量
 * 
 * @note: 处理楼层消息变量时此值不包含当前以及之后的楼层变量
 *        冲突处理: 类型同为 [] 或者 {} 则合并，否则替换
 * @see: https://lodash.com/docs/4.17.15#merge
 * @type {object}
 */
variables = {}

/**
 * 酒馆的 SillyTavern.getContext() 返回内容
 * 详细内容可在控制台里输入 SillyTavern.getContext() 查看
 */
SillyTavern = SillyTavern.getContext()

/**
 * faker 库的内容,用于生成随机内容
 * 使用方式: faker.fakerEN, faker.fakerCN 等
 * 例如: faker.fakerEN.lastName() 获取一个随机英文名
 * @see: https://fakerjs.dev/api/
 * @type {object}
 */
faker = require("faker")

/*
 * Lodash 库
 * 使用方式: _.get, _.set 等
 * 例如: _.toArray('abc') 输出 ['a','b','c']
 * @see: https://lodash.com/docs/4.17.15
 */
_ = require("lodash")

/*
 * JQuery 库
 * 使用方法: $()
 * 例如 $('.mes_text') 获取文本框
 * @see: https://api.jquery.com/
 */
$ = require("JQuery")

/*
 * toastr 库
 * 使用方式: toastr.info, toastr.error
 * 例如: toastr.info('hello world')
 * @see: https://codeseven.github.io/toastr/
 */
toastr = require("toastr")

/**
 * 模板计算时的阶段
 * generate: 生成阶段
 * preparation: 准备阶段
 * render: 渲染(楼层消息)阶段
 * @type {(String|undefined)}
 */
runType = 'generate' | 'preparation' | 'render'

/*
 * 角色卡内嵌的世界书名字
 * 未绑定时为 undefined
 * @type {(String|undefined)}
 */
charLoreBook = ''

/*
 * 用户角色绑定的世界书名字
 * 未绑定时为 undefined
 * @type {(String|undefined)}
 */
userLoreBook = ''

/*
 * 聊天文件绑定的世界书名字
 * 未绑定时为 undefined
 * @type {(String|undefined)}
 */
chatLoreBook = ''

/*
 * 用户角色名字
 * @type {String}
 */
userName = 'User'

/*
 * 角色卡角色名字
 * @type {String}
 */
charName = 'SillyTavern System'

/*
 * 聊天会话ID
 * @type {String}
 */
chatId = ''

/*
 * 角色卡ID
 * @type {String}
 */
characterId = ''

/*
 * 群聊ID
 * @type {(String|null)}
 */
groupId = null

/*
 * 群聊状态信息
 * @type {array}
 */
groups = []

/*
 * 角色卡头像
 * @type {string}
 */
charAvatar = ""

/*
 * 用户头像
 * @type {string}
 */
userAvatar = ""

/*
 * 最新用户消息ID
 * @type {number}
 */
lastUserMessageId = 0

/*
 * 最新角色消息ID
 * @type {number}
 */
lastCharMessageId = 0

/*
 * 当前选择的模型
 */
model = 'gpt-3.5'

/*
 * 当前生成类型
 * 不是生成为空字符串
 */
generateType = '' | 'custom' | 'normal' | 'continue' | 'impersonate' | 'regenerate' | 'swipe' | 'quiet';

/*
 * 消息ID(即楼层号)
 */
message_id = 0

/*
 * 消息页码ID
 */
swipe_id = 0

/*
 * 消息角色名
 */
name = 'User'

/*
 * 消息是否为最后一条
 */
is_last = false

/*
 * 消息是否为最后一条
 */
is_last = false

/*
 * 消息是否为用户
 */
is_user = false

/*
 * 消息是否为系统
 */
is_system = false