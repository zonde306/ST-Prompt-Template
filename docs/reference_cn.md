# 内置函数

```javascript
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
```

> `flags` 类型:
>
> - `nx`: **不存在**时设置 (以 `scope=cache`为准)
>
> - `xx`: **存在**时设置  (以 `scope=cache`为准)
>
> - `n`: 直接设置 (不做检查)
>
> - `nxs`: **不存在**时设置 (以对应的 `scope`为准)
>
> - `xxs`: **存在**时设置 (以对应的 `scope`为准)
>
> ---
>
> `scope`/`inscope`/`scope` 类型:
>
> `global`: 全局变量 (酒馆的 `extension_settings.variables.global`).
>
> `local`: 局部(聊天)变量 (酒馆的 `chat_metadata.variables`).
>
> `message`: 消息变量 (扩展添加的 `chat[msg_id].variables[swipe_id]`).
>
> `cache`: 临时变量 (模板的 `variables`, 例如 `<% variables.变量名 %>`).
>
> `initial`：初始变量，由`[InitialVariables]`提供
>
> - 临时变量**不会保存**，结束后生成会失效
> - 无论`scope`选择哪个都会更新临时变量
>
> ---
>
> `results` 类型:
>
> `old`: 返回旧的值(没有就返回 `undefined`)
>
> `new`: 返回新的值(也就是传入的 `value`)
>
> `fullcache`: 返回更新后的整个缓存`variables`的内容
>
> ---
>
> `dryRun`:
>
> 酒馆在准备阶段会多次进行世界书/预设/角色卡计算，如果允许在准备阶段进行设置变量，会导致变量被设置多次
>
> 如果无特殊需求，则不需要将其设置为`true`
>
> **更新楼层消息时不会被视为准备阶段**
>
> ---
>
> `define`:
>
> 如果定义的是函数，需要遵循以下规则：
>
> - 必须使用`function`语句来定义，例如`define('myfunc', function() { ... })`
> - 访问`getvar`、`setvar`等变量和属性时必须使用`this`，例如`this.getvar(...)`、`this.setvar(...)`
> - ~~不建直接使用`variables`，因为它在函数内不会被更新(例如在调用`setvar`之后)，而是使用`this.getvar(...)~~
>
> ---
>
> `noCache`:
>
> 在设置变量后，如果需要立即访问新的值，则需要禁用缓存(`noCache=true`)
>
> 缓存并不会立即更新，只会在开始时加载，中途不会更新
>
> ---
>
> `getwi`、`getWorldInfo`：
>
> 在递归导入时，`worldinfo`能够自动推断为当前世界书名，只需要传递空值即可
>
> 递归仅包含`getwi`、`getWorldInfo`这两者，由酒馆自己激活的不包含在内
>
> 例如：
>
> `测试世界书`：`测试条目1
>
> ```javascript
> // 由酒馆激活时必须提供 worldinfo
> <%- await getwi('测试世界书', '测试条目2') -%>
> ```
>
> `测试世界书`：`测试条目2`
>
> ```javascript
> // 若不提供 worldinfo 则自动判断
> <%- await getwi('测试条目3') -%>
> ```
>
> `测试世界书`：`测试条目3`
>
> ```javascript
> <%- 'hello world!' -%>
> ```
>
> 以上输出：
>
> ```
> hello world!
> ```

---

```javascript
// 默认的角色卡定义输出格式
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

> `name`: 角色名
>
> `system_prompt`: 提示词覆盖
>
> `personality`: 角色设定摘要
>
> `description`: 角色描述
>
> `scenario`: 情景
>
> `first_message`: 第一条消息
>
> `message_example`: 对话示例
>
> `creatorcomment`: 创作者的注释
>
> `alternate_greetings[]`: 额外的消息列表
>
> `depth_prompt`: 角色备注

---

# 内置常量

也就是全局常量，可以用`<% xxx %>`访问

```javascript
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
 * render_permanent: 渲染(楼层消息)的特殊，此阶段会永久修改消息
 * @type {(String|undefined)}
 */
