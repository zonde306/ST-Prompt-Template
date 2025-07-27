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
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='message'] - 变量类型(作用域),详见下方
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - 设置条件,不满足则不设置,详见下方
 * @property {'old' | 'new' | 'fullcache'} [results='new'] - 返回值类型,详见下方
 * @property {MessageFilter} [withMsg=null] - 消息过滤器(如果要设置消息变量)
 * @property {boolean} [merge=false] - 是否使用合并来设置(_.merge)变量
 * @property {boolean} [dryRun=false] - 是否允许在准备阶段设置变量
 * @property {boolean} [noCache=false] - 禁用缓存(例如在设置变量后立即读取)
 */

/**
 * 设置变量
 *
 * @param {string} key - 变量名
 * @param {any} value - 变量值
 * @param {SetVarOption} [options={}] - 设置变量选项.
 * @returns 成功根据options.results决定，失败返回undefined
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
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='cache'] - 变量类型(作用域),详见下方
 * @property {any} [defaults=undefined] - 默认值(如果变量不存在时返回)
 * @property {MessageFilter} [withMsg=undefined] - 消息选择过滤器
 * @property {boolean} [noCache=false] - 禁用缓存(例如在设置变量后立即读取)
 * @property {boolean} [clone=false] - 返回深拷贝对象(否则返回引用)
 */

/**
 * 读取变量
 * @note: 应该避免修改对象引用
 *
 * @param {string} key - 变量名
 * @param {GetVarOption} [options={}] - 获取变量选项
 * @returns {any} - 变量值,找不到返回options.defaults的值
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
 * @property {'global' | 'local' | 'message' | 'cache'} [inscope='cache'] - 读取的变量类型(作用域),详见下方
 * @property {'global' | 'local' | 'message' | 'cache'} outscope='message'] - 设置的变量类型(作用域),详见下方
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
 * @param {string} key - 变量名
 * @param {number} [value=1] - 变量值
 * @param {GetSetVarOption} [options={}] - 更新变量选项
 * @returns 根据options.results决定,失败返回undefined.
 */
function incvar(key, value = 1, options = {});
// 特定 options.outscope 的别名
function incLocalVar(key, value = 1, options = {});
function incGlobalVar(key, value = 1, options = {});
function incMessageVar(key, value = 1, options = {});

/**
 * 减少变量的值
 *
 * @param {string} key - 变量名
 * @param {number} [value=1] - 变量值
 * @param {GetSetVarOption} [options={}] - 更新变量选项
 * @returns 根据options.results决定,失败返回undefined.
 */
function decvar(key, value = 1, options = {});
// 特定 options.outscope 的别名
function decLocalVar(key, value = 1, options = {});
function decGlobalVar(key, value = 1, options = {});
function decMessageVar(key, value = 1, options = {});

/**
 * 执行命令,例如/setvar
 *
 * @param {string} cmd - 命令
 * @returns {Promise<string>} - 命令返回值
 */
async function execute(cmd);

/**
 * 读取世界书条目内容
 *
 * @param {string} lorebook - 世界书名(递归时可传递空值，自动推断为当前世界书)
 * @param {string | RegExp | number} title - 条目uid/标题
 * @param {Record<string, any>} [data={}] - 传递的数据
 * @returns {Promise<string>} - 世界书条目的内容
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
 * @returns {Promise<string>} - 角色卡定义的内容
 */
async function getchr(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});
async function getChara(name = this_chid, template = DEFAULT_CHAR_DEFINE, data = {});

/**
 * 读取预设的提示词内容
 *
 * @param {string | RegExp} name - 提示词的名字
 * @param {Object} [data={}] - 传递的数据
 * @returns {Promise<string>} - 预设的提示词的内容
 */
async function getprp(name, data = {});
async function getPresetPrompt(name, data = {});

/**
 * 定义全局变量/函数
 * @note 一般用于在世界书内前置定义，然后在渲染时调用
 *
 * @param {string} name - 变量/函数名
 * @param {any} value - 变量/函数的内容
 * @param {boolean} [merge=false] - 是否使用合并来定义(_.merge)
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
 * @returns {string} - 快速回复的内容
 */
async function getqr(name, label, data = {});
async function getQuickReply(name, label, data = {});

/**
 * 读取角色卡数据
 * @note 返回数据未进行模板处理
 *
 * @param {string | RegExp | number} [name=this_chid] - 角色卡名字/ID
 * @returns {Promise<v1CharData | null>} - 角色卡的数据
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
 * 读取世界书数据
 * @note 返回数据未进行模板处理
 *
 * @param {string} name - 世界书的名字/uid
 * @returns {Promise<WorldInfoData[]>} - 世界书的条目列表
 */
