# 内置函数

```typescript
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

/**
 * 减少变量的值
 *
 * @param {string} key - 变量名
 * @param {number} [value=1] - 变量值
 * @param {GetSetVarOption} [options={}] - 更新变量选项
 * @returns 根据options.results决定,失败返回undefined.
 */
function decvar(key, value = 1, options = {});

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
 * @param {string} worldinfo - 世界书名
 * @param {string | RegExp | number} title - 条目uid/标题
 * @param {Record<string, any>} [data={}] - 传递的数据
 * @returns {Promise<string>} - 世界书条目的内容
 */
async function getwi(worldinfo, title, data = {});

/**
 * 读取角色卡定义
 *
 * @param {string | RegExp} name - 角色卡名字
 * @param {string} [template=DEFAULT_CHAR_DEFINE] - 输出格式
 * @param {Record<string, any>} [data={}] - 传递的数据
 * @returns {Promise<string>} - 角色卡定义的内容
 */
async function getchr(name, template = DEFAULT_CHAR_DEFINE, data = {});

/**
 * 读取预设的提示词内容
 *
 * @param {string | RegExp} name - 提示词的名字
 * @param {Record<string, any>} [data={}] - 传递的数据
 * @returns {Promise<string>} - 预设的提示词的内容
 */
async function getprp(name, data = {});

/**
 * 定义全局变量/函数
 *
 * @param {string} name - 变量/函数名
 * @param {any} value - 变量/函数的内容
 * @note 定义函数时应该使用 this 访问上下文, 例如: this.variables, this.getvar, this.setvar
 */
function define(name, value);
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

# 备注

1. 准备阶段和生成阶段都会触发世界书计算
2. 渲染阶段不会触发世界书计算
3. `define`执行后会在刷新/关闭页面前一直有效，但是需要注意外层闭包的影响
