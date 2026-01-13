# Feature Description

## Syntax Extension

Extends SillyTavern's macro syntax to support more complex syntax such as conditional judgment, loops, reading more information, etc.

Compatible with SillyTavern's original macros, the extended syntax is implemented based on [Embedded JavaScript templating](https://ejs.co/), enabling the use of `JavaScript` in prompts.

Executable in **World/Knowledge Books**, **Preset** **Prompts**, **Character-related Content**, and **Messages**.

Simply use `<% ... %>` statement blocks in prompts.

Example:

```javascript
<% print('hello world!') %>
```

> Complete syntax reference: [EJS Syntax Reference](https://github.com/mde/ejs/blob/main/docs/syntax.md)
>
> Available function list: [Reference](reference_cn.md)

This feature executes when **sending prompts to the LLM** and **rendering into SillyTavern**.

---

## Template Processing

This extension will process the prompt constructed by **SillyTavern** at **the start of generation**, executing all `JavaScript` code within `<% ... %>` statement blocks, then replacing them with the corresponding execution results (if there is output).

Execution order:

1. SillyTavern prepares the prompt for generation (merges content such as **Presets**, **World/Knowledge Books**, **Character Definitions**, **Messages**, etc.)
2. **This extension** processes all `<% ... %>` statement blocks in the prompt.
3. Send the processed prompt to the **LLM**.
4. Receive the content output by the **LLM** and render it into SillyTavern's messages.
5. After SillyTavern has completely received the LLM's output, **this extension** begins processing the received content (i.e., processing visible `<% ... %>` statement blocks).

For example, the prepared prompt is:

```javascript
Current Favorability: <%- variables.favorability %>/100
```

This extension reads the value of `variables.favorability` and replaces the statement block with the actual value:

```javascript
Current Favorability: 50/100
```

Then, this content will be sent to the LLM and generation begins.

After the LLM generation is received, if the output contains the following:

```javascript
<% setvar('favorability', 60) -%>
New Favorability: <%- variables.favorability %>/100
```

This extension will process the output result, and the final displayed result will be:

```javascript
New Favorability: 60/100
```

---

## Content Injection

In some cases, the execution order of **World/Knowledge Book** cannot be controlled. To ensure prompts can be placed at specified locations, this feature allows injecting specific prompts into the **beginning** and **end** positions.

Simply add a prefix to the **Title (Memo)** of a **World/Knowledge Book** entry to inject that entry's content into the corresponding sequence. Whether it takes effect when activated or deactivated is determined by the settings.

This feature is influenced by **Trigger Strategy**, **Order**, **Inclusion Groups**, **Deterministic Priority**, **Trigger Probability**, **Group Weight**, **Primary Keywords**, **Logic**, and **Optional Filters**.

> Sticky, cooldown, and delay are not implemented.

- `[GENERATE:BEFORE]`: Inject this entry's content to the **beginning** of the prompt sent to the **LLM** (🔵 only)

- `[GENERATE:AFTER]`: Inject this entry's content to the **end** of the prompt sent to the **LLM** (🔵 and 🟢)

- `[RENDER:BEFORE]`: Inject this entry's content to the **beginning** of the **received LLM output** content (🔵 only)

- `[RENDER:AFTER]`: Inject this entry's content to the **end** of the **received LLM output** content (🔵 and 🟢)

  > `[RENDER:BEFORE]` and `[RENDER:AFTER]` are only used for rendering and are **not sent to the LLM**.
  >
  > Therefore, they also follow the settings for [Message Rendering](#message-rendering).

- `[GENERATE:{idx}:BEFORE]`: Inject this entry to the **beginning** of the `{idx}`-th message sent to the **LLM** (🔵 only)

- `[GENERATE:{idx}:AFTER]`: Inject this entry's content to the **end** of the `{idx}`-th message sent to the **LLM** (🔵 and 🟢)

  > Based on the order of `messages` sent to the LLM, **`{idx}` starts from 0**.
  >
  > For example, `[GENERATE:1:BEFORE]` injects the prompt into the first message (the first message is 0).

- `[InitialVariables]`: Treat the entry content as a variable tree, written into the initial message variables. Only standard `JSON` is supported, and it must be an `object`.

	> Only takes effect when **Immediately Load World Books** is enabled.
	>
	> Modifications will be rewritten, overwriting previous content.

### Regular Expression Syntax Examples

- `[GENERATE:REGEX:Hello]` - Inject content when a message contains "Hello".
- `[GENERATE:REGEX:^User.*]` - Inject content when a message starts with "User".
- `[GENERATE:REGEX:.*question.*]` - Inject content when a message contains "question".
- `[GENERATE:REGEX:\\b(help|帮助)\\b]` - Inject content when a message contains the word "help" or "帮助".

> Regular expression matching is case-insensitive and supports all standard regex syntax.

### Regular Expression Syntax Usage Instructions

1. **Syntax Format**: `[GENERATE:REGEX:pattern]`
   - `pattern` is a standard regular expression pattern.
   - Supports all JavaScript regular expression syntax.

2. **Matching Logic**:
   - The system will traverse all message content.
   - When message content matches the specified regular expression, the corresponding World Book entry will be executed.
   - The matched content will be injected before the corresponding message.

3. **Available Variables**:
   - `matched_message`: The matched message content.
   - `matched_message_index`: The index of the matched message.
   - `matched_message_role`: The role of the matched message.

4. **Usage Example**:
   ```
   World Book Entry Title: [GENERATE:REGEX:Hello]
   World Book Entry Content:
   Greeting detected! Current message: <%- matched_message %>
   Message index: <%- matched_message_index %>
   ```

---

## Message Rendering

When rendering chat messages, the processing method differs somewhat from pure prompt processing.

- During rendering, the already-rendered content within the message floor is processed directly, i.e., using the **HTML** code within the floor. After processing, the output is directly written to the **HTML** code within the **DOM**.

> That is, the HTML code of `#chat > div.mes > div.mes_block > div.mes_text`.

- When outputting using the `<%=` format, the content will be formatted. When using `<%-` to output, it is directly treated as `HTML` code.

> Formatting includes: escaping `HTML` tags, processing **macro definitions**, processing **regular expressions**, processing **Markdown** syntax.
>
> Normally, the functionality of `<%=` is the same as `<%-`, but only during rendering does it exhibit different behavior.

- Entries with `[RENDER:BEFORE]` and `[RENDER:AFTER]` in [Content Injection](#content-injection) also follow this setting.

- During rendering, `&lt;%` will be replaced with `<%` and `%&gt;` with `%>` to support rendering and display output.

> Because the Tavern automatically escapes unrecognized HTML tags, they need to be unescaped to execute smoothly.

- Only modifies the displayed **HTML** code, not the original message content.

> Therefore, to prevent `<% ... %>` statement blocks within message floors from being executed repeatedly when sent to the LLM, they need to be hidden using **regular expressions**.
>
> ```json
> {
>     "id": "a8ff1bc7-15f2-4122-b43b-ded692560538",
>     "scriptName": "Message Function Call Filter",
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
> You can use this **regular expression** to hide `<% ... %>` statement blocks within chat messages.

- Code highlighting conflicts with this extension.

> Because code highlighting modifies the actual HTML code, inserting additional HTML tags between `<`, `>`, and `%`, causing this extension to be unable to process the content correctly, thus `<% ... %>` within code blocks cannot be executed.

---

## Prompt Injection

The `@INJECT` feature allows you to insert specific prompt messages directly into the Prompt in a format similar to **{role: 'user', content: '[Start a new Chat]'}**. Unlike traditional World Book entries, this feature provides more precise position control, supporting insertion based on absolute position, relative position, and regular expression matching.

The above content injection feature only allows you to modify messages. All messages you submit to SillyTavern are determined by the prompt template. If you have Tavern Assistant installed, you can enter `window.TavernHelper.Context.getAllActivatedPrompt()` in the console to get the list of activated prompts (temporarily invalid, author's PR under review...).

By default, all World Book entries are merged into one `System` message and sent, separated by newline `\n`, which means status bars will be mixed with ordinary entries.

Assume there is an **Entry 1** like this:

```
<Format>
Output format emphasis:
rule:
- The following must be inserted to the end of each reply, and cannot be omitted
1.<zhengwenkaishi></zhengwenjiesu>(fill in the main text in the middle).
2.  You must insert <UpdateVariable> tag,update the variables refer to <Analysis> rule, Ignore summary content when evaluate.
format: |-

<zhengwenkaishi>

Main text content

</zhengwenjiesu>

<UpdateVariable>
<Analysis>
...
</Analysis>
...
</UpdateVariable>
</Format>

```

And **Entry 2**:

```
Kanon Hanane is a cute little girl.
```

And **Entry 3**:
```
Kanon Hanane's favorite brand is Mayla Classic.
```

The final content sent to the LLM is:
`[{role: 'system', context: '...\n</UpdateVariable>\n</Format>\nKanon is a cute little girl.\nKanon Hanane's favorite brand is Mayla Classic'},...]`

According to the LLM, even manually adding separators in the format information is still less effective than independent `system` blocks. Instructional information should be independent of knowledge information, and knowledge information (World Books) should not be fragmented.

Taking `Gemini` as an example, a reasonable sending format is:

```
[  ...
   systemInstruction: {
    parts: [
      { text: '...\n</UpdateVariable>\n</Format>' },
      { text: 'Kanon is a cute little girl.\nKanon Hanane's favorite brand is Mayla Classic' }
    ]
  }
]
```

SillyTavern's design does not allow character cards to directly modify prompt presets. This module provides a method for direct prompt insertion.

**Important Notes**:
- Must set the World Book entry to **inactive** to take effect.
- Set the World Book entry name to the injection statement, and the content is what you actually need to send.
- Supports EJS template rendering and regex replacement processing.
- Affected by **Trigger Probability**, **Order**, and other World Book parameters.
- Supports three insertion modes: Absolute Position, Target Message, and Regex Matching.
- The final message structure sent to the LLM differs from the message structure processed by this module.
- With great power comes great responsibility. Please read the `Prompt Post-Processing` section carefully.

> Whether set to 🔵 or 🟢, the World Book always triggers. The 🟢 effect is not implemented.

> Sticky and cooldown are not implemented.

### Basic Syntax

All injection commands start with `@INJECT`, followed by parameter configuration:

```
@INJECT [parameter1=value1, parameter2=value2, ...]
```

### Insertion Modes

#### 1. Absolute Position Insertion (pos)

Insert based on the absolute position in the message array.

**Syntax**: `@INJECT pos=position,role=role`

**Parameter Description**:
- `pos`: Insertion position (starts from 1, supports negative indexing).
- `role`: Role of the inserted message (user/assistant/system).

**Examples**:
- `@INJECT pos=1,role=system` - Insert a system message at the first message position.
- `@INJECT pos=-1,role=user` - Insert a user message at the last message position.
- `@INJECT pos=3,role=assistant` - Insert an assistant message at the third message position.

**Zero and Negative Index Explanation**:
- `pos=0`: Treated as the first message.
- `pos=-1`: Last message position.
- `pos=-2`: Second-to-last message position.
- And so on.

#### 2. Target Message Insertion (target)

Insert relative to a message of a specific role.

**Syntax**: `@INJECT target=role,index=number,at=position,role=role`

**Parameter Description**:
- `target`: Target role (user/assistant/system).
- `index`: Sequence number of the target message (starts from 1, supports negative numbers).
- `at`: Insertion position (before/after, default is before).
- `role`: Role of the inserted message.

**Examples**:
- `@INJECT target=user,index=1,at=before,role=system` - Insert a system message before the first user message.
- `@INJECT target=assistant,index=-1,at=after,role=user` - Insert a user message after the last assistant message.
- `@INJECT target=user,role=system` - Insert a system message before the first user message (using default values).

**Negative Index Explanation**:
- `index=-1`: The last message of that role.
- `index=-2`: The second-to-last message of that role.

#### 3. Regular Expression Insertion (regex)

Insert based on regular expression matching of message content.

**Syntax**: `@INJECT regex=pattern,at=position,role=role`

**Parameter Description**:
- `regex`: Regular expression pattern (supports single quotes, double quotes, or no quotes).
- `at`: Insertion position (before/after, default is before).
- `role`: Role of the inserted message.

**Examples**:
- `@INJECT regex=Hello,at=before,role=system` - Insert a system message before a message containing "Hello".
- `@INJECT regex="^User.*",at=after,role=assistant` - Insert an assistant message after a message starting with "User".
- `@INJECT regex='\\b(help|帮助)\\b',role=system` - Insert a system message before a message containing the word "help" or "帮助".

**Regular Expression Syntax**:
- Supports all JavaScript regular expression syntax.
- The pattern can be enclosed in single or double quotes.
- Matching is case-insensitive.

### Sorting and Priority

The execution order of injected messages is determined by the following rules:

1. **Position Priority**: Execute from back to front based on insertion position.
2. **Order Parameter**: For the same position, sort by the World Book's order parameter (smaller values are inserted first).
3. **Type Priority**: `pos` > `target` > `regex`

### Trigger Probability

Supports the World Book's trigger probability feature:

- If `Probability %` is set, the system randomly decides whether to trigger the injection.
- Entries without a probability set will trigger directly.
- Trigger results are output with detailed logs to the console.

### Usage Examples

#### Example 1: Insert system prompt at the beginning of the conversation.
```
World Book Entry Title: @INJECT pos=0,role=system
World Book Entry Content:
You are a professional AI assistant. Please answer questions in a friendly and professional tone.
```

#### Example 2: Insert context after a user question.
```
World Book Entry Title: @INJECT target=user,at=after,role=assistant
World Book Entry Content:
Based on the user's question, I provide the following background information:
<%- world_info.content %>
```

#### Example 3: Insert specific content based on keywords.
```
World Book Entry Title: @INJECT regex=urgent,role=system
World Book Entry Content:
Emergency keyword detected. Please provide timely and accurate assistance.
```

#### Example 4: Using trigger probability.
```
World Book Entry Title: @INJECT target=assistant,at=before,role=system,order=5
World Book Entry Content:
This is a randomly triggered prompt, appearing with only a 30% probability.
```
(Need to enable Trigger Probability in World Book settings, set to 30%.)

### Notes

1. **Position Calculation**: All position calculations occur after template rendering and regex replacement.
2. **Content Processing**: Injected content undergoes template rendering and regex replacement processing.
3. **Data Consistency**: Insertion operations maintain the data structure consistency of the message array.
4. **Debugging Information**: Detailed operation logs are output to the browser console.
5. **Error Handling**: Warnings are output for invalid regex or when target messages are not found.

### Prompt Post-Processing

```
This injection feature is very powerful, but its final effect depends on the API's requirements for prompt format. For APIs with strict formats like Gemini or Claude, ensure your most important system-level instructions (such as character settings) are injected at the very beginning of the conversation (via pos=0 or the smallest order). Otherwise, they may be treated as ordinary user messages in SillyTavern's built-in formatting process, failing to achieve the expected effect.
```

**⚠️ Please ensure system messages are at the beginning!!!**

**⚠️ Please ensure system messages are at the beginning!!!**

**⚠️ Please ensure system messages are at the beginning!!!**

> Consecutive messages with the same role may be merged.

On the `API Connection Configuration` page, you can find the prompt post-processing options. It completes the conversion from SillyTavern format to the format required by the LLM API.
| | |
| --- | --- |
ChatGPT | `system` messages are usually only one, placed at the very beginning of the conversation, used to define the assistant's overall behavior. Strict alternating pairs are not required, but if you insert multiple `user` messages in a row, the model will consider it continuous user input. Two consecutive `system` messages are also allowed. `system` is not strictly required to be at the very beginning, but it is strongly recommended. |
Gemini | Independent `systemInstruction`, `user`/`model` strictly alternate, starting with `user`. All `system` messages will be forwarded to the `systemInstruction` structure. |
Anthropic Claude | `user`/`assistant` strictly alternate, the last message should usually be `user` role. `system` messages can be anywhere, but are most effective at the beginning. |
DeepSeek | `user`/`assistant` suggested to alternate, the last message must be `user`. |
Other OpenAI-compatible | Usually the same, but sometimes merging `system` into `user` works better. |
Local models (Kobold, etc.) | Only need one huge plain text block. |

You can find detailed instructions for prompt post-processing at:

https://docs.sillytavern.app/usage/api-connections/openai/#prompt-post-processing

---

## Token Counting

Since this extension changes the actual **token** count, the built-in **token counter** in the Tavern will differ from the **actual token count**.

Therefore, this extension sets some **global variables** at the start of each generation and after receiving the LLM's response to represent the processed **token** counts.

- `LAST_SEND_TOKENS`: Number of tokens sent in the last generation.

- `LAST_SEND_CHARS`: Text length sent in the last generation.

	**The following are not the actual output token consumption; refer to the Tavern's built-in token counter.**

- `LAST_RECEIVE_TOKENS`: Number of tokens output in the last generation.

- `LAST_RECEIVE_CHARS`: Text length output in the last generation.

### Context Token Budget

Since this extension changes the actual **token** count, it can cause **World/Knowledge Book**'s **Context Percentage**, **Token Budget Limit**, and **Context Length (in tokens)** to be incorrectly calculated.

This can lead to the predicted **token** count being much larger than the actual **token** count, causing budget shortages and some **World/Knowledge Books** to be discarded.

Additionally, **prompts** imported using `getwi`, `getvar`, `getchr`, etc., are not counted, which may also lead to exceeding the budget.

[Context % / Budget](https://docs.sillytavern.app/usage/core-concepts/worldinfo/#context---budget)

---

## Scope Escaping

Within `<#escape-ejs>...<#/escape-ejs>`, `<%` and `%>` will be automatically replaced with `<%%` and `%%>`.

For example, input:

```html
<%= 'line 1' %>
<#escape-ejs>
<%= 'line 2' %>
<#/escape-ejs>
<%= 'line 3' %>
```

After processing, the output will be:

```html
line 1

<%= 'line 2' %>

line 3
```

---

## Settings Options

Descriptions of each setting option.

### Enable Extension

Master switch for the extension. Turning it off disables all extension features except commands. `<% ... %>` statements will be sent to the LLM as-is.

### Process Generated Content

Process all `<% ... %>` statements during generation.

Subsequent options are affected by this setting; disabling this will also disable the following options.

#### Inject [GENERATE] World Book Entries During Generation

During generation, traverse all **enabled** World Book entries, then filter entries with the `[GENERATE:*]` prefix for processing.

This process sorts first, then processes in sequence.

#### Inject @INJECT World Book Entries During Generation

See [Prompt Injection](#prompt-injection).

### Process Message Content

Process all `<% ... %>` statements within messages.

Subsequent options are affected by this setting; disabling this will also disable the following options.

#### Inject [RENDER] World Book Entries During Message Rendering

During rendering, traverse all **enabled** World Book entries, then filter entries with the `[RENDER:*]` prefix for processing.

This process sorts first, then processes in sequence.

#### Process Code Blocks

Allow template processing for content within code blocks `<pre>`.

#### Process Raw Message Content

Before rendering, perform template processing on the raw message content (as displayed when editing).

After processing, write the result back to the raw message content (equivalent to editing the message directly).

> This process does not undergo any form of **regex** and **macro** preprocessing.
>
> Permanently modifies message content.

#### Ignore Message Processing During Generation

Before generation, hide all `<% ... %>` statements within messages to prevent them from being processed during the generation phase.

### Auto-save Variable Updates

After processing any content, if variables are modified, save them immediately (to file).

> Enabling this causes additional performance overhead. The Tavern itself can auto-save, so generally, there's no need to enable this.

### Immediately Load World Books

After opening a character card/chat, immediately load all enabled World Books and process their content with templates.

### Disable with Statement Blocks

`ejs` internally uses the deprecated `with(...) { ... }` statement.

Enabling this option disables this statement, replacing it with parameter unpacking in the form of `const variables, ...`.

### Show Detailed Info in Console

When enabled, the console outputs a large amount of debugging information.

### Treat Disabled GENERATE/RENDER/INJECT Entries as Enabled

- Scope:

	> All special entries, i.e., those controlled by the extension.
	>
	> For example: `[GENERATE]`, `[RENDER]`, `@@generate`, `@@render`, etc.

- When enabled:

	> These special entries are only processed by the extension when they are **disabled**.

- When disabled:

	> These special entries are only processed by the extension when they are **enabled**.

Enabling this is compatible with old settings, i.e., "special entries need to be **disabled** to take effect".

Disabling this uses new settings, i.e., "special entries need to be **enabled** to take effect".

### Background Compilation

Move code compilation to the background (web workers).

Can alleviate page lag issues.

### Environment Isolation

Isolate the execution environment from the global environment to avoid pollution.

Enabling consumes extra performance.

### Cache (Experimental)

Enabling this caches compiled prompts to avoid time-consuming repeated compilation, slightly improving speed.

However, due to caching, sometimes cached prompts may not be updated.

### Cache Size

Controls the size of the cache pool.

### Cache Hash Function

Minimal impact on performance.

---

## Prompt Injection

The prompt injection feature is designed to implement dependency inversion, importing prompts via **tag keys** rather than via specified entries.

For example, we can import **CoT** defined in World Books into the **CoT** section of a **preset**.

Because LLMs have stronger attention to formatted, compact prompts, using traditional World Books to add custom CoT may cause the LLM's attention to scatter, either ignoring the preset's CoT or ignoring the World Book's CoT.

For example, we write this in the World Book:

```javascript
<%
injectPrompt("CoT", `
# Affection
Q: What is <char>'s affection level?
Q: What changes will the next generation cause in affection?
Q: What is the new affection level?
# Summarize affection changes and output the new affection level in the generation.
`)
%>
```

Then, in the preset, we write:

```javascript
Think according to the following <thinking> steps.
<thinking>
// Read CoT defined by World Book here
<%- getPromptsInjected("CoT") %>
</thinking>
```

Thus, during generation, the above content becomes:

```javascript
Think according to the following <thinking> steps.
<thinking>

# Affection
Q: What is <char>'s affection level?
Q: What changes will the next generation cause in affection?
Q: What is the new affection level?
# Summarize affection changes and output the new affection level in the generation.

</thinking>
```

---

## Decorators

At the beginning of **World/Knowledge Book** content, decorators can be added using the `@@` prefix. The extension will recognize these decorators and perform additional processing on the entry.

Multiple decorators are allowed simultaneously. Each decorator must occupy its own line. No blank lines are allowed between multiple decorators.

Decorator usage example:

```
@@activate
This is the World Book entry content...
```

> The above decorator ignores the 🟢 keyword, treating the entry as a 🔵 for activation.

### Available Decorator List

- `@@activate`: Treat as a 🔵 entry.
- `@@dont_activate`: Do not activate this entry (completely prohibits activation, even with `activewi`).
- `@@message_formatting`: Output as HTML code (only for `[RENDER]` and `@@render` modes).
- `@@generate_before`: Equivalent to `[GENERATE:BEFORE]` (see [Content Injection](#content-injection) for details).
- `@@generate_after`: Equivalent to `[GENERATE:AFTER]` (see [Content Injection](#content-injection) for details).
- `@@render_before`: Equivalent to `[RENDER:BEFORE]` (see [Content Injection](#content-injection) for details).
- `@@render_after`: Equivalent to `[RENDER:AFTER]` (see [Content Injection](#content-injection) for details).
- `@@dont_preload`: Do not process this entry when opening the character card.
- `@@initial_variables`: Equivalent to `[InitialVariables]` (see [Content Injection](#content-injection) for details).
- `@@always_enabled`: Used for special entries like `[GENERATE]`, `[RENDER]`, and `[InitialVariables]` to force enable the entry.
- `@@only_preload`: Only enable this entry during the [Immediately Load World Books](#immediately-load-world-books) phase.
- `@@private`: Inserts `<% { %>` and `<% } %>` at the beginning and end of the entry content to avoid `Identifier ... has already been declared` errors.
- `@@if`: Check a condition. If the result is `false`, exclude this entry.
- `@@iframe`: Wrap `@@render_before` or `@@render_after` content in an `<iframe>` tag to avoid style pollution in the global scope.
- `@@preprocessing`: Processed by this extension before the Tavern handles the World Book.

General usage:

```javascript
@@render_after
@@message_formatting
Name: <%- variables.status_bar.character_name %>
```

`@@if` example:

```javascript
@@if variables.current_stage === 1
Stage 1 content
```

```javascript
@@if variables.current_stage === 2 || variables.current_stage === 3
Stage 2 and 3 content
```

> When the condition check fails (i.e., the result is `false`), this entry will not enter the World Book processing flow.
>
> The condition can be any `javascript` code, can call functions such as `getvar`, etc., and must be a single line.
>

`@@iframe` example:

```ejs
@@render_after
@@iframe
@@if !is_user && !is_system
<html>
<head></head>
<body>
<div>
【Hakimi】<br/>
Affection: <%- variables.hakimi.affection %>
</div>
</body>
</html>
```

> The above effect adds a status bar at the end of all message floors.
>
> `@@if !is_user && !is_system` means the status bar is only displayed for character messages.
>
> During rendering, `ejs` code can still be executed, but after rendering, it becomes unavailable. However, you can still use the Tavern's built-in `SillyTavern.getContext()` to call Tavern functions.

Collapsible version of `@@iframe`:

```ejs
@@render_after
@@iframe Collapsible Status Bar (click to show)
@@if !is_user && !is_system
<html>
<head></head>
<body>
<div>
【Hakimi】<br/>
Affection: <%- variables.hakimi.affection %>
</div>
</body>
</html>
```

> The `@@iframe` decorator can include a string as a title. As long as the content is not empty, it will be collapsed. This title is the header of the collapsible block.

Usage of `@@message_formatting`:

```html
@@render_after
@@message_formatting
​```html
<html>
<head></head>
<body>
<div>
【Hakimi】<br/>
Affection: <%- variables.hakimi.affection %>
</div>
</body>
</html>
​```
```

> Hand over the status bar to other extensions for processing and rendering, such as [Tavern-Helper](https://github.com/N0VI028/JS-Slash-Runner/) or [LittleWhiteBox](https://github.com/RT15548/LittleWhiteBox), enabling you to call functions they provide.

---

## Activation Regex

Through the `activateRegex` function, you can temporarily create a **regular expression** to perform additional processing on **prompt** content.

Its advantage is supporting functions as replacement content, richer than the Tavern's built-in **regex** functionality.

Of course, it can also use the Tavern's built-in **regex** framework for processing.

### Tavern Regex

Tavern regex does not support passing functions, only strings.

Also does not support **named capture groups**.

Only effective during generation.

Example:

```javascript
<%
    // Hide deep thinking content in messages.
    activateRegex(/<think>[\s\S]*?<\/think>/gi, "");
%>
```

> The above code injects a temporary **Tavern regex** to process content **sent to the LLM**.
>
> Processing uses **Tavern regex** first, then **prompt template** processing.

### Preprocessing Regex

Apply this regex before **prompt template** processing, then perform **template calculation**.

Effective for both generation and rendering.

```javascript
<%
    // Replace {{getvars::...}} with variable content.
    activateRegex(/\{\{getvars::([a-zA-Z0-9_]+?)\}\}/gi, function(match, varName) {
    	return this.getvar(varName);
	}, {
    	// Effective during generation.
    	generate: true
	});
%>
```

> The above code mimics the **Tavern macro** functionality, creating a custom macro `{{getvars}}`.

### Message Regex

Message regex is divided into two cases: **raw message content** and **HTML content**.

#### Raw Message Content

Raw message content regex directly and permanently modifies message content.

This regex also executes before **prompt template** processing.

```javascript
<%
    // Treat content within <Variables> blocks as variables, updating message variables.
    activateRegex(/<Variables>([\s\S]+?)<\/Variables>/gi, function(match, variables) {
    	const self = this;
    	variables
            .split("\n")	// Split by line.
            .filter(x => x.includes(":")) // Check format.
    		.map(x => x.split(":", 2))	// Split key-value.
    		.forEach(([k, v]) => self.setvar(k.trim(), v.trim()));	// Write variables.
    	
    	// Delete the variable block.
    	return "";
	}, {
    	// Effective for message floors.
    	// Default before is true.
    	message: true,
	});
%>
```

> The above code reads variable updates output by the LLM and writes the updated values into the variable table.

#### HTML Content

This regex is used to modify message HTML content.

```javascript
<%_
	// Replace catbox image hosting links with a proxy to solve image loading issues.
	activateRegex(
        /files\.catbox\.moe/gi,
        'catbox.***.net',
        {
            // Effective for message floors.
            message: true,
            // Only effective for HTML.
            html: true
        }
    );
_%>
```

> The above code directly modifies all `files.catbox.moe` links in message HTML to `catbox.***.net`.

---

## Activating/Loading Specified World Book Entries

This section mainly introduces how to activate specific World Book entries through code.

### Using getwi to Directly Load World Book Content

`getwi` is the most direct way to load World Book content. It completely bypasses the Tavern's (SillyTavern) built-in World Book processing logic, directly loading the specified World Book entry into the current context (even if the current context is not a World Book entry).

#### Advantages

- Completely bypasses the Tavern's World Book processing logic, unconditional activation.
- Precise control over prompt content placement and activation conditions.
- Can be called multiple times.
- Can activate unmounted World Book entries.

#### Disadvantages

- Completely unable to use the Tavern's World Book logic, only retrieves content.
- World Book content may be processed multiple times with multiple calls (code executed multiple times).

#### Usage Example

```javascript
Lily's attitude towards {{user}}:
<%
    // If within the same World Book, the first parameter can be omitted, only passing entry name/uid.
    if(variables.lily.affinity > 80) {
        print(await getwi("lily is lover"));
    } else if (variables.lily.affinity > 20) {
        print(await getwi("lily is friend"));
    } else if (variables.lily.affinity > 0) {
        print(await getwi("lily is stranger"));
    } else {
        print(await getwi("lily is nuisance"));
    }
%>
```

### Using activewi to Trigger Tavern Native World Book Activation

If you need the Tavern's native 🟢 keyword activation for World Book entries, you can use `activewi` to add World Book entries to the pending activation list for the Tavern to process.

Entries activated via this function will follow the Tavern's activation logic, achieving exactly the same effect as native activation.

This function automatically treats **disabled entries as enabled** (without modifying the World Book itself), meaning even disabled entries can be activated.

#### Advantages

- Fully follows the Tavern's World Book processing capabilities.
- Can activate unmounted World Book entries.
- Optional forced activation, ignoring 🟢 keywords, 🔗 vectorization, groups, cooldown, delay, etc. (see reference documentation for details).

#### Disadvantages

- Needs to be used within `[GENERATE:BEFORE]` entries (not mandatory, but if not called there, it only takes effect in the next generation).

#### Usage Example

```javascript
@@generate_before
<%
	for(const event of (variables.world.events ?? [])) {
        await activewi(`[EVENT] ${event}`);
    }
%>
```

> The `@@generate_before` decorator has the same effect as `[GENERATE:BEFORE]`.

### Achieving Native Recursive 🟢 Keyword Activation via Preprocessing World Book Entries

If we want to achieve native green-light recursive activation, we can perform **template processing** on World Book entries before the Tavern processes them, handling the World Book in advance to realize the Tavern's native 🟢 keyword activation.

This feature can be enabled in two ways:

- Add `[Preprocessing]` to the entry title.

	> For example: `[Preprocessing] World Book Activator`.

- Add the decorator `@@preprocessing` within the entry.

> Example:
>
> ```
> @@preprocessing
> This is the World Book entry content...
> ```

#### Advantages

- Fully compatible with the Tavern's 🟢 keyword recursive activation feature.
- Supports template processing for **primary keywords** and **optional filters**.

#### Disadvantages

- Double processing issue.

> Since it pre-processes regex, macros, and template code, the extension will perform a second round of processing after World Book processing is complete.

- Unordered processing.

> Processing here does not follow the Tavern's World Book processing order at all. Entry execution order cannot be guaranteed, so you need to ensure no conflicts yourself.

#### Usage Example

```javascript
@@preprocessing
<% if (variables.Hakimi.affection > 50 && variables.Hakimi.affection_event_stage === 0) { %>
Current event: Hakimi lowers her guard.
<% } else if (variables.Hakimi.affection > 70 && variables.Hakimi.affection_event_stage === 1) { %>
Current event: Hakimi tells what happened to her.
<% } else if (variables.Hakimi.affection > 90 && variables.Hakimi.affection_event_stage === 2) { %>
Current event: Hakimi reveals her past.
<% } %>
```

When sent to the LLM, the above content might look like this:

```
Current event: Hakimi lowers her guard.

Content corresponding to the entry about Hakimi lowering her guard...
```

### Excluding Entries Using the `@@if` Decorator

If you just need to use conditions to judge whether an entry should be activated and don't want to write complex code, there's a simple method.

You can use the `@@if` decorator to exclude entries. If the condition is false, the entry is disabled.

```
@@if condition
World Book content...
```

The condition can be any `Javascript` code, but must be a single line.

#### Advantages

- Fully follows the Tavern's built-in World Book processing.
- Directly excludes entries, preventing accidental World Book activation.
- Simple to write, no need for many `<% ... %>` tags.

#### Disadvantages

- Only one line of code.

#### Usage Example

```
@@if variables.Hakimi.affection >= 90
Hakimi likes {{user}} very much.
```

```
@@if variables.Hakimi.affection > 50 && variables.Hakimi.affection < 90
Hakimi considers {{user}} a friend.
```