async function getWorldInfoData(name);

/**
 * 读取快速回复数据
 * @note 返回数据未进行模板处理
 *
 * @param {string | RegExp} name - 世界书的名字/uid
 * @returns {QuickReplySetLink | null} - 世界书的数据
 */
function getQuickReplyData(name);

/**
 * 读取世界书数据，并仅包含激活部分
 * @note 返回数据未进行模板处理
 *
 * @param {string} name - 世界书的名字/uid
 * @param {(string|string[])} keyword - 用于激活世界书的关键字(内容)
 * @param {ActivateWorldInfoCondition} [condition={}] - 激活条件
 * @returns {Promise<WorldInfoData[]>} - 世界书的条目列表
 */
async function getWorldInfoActivatedData(name, keyword, condition = {});

/**
 * 对字符串内容进行模板处理
 *
 * @param {string} content - 要处理的字符串内容
 * @param {Object} [data={}] - 传递的数据
 * @param {Object} [options={}] - ejs 参数
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
 * @returns {Promise<WorldInfoData[]>} - 世界书的条目列表
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true);

/**
 * 输出一个或更多字符串
 * @note 不能在 <%- 或者 <%= 语句块内使用
 *
 * @param {string} args - 字符串内容
 */
function print(...args);

/**
 * 激活世界书
 * 需要提具体条目
 *
 * @param {string} lorebook - 世界书名
 * @param {string | RegExp | number} title - 条目uid/标题
 * @returns {Promise<WorldInfoData | null>} - 激活的世界书的条目
 */
async function activewi(lorebook, title);
async function activateWorldInfo(lorebook, title);
async function activewi(title);
async function activateWorldInfo( title);

/**
 * 激活世界书条件
 * @typedef {Object} ActivateWorldInfoCondition
 * @property {boolean} [withConstant=false] - 是否允许激活永久🔵条目
 * @property {boolean} [withDisabled=false] - 是否允许激活禁用条目
 * @property {boolean} [onlyDisabled=false] - 是否仅激活禁用条目(启用时强制启用withDisabled选项)
 */

/**
 * 激活世界书
 * 通过关键字激活
 *
 * @param {string} worldinfo - 世界书名
 * @param {ActivateWorldInfoCondition} [condition={}] - 激活选项
 * @returns {Promise<WorldInfoData[]>} - 激活的世界书的条目列表
 */
async function activateWorldInfoByKeywords(keywords, condition = {});

/**
 * 获取当前已开启的世界书的所有条目集合
 *
 * @param {boolean} chara - 是否包含角色卡的内置世界书
 * @param {boolean} global - 是否包全局启用的世界书
 * @param {boolean} persona - 是否包用户角色绑定的世界书
 * @param {boolean} persona - 是否包含角色卡的外挂世界书
 * @returns {Promise<WorldInfoData[]>} - 世界书的条目列表
 */
async function getEnabledWorldInfoEntries(chara = true, global = true, persona = true, charaExtra = true);

/**
 * 从世界书条目列表筛选出激活的条目
 *
 * @param {WorldInfoData[]} entries - 世界书条目列表
 * @param {string | string[]} keywords - 用户激活的内容
 * @param {ActivateWorldInfoCondition} [condition={}] - 激活条件
 * @returns {WorldInfoData[]} - 被激活的世界书的条目列表
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
 * @returns {string[]} - 聊天(楼层)消息内容列表
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
 * @property {boolean} [message=false] - 对楼层消息应用正则（提示词模板扩展实现、支持替换函数）
 * @property {boolean} [generate=false] - 对生成消息应用正则（提示词模板扩展、支持替换函数）
 * @property {boolean} [basic=true] - 使用酒馆内置正则（酒馆实现、不支持替换函数）
 * @property {number} [order=100] - 执行顺序，升序执行
 * @property {boolean} [raw=true] - 允许对原始楼层消息进行处理，需要开启 message 项
 * @property {boolean} [display=false] - 允许对楼层消息HTML进行处理，需要开启 message 项
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
 * 全部变量合集
 * 根据以下顺序(优先级)合并变量, 高优先级覆盖低优先级的同名变量:
 * 1.消息变量(楼层号从末尾到开头)
 * 2.局部(聊天)变量
 * 3.全局变量
 * 
 * @note: 处理楼层消息变量时此值不包含当前以及之后的楼层变量
 *        冲突处理: 类型同为 [] 或者 {} 则合并，否则替换
 * @see: https://lodash.com/docs/4.17.15#merge
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
 */
runType = 'generate' | 'preparation' | 'render'