runType = 'generate' | 'preparation' | 'render' | 'render_permanent'

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
 * @note 聊天的文件名，不带 .json后缀
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
 * 角色卡头像 URL
 * @type {string}
 */
charAvatar = ""

/*
 * 用户头像 URL
 * @type {string}
 */
userAvatar = ""

/*
 * 最新用户消息ID
 * @note 也就是楼层ID
 * @type {number}
 */
lastUserMessageId = 0

/*
 * 最新角色消息ID
 * @note 也就是楼层ID
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
 * 最后一条用户消息的内容
 * 没有则为空字符串
 * @type {string}
 */
lastUserMessage = '';

/*
 * 最后一条角色消息的内容
 * 没有则为空字符串
 * @type {string}
 */
lastCharMessage = '';

/*
 * 最后一条消息的 ID
 * 没有则为 -1
 * @type {number}
 */
lastMessageId = 0;
```

只有在 `runType` 为 `render` 时才会出现的字段

```javascript
/*
 * 消息ID (即楼层号)
 * @type {number}
 */
message_id = 0

/*
 * 消息页码ID
 * @type {number}
 */
swipe_id = 0

/*
 * 消息对应的角色名
 * @type {string}
 */
name = 'User'

/*
 * 消息是否为最后一条
 * @type {boolean}
 */
is_last = false

/*
 * 消息是否为用户
 * @type {boolean}
 */
is_user = false

/*
 * 消息是否为系统
 * @type {boolean}
 */
is_system = false
```

只有在 `@@generate_*`/`[GENERATE:*]` 时才会出现的字段

```javascript
/*
 * 当前正在处理的世界书条目对象
 * @type {WorldInfoEntry}
 */
world_info: {}

/*
 * 当前已处理的上文内容
 * @type {string}
 */
generateBuffer = ''

/*
 * 当前生成内容
 * 未经过模板处理
 * @type {({ role: string, content: string })[]}
 */
generateData = [{ role: '', content: '' }]
```

---

# 特殊变量

> 这里的变量不应该自行修改

当提示词处理完毕后，将会设置以下全局变量

```javascript
/*
 * 上次生成时输入的(处理后的) token 数量
 * @note 计费的实际数量
 */
LAST_SEND_TOKENS = 0

/*
 * 上次生成时输入的(处理后的) 提示词 字符数
 */
LAST_SEND_CHARS = 0

/*
 * 上次生成时输出的(处理后的) token 数量
 * @note 并非计费的实际数量
 */
LAST_RECEIVE_TOKENS = 0

/*
 * 上次生成时输出的(处理后的) 提示词 字符数
 */
LAST_RECEIVE_CHARS = 0
```

---

# STscript命令

## /ejs

```
/ejs [ctx=object]? [block=boolean]? code
```

执行 `ejs` 代码

命名参数：

- `ctx` 执行上下文(传入参数)，例如：`ctx={ a: 1, b: 2 }`然后就能在代码里面访问：`a的值为: <%= a %>, b的值为:<%= b %>`

- `block`是否视为整个代码块，如果为`true`时自动为`code`参数在外侧补上`<%= ... %>`符号，例如：`block=true`时`variables.a`会被视为`<%= variables.a %>`

未命名参数：

- `code`即为代码内容

### 示例

```
// 输出 "hello world"
/ejs <%= hello world %>

// 输出 a=1
/ejs ctx="{ a : 1 }" "a=<%= a %>"

// 输出 b=2
/ejs ctx="{ b : 2 }" "`b=${b}`"
```

---

## /ejs-refresh

重新读取全部世界书，并重新进行处理

> 一般不需要使用，因为修改世界书后会自动重新加载并进行处理

---

# 导出函数

扩展导出的函数，可在其他扩展中访问

这些函数在 `globalThis.EjsTemplate`作用域内

```javascript
/**
 * @typedef {Object} IncluderResult
 * @property {string} filename - 最终解析的路径
 * @property {string} template - 包含的内容
 */

