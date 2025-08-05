# 功能描述

## 语法扩展

对 SillyTavern 的宏语法进行扩展，以支持更复杂的语法，例如条件判断、循环、读取更多信息等.

兼容 SillyTavern 原有的宏，扩展的语法基于 [Embedded JavaScript templating](https://ejs.co/) 实现，能够在提示词中使用 `JavaScript`。

能够在**世界/知识书**、**预设**中的**提示词**、**角色相关内容**、**消息**中执行.

仅需要将提示词中使用`<% ... %>`语句块即可。

例如

```javascript
<% print('hello world!') %>
```

> 完整语法说明：[EJS Syntax Reference](https://github.com/mde/ejs/blob/main/docs/syntax.md)
>
> 可以函数列表：[Reference](reference_cn.md)

此功能将会在**将提示词发生给LLM**和**渲染到 SillyTavern 中**时执行

---

## 处理模板

此扩展将会在**开始生成**时将 **SillyTavern** 构建的提示词进行处理，执行`<% ... %>`语句块中的所有`JavaScript`代码，然后将其替换为相应的执行结果（如果有输出）

执行顺序：

1. SillyTavern 准备生成时的提示词（合并**预设**、**世界/知识书**、**角色定义**、**消息**等内容）
2. **此扩展**对提示词中的所有`<% ... %>`语句块进行处理
3. 将处理后的提示词发生到**LLM**
4. 接收**LLM**输出的内容，将其渲染到 SillyTavern 的消息当中
5. 待SillyTavern接收完全部的LLM输出后，**此扩展**开始对接收的内容进行处理（即处理可见的`<% ... %>`语句块）



例如，准备的提示词为：

```javascript
当前好感度：<%- variables.好感度 %>/100
```

此扩展会读取`variables.好感度`的值，并将语句块替换为实际的值

```javascript
当前好感度：50/100
```

然后，该内容将会发送到LLM并开始生成

当LLM生成接受后，如果输出中包含以下内容：

```javascript
<% setvar('好感度', 60) -%>
新的好感度: <%- variables.好感度 %>/100
```

此扩展将会对输出结果进行处理，最终显示结果为：

```javascript
新的好感度: 60/100
```

---

## 内容注入

在某些情况下，**世界/知识书**执行顺序无法被控制，为了确保提示词能够放置在指定的位置，此功能允许将特定提示词插入到**开头**以及**结束**位置。

只需要为**世界/知识书**条目中的**标题（备忘）**添加前缀即可将该条目的内容注入到相应顺序，根据设置决定是激活或者是未激活时生效。

此功能会受到**触发策略**、**顺序**、**包含组**、**确定优先级**、**触发概率**、**组权重**、**主要关键字**、**逻辑**以及**可选过滤器**影响。

> 黏性、冷却和延迟未实现。

- `[GENERATE:BEFORE]`：将此条目注入到**发送给LLM**的提示词的开头（仅限🔵）

- `[GENERATE:AFTER]`：将此条目的内容注入到**发送给LLM**的提示词的末尾（🔵和🟢）

- `[RENDER:BEFORE]`：将此条目注入到**接收的LLM的输出**的内容开头（仅限🔵）

- `[RENDER:AFTER]`：将此条目注入到**接收的LLM的输出**的内容结尾（🔵和🟢）

  > `[RENDER:BEFORE]`与`[RENDER:AFTER]`仅用于渲染，不会发送到**LLM**
  >
  > 因此，也会遵循[楼层渲染](#楼层渲染)的设定

- `[GENERATE:{idx}:BEFORE]`：将此条目注入到**发送给LLM**的第`{idx}`条消息的开头（仅限🔵）

- `[GENERATE:{idx}:AFTER]`：将此条目的内容注入到**发送给LLM**的第`{idx}`条消息的末尾（🔵和🟢）

  > 以发送到 LLM 中的 `messages` 内容顺序为准，**`{idx}`从 0 开始**
  >
  > 例如 `[GENERATE:1:BEFORE]`为将提示词注入到第1条messages中（首条为0）

- `[InitialVariables]`：将条目内容视为变量树，写入到初始消息变量内，仅支持标准`JSON`，且必须是`object`

	> 只有在启用**立即加载世界书**才会生效
	>
	> 修改将会重新写入

### 正则表达式语法示例

- `[GENERATE:REGEX:你好]` - 当消息包含"你好"时注入内容
- `[GENERATE:REGEX:^用户.*]` - 当消息以"用户"开头时注入内容  
- `[GENERATE:REGEX:.*问题.*]` - 当消息包含"问题"时注入内容
- `[GENERATE:REGEX:\\b(help|帮助)\\b]` - 当消息包含"help"或"帮助"单词时注入内容

> 正则表达式匹配不区分大小写，支持所有标准正则表达式语法

### 正则表达式语法使用说明

1. **语法格式**: `[GENERATE:REGEX:pattern]`
   - `pattern` 是标准的正则表达式模式
   - 支持所有 JavaScript 正则表达式语法

2. **匹配逻辑**: 
   
   - 系统会遍历所有消息内容
   - 当消息内容匹配指定的正则表达式时，会执行对应的世界书条目
- 匹配的内容会注入到对应消息之前
  
3. **可用变量**:
   - `matched_message`: 匹配的消息内容
   - `matched_message_index`: 匹配消息的索引
   - `matched_message_role`: 匹配消息的角色

4. **使用示例**:
   
   ```
   世界书条目标题: [GENERATE:REGEX:你好]
   世界书条目内容: 
   检测到问候语！当前消息: <%- matched_message %>
   消息索引: <%- matched_message_index %>
   ```

---

## 楼层渲染

在渲染聊天消息时，处理方式会与纯提示词有一些不同

- 渲染时直接使用楼层内已经渲染出来的内容进行处理，即使用楼层内的**HTML**代码，处理后也是直接输出到**DOM内的HTML**代码

> 即 `#chat > div.mes > div.mes_block > div.mes_text`的HTML代码

- 使用`<%=`格式来输出时会对内容进行格式化，而使用`<%-`输出时直接视为`HTML`代码

> 格式化包括：转义`HTML`标记、处理**宏定义**、处理**正则表达式**、处理**Markdown**语法
>
> 在通常情况下，`<%=`的功能与`<%-`相同，而只有在渲染时才会表现出不同行为

- 在[提示词注入](#提示词注入)中的`[RENDER:BEFORE]`和`[RENDER:AFTER]`条目也会遵循此设定

- 渲染时会将`&lt;%`替换为`<%`，`%&gt;`替换为`%>`，以支持渲染显示输出

> 由于酒馆会自动将不认识的HTML标记自动进行转义，因此需要将其取消转义才能顺利执行

- 仅修改显示的**HTML**代码，不修改原始消息内容

> 因此，为避免楼层内的`<% ... %>`语句块在发送到LLM时重复执行，需要通过**正则表达式**来隐藏内容
>
> ```json
> {
>     "id": "a8ff1bc7-15f2-4122-b43b-ded692560538",
>     "scriptName": "楼层函数调用过滤",
>     "findRegex": "/<%.*?%>/g",
>     "replaceString": "",
>     "trimStrings": [],
>     "placement": [
>         1,
>         2
>     ],
>     "disabled": false,
>     "markdownOnly": false,
>     "promptOnly": true,
>     "runOnEdit": true,
>     "substituteRegex": 0,
>     "minDepth": null,
>     "maxDepth": null
> }
> ```
>
> 可以使用此**正则表达式**来隐藏聊天消息内的`<% ... %>`语句块

- 代码高亮与此扩展发生冲突

> 由于代码高亮会修改实际的HTML代码，在`<`、`>`以及`%`之间插入额外的HTML标记，导致此扩展无法正确地处理内容，因此会导致代码块内的`<% ... %>`无法执行

---

## Prompt 注入

`@INJECT` 功能允许您将特定的提示词消息以类似 **{role: 'user', content: '[Start a new Chat]'}** 的格式直接插入到Prompt中。与传统的世界书条目不同，此功能提供了更精确的位置控制，支持按绝对位置、相对位置和正则表达式匹配进行插入。

上面提示词注入功能只允许你修改消息，你所有提交给 SillyTavern 的消息都由提示词模版决定。如果你安装了酒馆助手，你在控制台输入 `window.TavernHelper.Context.getAllActivatedPrompt()` 来获得激活中的提示词列表（暂时无效，作者的 PR 审核中...）

默认情况下，所有世界书条目都会被合并成一条 `System` 消息发送，以换行符`\n`分隔，这意味着状态栏会与普通条目混杂在一起。

假设存在这样的**条目1**

```
<Format>
输出格式强调:
rule:
- The following must be inserted to the end of each reply, and cannot be omitted
1.<zhengwenkaishi></zhengwenjiesu>(中间填写正文内容).
2.  You must insert <UpdateVariable> tag,update the variables refer to <Analysis> rule, Ignore summary content when evaluate.
format: |-

<zhengwenkaishi>

正文内容

</zhengwenjiesu>

<UpdateVariable>
<Analysis>
...
</Analysis>
...
</UpdateVariable>
</Format>

```

以及**条目2**：

```
花音kanon是一个可爱的小姑娘。
```

和**条目3**：
```
花音kanon最心水的牌子是 Mayla Classic
```

最终发送给 LLM 的内容是
`[{role: 'system', context: '...\n</UpdateVariable>\n</Format>\n花音是一个可爱的小姑娘。\n花音kanon最心水的牌子是 Mayla Classic'},...]`

根据 LLM 的说法，即使手动在格式信息里添加分隔符，效果仍然不如独立的`system`块。指令类信息应该独立于知识类信息，而知识类信息（世界书）不应该被分割。

以 `Gemini` 为例，一个合理的发送格式是

```
[  ...
   systemInstruction: {
    parts: [
      { text: '...\n</UpdateVariable>\n</Format>' },
      { text: '花音是一个可爱的小姑娘。\n花音kanon最心水的牌子是 Mayla Classic' }
    ]
  }
]
```

Sillytavern 在设计上不允许角色卡直接修改提示词预设，本模块提供了直接插入提示词功能的办法。


**重要说明**：
- 必须将世界书条目设置为**未激活**状态才会生效
- 将世界书条目名设置为注入语句，内容则是你需要实际发送的内容
- 支持EJS模板渲染和正则替换处理
- 会受到**触发概率**、**顺序**等世界书参数影响
- 支持三种插入模式：绝对位置、目标消息、正则匹配
- 最终发送给 LLM 的消息结构与本模块处理后的消息结构不同
- 能力越大，责任越大，请仔细阅读 `提示词后处理` 部分

> 不论论设置为🔵还是🟢，世界书总是触发，🟢效果未实现

> 黏性与冷却未实现

### 基本语法

所有注入指令都以 `@INJECT` 开头，后跟参数配置：

```
@INJECT [参数1=值1, 参数2=值2, ...]
```

### 插入模式

#### 1. 绝对位置插入 (pos)

按消息数组的绝对位置进行插入。

**语法**：`@INJECT pos=位置,role=角色`

**参数说明**：
- `pos`：插入位置（从1开始，支持负数索引）
- `role`：插入消息的角色（user/assistant/system）

**示例**：
- `@INJECT pos=1,role=system` - 在第一条消息位置插入系统消息
- `@INJECT pos=-1,role=user` - 在最后一条消息位置插入用户消息
- `@INJECT pos=3,role=assistant` - 在第三条消息位置插入助手消息

**零与负数索引说明**：
- `pos=0`：按照第一条消息处理
- `pos=-1`：最后一条消息位置
- `pos=-2`：倒数第二条消息位置
- 以此类推

#### 2. 目标消息插入 (target)

相对于特定角色的消息进行插入。

**语法**：`@INJECT target=角色,index=序号,at=位置,role=角色`

**参数说明**：
- `target`：目标角色（user/assistant/system）
- `index`：目标消息的序号（从1开始，支持负数）
- `at`：插入位置（before/after，默认为before）
- `role`：插入消息的角色

**示例**：
- `@INJECT target=user,index=1,at=before,role=system` - 在第一条用户消息前插入系统消息
- `@INJECT target=assistant,index=-1,at=after,role=user` - 在最后一条助手消息后插入用户消息
- `@INJECT target=user,role=system` - 在第一条用户消息前插入系统消息（使用默认值）

**负数索引说明**：
- `index=-1`：该角色的最后一条消息
- `index=-2`：该角色的倒数第二条消息

#### 3. 正则表达式插入 (regex)

根据消息内容的正则表达式匹配进行插入。

**语法**：`@INJECT regex=模式,at=位置,role=角色`

**参数说明**：
- `regex`：正则表达式模式（支持单引号包围、双引号包围与无包围）
- `at`：插入位置（before/after，默认为before）
- `role`：插入消息的角色

**示例**：
- `@INJECT regex=你好,at=before,role=system` - 在包含"你好"的消息前插入系统消息
- `@INJECT regex="^用户.*",at=after,role=assistant` - 在以"用户"开头的消息后插入助手消息
- `@INJECT regex='\\b(help|帮助)\\b',role=system` - 在包含"help"或"帮助"单词的消息前插入系统消息

**正则表达式语法**：
- 支持所有 JavaScript 正则表达式语法
- 可以使用单引号或双引号包围模式
- 不区分大小写匹配

### 排序和优先级

注入消息的执行顺序由以下规则决定：

1. **位置优先级**：按插入位置从后往前执行
2. **顺序参数**：相同位置按世界书顺序参数排序（较小的值优先插在前面）
3. **类型优先级**：`pos` > `target` > `regex`

### 触发概率

支持世界书的触发概率功能：

- 如果设置了`概率%`，系统会随机决定是否触发该注入
- 未设置概率的条目会直接触发
- 触发结果会在控制台输出详细日志

### 使用示例

#### 示例1：在对话开始插入系统提示
```
世界书条目标题: @INJECT pos=0,role=system
世界书条目内容: 
你是一个专业的AI助手，请用友好和专业的语气回答问题。
```

#### 示例2：在用户问题后插入上下文
```
世界书条目标题: @INJECT target=user,at=after,role=assistant
世界书条目内容: 
基于用户的问题，我提供以下背景信息：
<%- world_info.content %>
```

#### 示例3：根据关键词插入特定内容
```
世界书条目标题: @INJECT regex=紧急,role=system
世界书条目内容: 
检测到紧急情况关键词，请注意提供及时和准确的帮助。
```

#### 示例4：使用触发概率
```
世界书条目标题: @INJECT target=assistant,at=before,role=system,order=5
世界书条目内容: 
这是一个随机触发的提示，只有30%的概率会出现。
```
（需要在世界书设置中启用触发概率，设置为30%）

### 注意事项

1. **位置计算**：所有位置计算都在模板渲染和正则替换之后进行
2. **内容处理**：注入的内容会经过模板渲染和正则替换处理
3. **数据一致性**：插入操作会保持消息数组的数据结构一致性
4. **调试信息**：详细的操作日志会输出到浏览器控制台
5. **错误处理**：无效的正则表达式或找不到目标消息时会输出警告

### 提示词后处理 

```
本注入功能非常强大，但它的最终效果取决于你所连接的 API 对提示词格式的要求。对于像 Gemini 或 Claude 这样使用严格格式的 API，请确保将你最重要的系统级指令（如角色设定）通过 pos=0 或 order 最小的方式，注入到对话的最开头。否则，它们可能会在 SillyTavern 的内置格式化处理中被当作普通用户消息，从而达不到预期的效果。
```

**⚠️请保证system消息在开头！！！**

**⚠️请保证system消息在开头！！！**

**⚠️请保证system消息在开头！！！**

> 连续的消息相同role的消息可能被合并

在 `API连接配置` 页，你可以找到提示词后处理选项。它完成了 Sillytavern 格式至 大模型 API要求的格式的转换。
| | | 
| --- | --- | 
Chatgpt | system 消息通常只放一条，位于对话最前，用于设定助手的整体行为。不要求严格两两交替，但如果你插入多条 user，模型就会认为这是用户连续的输入。连续2条 system 也是允许的。system 不硬性要求放在最前面，但强烈建议放在最前面。|
Gemini | 独立systemInstruction，user/model 严格交替，user 开头，所有 system 消息将被转发至systemInstruction结构 |
Anthropic Claude | user/assistant 严格交替，最后一条消息通常应该是 user 角色，system 消息可以在任何位置，但通常放在开头最有效 |
Deepseek | user/assistant 建议交替，最后一条消息必须是 user |
其他兼容OpenAI的 | 通常同上，但有时将 system 合并到 user 效果更好 |
本地模型 (Kobold等) | 只需要一个巨大的纯文本块 |


你可以在以下链接找到提示词后处理的详细说明：

https://docs.sillytavern.app/usage/api-connections/openai/#prompt-post-processing

---

## 词符计数

由于此扩展会改变实际的 **词符（tokens）** 数量，因此酒馆内置的**词符计数**会与**实际词复数**不同

因此，此扩展会在每次生成开始时，以及接收LLM相应后，设置一些**全局变量**表示处理后的**词符（tokens）**

- `LAST_SEND_TOKENS`上次生成发送的词符（tokens）数量

- `LAST_SEND_CHARS`上次生成发送的文本长度

	**以下并非实际输出消耗的词符（tokens）数量，应该以酒馆内置的词符计数为准**

- `LAST_RECEIVE_TOKENS`上次生成输出的词符（tokens）数量

- `LAST_RECEIVE_CHARS`上次生成输出的文本长度

### 上下文词符预算

由于此扩展会改变实际的**词符（tokens）**数量，因此会导致**世界/知识书**的**上下文百分比**、**Token预算上限**以及**上下文长度（以词符数计）**无法正确计算

会导致预测**词符（tokens）**数量比实际**词符（tokens）**数量要大得多，导致预算不足，部分**世界/知识书**被丢弃

而使用`getwi`、`getvar`、`getchr`等方式导入的**提示词**也不会被计数，也可能导致超出预算

[Context % / Budget](https://docs.sillytavern.app/usage/core-concepts/worldinfo/#context---budget)

---

## 范围转义

在`<#escape-ejs>...<#/escape-ejs>`内的 `<%`和`%>`将会被自动替换为`<%%`和`%%>`

例如，输入：

```html
<%= 'line 1' %>
<#escape-ejs>
<%= 'line 2' %>
<#/escape-ejs>
<%= 'line 3' %>
```

进行处理后，将会输出

```html
line 1

<%= 'line 2' %>

line 3
```

---

## 设置选项

各个设置选项的说明



### 是否启用扩展

扩展的总开关，关闭将会禁用扩展除了命令以外的所有功能，`<% ... %>`语句将会原样发送给LLM



### 处理生成内容

在生成时对所有的`<% ... %>`语句进行处理

之后的选项会受到此项的影响，禁用此项接下来的选项也将视为禁用



#### 生成时注入 [GENERATE] 世界书条目

在生成时会遍历**所有已启用**的世界书中的条目，然后筛选出带有`[GENERATE:*]`前缀的条目来进行处理

这个过程会先进行排序，然后按顺序依次进行处理



#### 生成时注入 @INJECT 世界书条目

见 [Prompt 注入](#Prompt 注入)



### 处理楼层消息

在楼层里对所有的`<% ... %>`语句进行处理

之后的选项会受到此项的影响，禁用此项接下来的选项也将视为禁用



#### 渲染楼层时注入 [RENDER] 世界书条目

在生成时会遍历**所有已启用**的世界书中的条目，然后筛选出带有`[RENDER:*]`前缀的条目来进行处理

这个过程会先进行排序，然后按顺序依次进行处理



#### 处理代码块

允许对代块`<pre>`内容进行模板处理



#### 处理原始消息内容

在进行渲染前，先对楼层消息原始内容（以编辑时显示的内容为准）进行模板处理

处理完毕后，将结果写入到楼层消息原始里（相当于直接编辑消息）

> 此过程不会预先经过任何形式的**正则**和**宏**处理
>
> 会永久修改消息内容



#### 生成时忽略楼层消息处理

在生成前将楼层内所有的`<% ... %>`语句进行隐藏，避免将其发送到生成阶段进行处理



### 自动保存变量更新

在处理任何内容后，如果变量被修改，则立即进行保存（到文件）

> 开启时会导致额外的性能消耗，而且酒馆本身能够自动保存，因此一般不需要开启



### 立即加载世界书

在打开角色卡/聊天后，立即加载所有启用的世界书，并对内容进行模板处理



### 禁用with语句块

`ejs`内部使用了`with(...) { ... }`语句这一弃用的特性

启用此选项后将会禁用这个语句，改为`const variables, ...`形式的参数解包



### 控制台显示详细信息

开启后，控制台将会输出大量的调试信息



### GENERATE/RENDER/INJECT条目禁用视为启用

- 作用范围：

	> 所有特殊条目，即由扩展控制的条目
	>
	> 例如：[GENERATE]、[RENDER]、`@@generate`、`@@render`等

- 开启时：

	> 这些特殊条目只有在 **禁用** 时才会被扩展处理

- 关闭时：

	> 这些特殊条目只有在 **启用** 时才会被扩展处理

开启后兼容旧设定，即「特殊条目需要**禁用**才会生效」

关闭后使用新设定，即「特殊条目需要**启用**才会生效」



### 缓存（实验性）

启用此功能后，会将编译后的提示词缓存起来，避免耗时的重复编译过程，可以稍微提升速度

但是，由于缓存的原样，有时候也会导致缓存后的提示词无法被更新



### 缓存大小

控制缓存池的大小



### 缓存Hash函数

对性能影响较小

---

## 提示词注入

提示词注入功能设计是实现依赖倒置，通过**标签键**来导入提示词，而不是通过指定的条目来导入提示词

例如，我们可以在**预设**里面导入由世界书定义的**CoT**，将这些**CoT**放置到预设的**CoT**区块里面

因为LLM对于有格式、紧凑的提示词有着更强的注意力，如果使用传统的世界书来添加自定义CoT，将会导致LLM注意力涣散，要么忽略预设的CoT，要么忽略世界书的CoT



例如，我们在世界书里这样写

```javascript
<%
injectPrompt("CoT", `
# 好感度
Q: <char>的好感度是多少？
Q: 接下来的生成将会导致好感度发生什么变化？
Q: 变化后的好感度是多少？
# 总结好感度变化，并在生成中输出新的好感度
`)
%>
```

然后，我们在预设里这样写

```javascript
按照以下<thinking>步骤进行思考。
<thinking>
// 在这里读取世界书定义的CoT
<%- getPromptsInjected("CoT") %>
</thinking>
```

这样，生成的时候，上文的内容将会变成

```javascript
按照以下<thinking>步骤进行思考。
<thinking>

# 好感度
Q: <char>的好感度是多少？
Q: 接下来的生成将会导致好感度发生什么变化？
Q: 变化后的好感度是多少？
# 总结好感度变化，并在生成中输出新的好感度

</thinking>
```

---

## 装饰器

在**世界/知识书**内容开始部分，允许通过`@@`前缀添加装饰器，扩展将会识别这些装饰器，将条目进行额外处理

允许同时使用多个装饰器，每个装饰器需独占一行，多个装饰器之间不允许有空行

装饰器使用示例：

```
@@activate
这里是世界书条目内容...
```

> 以上装饰器为忽略🟢的关键字，将条目视为🔵来激活

### 可用装饰器列表

- `@@activate`：视为🔵条目
- `@@dont_activate`：不要激活这个条目（会完全禁止激活，即使用`activewi`）
- `@@message_formatting`：输出为HTML代码（仅限``[RENDER]`和`@@render`模式）
- `@@generate_before`：相当于`[GENERATE:BEFORE]`
- `@@generate_after`：相当于`[GENERATE:AFTER]`
- `@@render_before`：相当于`[RENDER:BEFRE]`
- `@@render_after`：相当于`[RENDER:AFTER]`
- `@@dont_preload`：不要在打开角色卡时处理这个条目
- `@@initial_variables`：相当于`[InitialVariables]`
- `@@always_enabled`：用于`[GENERATE]`、`[RENDE]`和`[InitialVariables]`等特殊条目，强制启用该条目

例如，状态：

```
@@render_after
@@message_formatting
​```
名字：<%- variables.状态栏.角色名 %>
​```
```

---

## 激活正则

通过`activateRegex`函数，可以临时创建一个**正则表达式**来对**提示词**内容仅限额外处理

它的优势是支持传递函数作为替换内容，比酒馆自带的**正则**功能更丰富

当然，它也可以使用酒馆自带的**正则**框架来处理

### 酒馆正则

酒馆正则不支持传递函数，仅支持字符串

同时也不支持**命名捕获组**

仅在生成时生效

示例：

```javascript
<%
    // 隐藏楼层里的深度思考内容
    activateRegex(/<think>[\s\S]*?<\/think>/gi, "");
%>
```

> 上述代码通过注入一个临时的**酒馆正则**，对**发送给LLM**的内容进行处理
>
> 处理时先使用**酒馆正则**处理，然后才会由**提示词模板**进行处理

### 预处理正则

在进行**提示词模板**处理前，先应用这个正则，然后再进行**模板计算**

生成、渲染都会生效

```javascript
<%
    // 将 {{getvars::...}} 替换为变量内容
    activateRegex(/\{\{\getvars::([a-zA-Z0-9_]+?)}\}/gi, function(match, varName) {
    	return this.getvar(varName);
	}, { generate: true });
%>
```

> 上述代码模仿**酒馆宏**的功能，创建一个自定义宏`{{getvars}}`

### 楼层正则

楼层正则分为两种情况，一种是**原始消息内容**，另一种是**HTML内容**

#### 原始消息内容

原始消息内容正则会直接永久修改消息内容

这个正则同样会在进行**提示词模板**处理前执行

```javascript
<%
    // 将 <Variables> 块的内容作为变量，更新楼层变量
    activateRegex(/<Variables>([\s\S]+?)<\/Variables>/gi, function(match, variables) {
    	const self = this;
    	variables
            .split("\n")	// 按行分割
            .filter(x => x.includes(":")) // 检查格式
    		.map(x => x.split(":", 2))	// 拆分键值
    		.forEach(([k, v]) => self.setvar(k.trim(), v.trim()));	// 写入变量
    	
    	// 删除变量块
    	return "";
	}, { message: true });
%>
```

> 上述代码读取LLM输出的变量更新，将更新值写入到变量表里

#### HTML内容

这里的正则用于修改楼层HTML内容

```javascript
<%_
	// 替换 catbox 图床链接为反代，解决无法加载图片的问题
	activateRegex(
        /files\.catbox\.moe/gi,
        'catbox.***.net',
        { message: true, display: true }
    );
_%>
```

> 上述代码直接修改楼层HTML中所有的`files.catbox.moe`为`catbox.***.net`















