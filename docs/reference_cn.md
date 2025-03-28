# 内置函数

```javascript
/**
 * 消息选择过滤器
 * @interface MessageFilter
 * @property {('system' | 'user' | 'assistant' | 'any')} [role='assistant'] - 选取指定角色. 
 *      可以是 'system', 'user', 'assistant', or 'any'. 从末尾开始搜索. 如果设置了id则此项会无效.
 * @property {number} [id=undefined] - 选取指定的消息楼层,可以是负数(负数为末尾开始).
 * @property {number} [swipe_id=undefined] - 选取指定消息的切换ID.
 */

/**
 * 设置变量选项
 * @typedef {Object} SetVarOption
 * @property {number} [index=undefined] - 变量的索引,与/setvar的index相同.
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='message'] - 变量类型(作用域),详见下方
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - 设置条件,不满足则不设置,详见下方
 * @property {'old' | 'new' | 'fullcache'} [results='fullcache'] - 返回值类型,详见下方
 * @property {MessageFilter} [withMsg=undefined] - 消息过滤器(如果要设置消息变量)
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
 * @property {number} [index=undefined] - 变量的索引,与/getvar的index相同
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='cache'] - 变量类型(作用域),详见下方
 * @property {any} [defaults=undefined] - 默认值(如果变量不存在时返回)
 * @property {MessageFilter} [withMsg=undefined] - 消息选择过滤器
 * @property {boolean} [noCache=false] - 禁用缓存(例如在设置变量后立即读取)
 */

/**
 * 读取变量
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
 * @property {number} [index] - 变量的索引,与/getvar的index相同
 * @property {unknown} [defaults=0] - 如果变量不存在时使用的默认值
 * @property {'global' | 'local' | 'message' | 'cache'} [inscope='cache'] - 读取的变量类型(作用域),详见下方
 * @property {'global' | 'local' | 'message' | 'cache'} outscope='message'] - 设置的变量类型(作用域),详见下方
 * @property {'nx' | 'xx' | 'n' | 'nxs' | 'xxs'} [flags='n'] - 更新条件,不满足则不更新,详见下方
 * @property {'old' | 'new' | 'fullcache'} [results='fullcache'] - 返回值类型,详见下方
 * @property {MessageFilter} [withMsg=undefined] - 消息过滤器(如果要设置消息变量)
 * @property {boolean} [dryRun=false] - 是否允许在准备阶段更新变量
 * @property {boolean} [noCache=false] - 禁用缓存(例如在设置变量后立即读取)
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
 * @param {string} worldinfo - 世界书名(递归时可传递空值，自动推断为当前世界书)
 * @param {string | RegExp | number} title - 条目uid/标题
 * @param {Record<string, any>} [data={}] - 传递的数据
 * @returns {Promise<string>} - 世界书条目的内容
 */
async function getwi(worldinfo, title, data = {});
async function getWorldInfo(worldinfo, title, data = {});

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
 * @note 定义函数时应该使用 this 访问上下文, 例如: this.variables, this.getvar, this.setvar
 */
function define(name, value);

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
 * @param {string} keyword - 用于激活世界书的关键字(内容)
 * @returns {Promise<WorldInfoData[]>} - 世界书的条目列表
 */
async function getWorldInfoActivatedData(name, keyword);

/**
 * 对字符串内容进行模板处理
 *
 * @param {string} content - 要处理的字符串内容
 * @param {Object} [data={}] - 传递的数据
 * @returns {Promise<string>} - 处理后的字符串内容
 */
async function evalTemplate(content, data = {});

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
 *
 * @param {string} worldinfo - 世界书名
 * @param {string | RegExp | number} title - 条目uid/标题
 * @returns {Promise<WorldInfoData | null>} - 世界书的条目
 */
async function activewi(worldinfo, title);
async function activateWorldInfo(worldinfo, title);
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
> <%- await getwi('测试世界书', '测试条目1') -%>
> ```
>
> `测试世界书`：`测试条目2`
>
> ```javascript
> // 由导入加载时可省略 worldinfo，只需要传递空值即可
> <%- await getwi('', '测试条目3') -%>
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

# 内置变量/库

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

/**
 * 模板计算时的阶段
 * generate: 生成阶段
 * preparation: 准备阶段
 * render: 渲染(楼层消息)阶段
 */
runType = 'generate' | 'preparation' | 'render'
```

只有在 `runType` 为 `render` 时才会出现的字段

```javascript
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

# 导出函数

扩展导出的函数，可在其他扩展中访问

这些函数在 `globalThis.EjsTemplate`作用域内

```javascript
/**
 * 对文本进行模板语法处理
 * @note data 一般从 prepareContext 获取，若要修改则应直接修改原始对象
 *
 * @param {string} code - 模板代码
 * @param {object} [context={}] - 执行环境(上下文)
 * @returns {string} 对模板进行计算后的内容
 */
async function evalTemplate(code, context = {});

/**
 * 创建模板语法处理使用的执行环境(上下文)
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