/**
 * @typedef {Object} EjsOptions
 * @property {boolean} [cache] - Compiled functions are cached, requires `filename`
 * @property {string} [filename] - The name of the file being rendered. Not required if you are using renderFile(). Used by cache to key caches, and for includes.
 * @property {string|string[]} [root] - Set template root(s) for includes with an absolute path (e.g, /file.ejs). Can be array to try to resolve include from multiple directories.
 * @property {string[]} [views] - An array of paths to use when resolving includes with relative paths.
 * @property {Record<string, unknown>} [context] - Function execution context
 * @property {boolean} [compileDebug] - When false no debug instrumentation is compiled
 * @property {string} [delimiter] - When true, compiles a function that can be rendered in the browser without needing to load the EJS Runtime (ejs.min.js).
 * @property {boolean} [client] - Character to use for inner delimiter, by default '%'
 * @property {string} [openDelimiter] - Character to use for opening delimiter, by default '<'
 * @property {string} [closeDelimiter] - Character to use for closing delimiter, by default '>'
 * @property {boolean} [debug] - Outputs generated function body
 * @property {boolean} [strict] - When set to true, generated function is in strict mode
 * @property {boolean} [_with] - Whether or not to use with() {} constructs. If false then the locals will be stored in the locals object. Set to false in strict mode.
 * @property {string[]} [destructuredLocals] - An array of local variables that are always destructured from the locals object, available even in strict mode.
 * @property {string} [localsName] - Name to use for the object storing local variables when not using with Defaults to locals
 * @property {boolean} [rmWhitespace] - Remove all safe-to-remove whitespace, including leading and trailing whitespace. It also enables a safer version of -%> line slurping for all scriptlet tags (it does not strip new lines of tags in the middle of a line).
 * @property {function(string): string} [escape] - The escaping function used with <%= construct. It is used in rendering and is .toString()ed in the generation of client functions. (By default escapes XML).
 * @property {string} [outputFunctionName] - Set to a string (e.g., 'echo' or 'print') for a function to print output inside scriptlet tags.
 * @property {boolean} [async] - When true, EJS will use an async function for rendering. (Depends on async/await support in the JS runtime).
 * @property {function(string, string): IncluderResult} [includer] - Custom function to handle EJS includes, receives (originalPath, parsedPath) parameters, where originalPath is the path in include as-is and parsedPath is the previously resolved path. Should return an object { filename, template }, you may return only one of the properties, where filename is the final parsed path and template is the included content.
 */

/**
 * @typedef {Object} EvalTemplateOptions
 * @property {function(string): string} [escaper]
 * @property {function(string, string): IncluderResult} [includer]
 * @property {boolean} [logging]
 * @property {string} [when]
 * @property {EjsOptions} [options]
 * @property {string} [disableMarkup]
 * @property {FunctionSandbox|null} [sandbox]
 */

/**
 * 对文本进行模板语法处理
 * @note data 一般从 prepareContext 获取，若要修改则应直接修改原始对象
 * @see prepareContext
 * 
 * @errors 代码异常会原样抛出
 *
 * @param {string} code - 模板代码
 * @param {object} [context={}] - 执行环境(上下文)
 * @param {EvalTemplateOptions} [options={}] - ejs 参数
 * @returns {string} 对模板进行计算后的内容
 */
async function evalTemplate(code, context = {}, options = {});

/**
 * 创建模板语法处理使用的执行环境(上下文)
 * @see evalTemplate
 *
 * @param {object} [context={}] - 附加的执行环境(上下文)
 * @param {last_message_id} [number=65535] - 合并消息变量的最大ID
 * @returns {object} 执行环境(上下文)
 */
async function prepareContext(context = {}, last_message_id = 65535);

/**
 * 检查模板是否存在语法错误
 * 并不会实际执行
 *
 * @param {string} content - 模板代码
 * @param {number} [max_lines=4] - 发生错误时输出的附近行数
 * @returns {string} 语法错误信息，无错误返回空字符串
 */
async function getSyntaxErrorInfo(code, max_lines = 4);

/**
 * @typedef {Object} EjsSettings
 * @property {boolean} enabled - 是否启用扩展
 * @property {boolean} generate_enabled - 处理生成内容
 * @property {boolean} generate_loader_enabled - 生成时注入 [GENERATE] 世界书条目
 * @property {boolean} render_enabled - 处理楼层消息
 * @property {boolean} render_loader_enabled - 渲染楼层时注入 [RENDER] 世界书条目
 * @property {boolean} with_context_disabled - 禁用with语句块
 * @property {boolean} debug_enabled - 控制台显示详细信息
 * @property {boolean} autosave_enabled - 自动保存变量更新
 * @property {boolean} preload_worldinfo_enabled - 立即加载世界书
 * @property {boolean} code_blocks_enabled - 处理代码块
 * @property {boolean} raw_message_evaluation_enabled - 处理原始消息内容
 * @property {boolean} filter_message_enabled - 生成时忽略楼层消息处理
 * @property {number} cache_enabled - 缓存（实验性） (0=经验, 1=全部, 2=仅世界书)
 * @property {number} cache_size - 缓存大小
 * @property {string} cache_hasher - 缓存Hash函数 (h32ToString, h64ToString)
 * @property {boolean} inject_loader_enabled - 生成时注入 @INJECT 世界书条目
 * @property {boolean} invert_enabled - 旧设定兼容模式，世界书中的GENERATE/RENDER/INJECT条目禁用时视为启用
 * @property {boolean} compile_workers - 是否启用后台编译（用web workers编译）
 * @property {boolean} sandbox - 是否启用沙盒执行代码（性能下降，提升安全性）
 */

/**
 * 从外部修改扩展设置(开启或关闭功能)
 *
 * @param {EjsSettings} features - 设置选项
 */
function setFeatures(features = {});

/**
 * 获取 variables 对象
 *
 * @param {number} end - 结束楼层
 * @returns {object} 变量对象
 */
function allVariables(end = Infinity);

/**
 * 将所有设置恢复到默认状态
 */
function resetFeatures();

/**
 * 重新加载所有世界书，并重新进行处理
 */
async function refreshWorldInfo();

/*
 * 所有通过 define 创建的全局变量/函数
 * @note 返回的是引用，也就是可以外部修改
*/
defines = {};

/*
 * 所有通过 InitialVariables 创建的初始变量
 * @note 返回的是引用
*/
initialVariables = {};

/*
 * 保存修改的变量
 * 如果调用过 setvar 则必须调用它
 * @see evalTemplate
*/
async function saveVariables();

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

/**
 * 获取当前扩展设置
 *
 * @returns {EjsSettings} - 当前设置
 */
function getFeatures();

/**
 * 编译代码
 *
 * @param {string} code - 代码内容
 * @param {EvalTemplateOptions} [options] - 编译选项
 *
 * @returns {((data: object) => string)} - 编译后的函数体
 */
async function compileTemplate(code, options = {});
```

> 可通过 `globalThis.EjsTemplate`访问这些函数（如 `EjsTemplate.evalTemplate`）
>
> 若要在 `evalTemplate`时修改已准备好的`context`应该直接修改原有对象，而不是传递一个新的对象
>
> ❌错误用法：
>
> ```javascript
> const env = await prepareContext();
> await evalTemplate('a is <%= a %>', { ...env, a: 1 });
> ```
>
> ✅正确用法：
>
> ```javascript
> const env = await prepareContext();
> // 使用 lodash 的 merge 原地修改
> await evalTemplate('a is <%= a %>', _.merge(env, { a: 1 }));
> ```
>
> 或者直接在 `prepareContext` 设置
>
> ```javascript
> const env = await prepareContext({ a: 1 });
> await evalTemplate('a is <%= a %>', env);
> ```

---

# 备注

1. 准备阶段和生成阶段都会触发世界书计算
2. 渲染阶段不会触发世界书计算
3. `define`执行后会在刷新/关闭页面前一直有效，但是需要注意外层闭包的影响
