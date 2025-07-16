# Feature Description

## Syntax Extension

Extends SillyTavern's macro syntax to support more complex syntax such as conditional statements, loops, and accessing additional information. Maintains compatibility with original SillyTavern macros, using [Embedded JavaScript templating](https://ejs.co/) for extended syntax, enabling JavaScript execution within prompts.

Works in:
- World/Knowledge Books
- Presets (prompts)
- Character-related content
- Messages

Use `<% ... %>` blocks in prompts to execute JavaScript.  
Example:
```javascript
<% print('hello world!') %>
```

> Full syntax documentation: [EJS Syntax Reference](https://github.com/mde/ejs/blob/main/docs/syntax.md)  
> Available functions: [Reference](reference_cn.md)

Executes when:
1. Sending prompts to LLM
2. Rendering content in SillyTavern

---

## Template Processing

This extension processes prompts during generation startup:
1. SillyTavern prepares the prompt (merges presets, world/knowledge books, character definitions, messages)
2. Extension processes all `<% ... %>` blocks
3. Processed prompt is sent to LLM
4. LLM output is received and rendered in SillyTavern
5. Extension processes `<% ... %>` blocks in received content

Example input:
```javascript
Current affection: <%- variables.affection %>/100
```
Processed output:
```javascript
Current affection: 50/100
```

LLM response example:
```javascript
<% setvar('affection', 60) -%>
New affection: <%- variables.affection %>/100
```
Displayed result:
```javascript
New affection: 60/100
```

---

## Prompt Injection

Allows injecting prompts at specific positions using prefixes in **World/Knowledge Book** entry titles (memo). Requires entries to be **inactive** to take effect.

Supported prefixes:
- `[GENERATE:BEFORE]`: Inject at prompt start (🔵 only)
- `[GENERATE:AFTER]`: Inject at prompt end (🔵 and 🟢)
- `[RENDER:BEFORE]`: Inject at response start (🔵 only, rendering only)
- `[RENDER:AFTER]`: Inject at response end (🔵 and 🟢, rendering only)

> Render-related injections follow [Floor Rendering](#floor-rendering) rules

- `[GENERATE:{idx}:BEFORE]`: Inject at message index start (0-based)
- `[GENERATE:{idx}:AFTER]`: Inject at message index end

---

## Message Injection

The `@INJECT` feature allows you to insert specific prompt messages at precise positions in the conversation. Unlike traditional world/knowledge book entries, this feature provides fine-grained control, supporting absolute position, relative position, and regex-based insertion.

**Key Points:**
- The world info entry must be **inactive** to take effect.
- The entry title should be the injection command, and the content is what will actually be sent.
- Supports EJS template rendering and regex replacement.
- Affected by **trigger probability**, **order**, and other world info parameters.
- Supports three insertion modes: absolute position, target message, and regex matching.
- The final message structure sent to the LLM may differ from the internal structure.
- Please read the "Prompt Post-Processing" section for best practices.

> Regardless of 🔵 or 🟢, world info always triggers. 🟢 effect is not implemented.
>
> Sticky and cooldown are not implemented.

### Basic Syntax

All injection commands start with `@INJECT`, followed by parameters:

```
@INJECT [parameter1=value1, parameter2=value2, ...]
```

### Insertion Modes

#### 1. Absolute Position (pos)

Insert at a specific position in the message array.

**Syntax:** `@INJECT pos=position,role=role`

- `pos`: Position (starts from 1, supports negative indices, 0 is treated as the first message)
- `role`: user/assistant/system

**Examples:**
- `@INJECT pos=1,role=system` — Insert at the first message
- `@INJECT pos=-1,role=user` — Insert at the last message
- `@INJECT pos=3,role=assistant` — Insert at the third message

**Zero/Negative Index:**
- `pos=0`: Treated as the first message
- `pos=-1`: Last message
- `pos=-2`: Second-to-last message

#### 2. Target Message (target)

Insert relative to a specific role's message.

**Syntax:** `@INJECT target=role,index=number,at=position,role=role`

- `target`: user/assistant/system
- `index`: Message number (starts from 1, supports negative)
- `at`: before/after (default: before)
- `role`: user/assistant/system

**Examples:**
- `@INJECT target=user,index=1,at=before,role=system` — Before the first user message
- `@INJECT target=assistant,index=-1,at=after,role=user` — After the last assistant message
- `@INJECT target=user,role=system` — Before the first user message (default)

#### 3. Regex (regex)

Insert based on regex match in message content.

**Syntax:** `@INJECT regex=pattern,at=position,role=role`

- `regex`: Pattern (supports single/double/no quotes)
- `at`: before/after (default: before)
- `role`: user/assistant/system

**Examples:**
- `@INJECT regex=hello,at=before,role=system`
- `@INJECT regex="^user.*",at=after,role=assistant`
- `@INJECT regex='\\b(help|帮助)\\b',role=system`

### Sorting and Priority

1. **Position Priority:** Insert from back to front by position
2. **Order Parameter:** Same position sorted by world info order (smaller first)
3. **Type Priority:** pos > target > regex

### Trigger Probability

- If `probability%` is set, the system randomly decides whether to trigger.
- Entries without probability always trigger.
- Results are logged in the console.

### Usage Examples

#### Example 1: Insert system prompt at start
```
World info title: @INJECT pos=0,role=system
World info content:
You are a professional AI assistant, please answer questions in a friendly and professional manner.
```

#### Example 2: Insert context after user question
```
World info title: @INJECT target=user,at=after,role=assistant
World info content:
Based on the user's question, I provide the following background information:
<%- world_info.content %>
```

#### Example 3: Insert based on keyword
```
World info title: @INJECT regex=urgent,role=system
World info content:
Emergency keyword detected, please provide timely and accurate assistance.
```

#### Example 4: With trigger probability
```
World info title: @INJECT target=assistant,at=before,role=system,order=5
World info content:
This is a randomly triggered prompt with only 30% probability.
```
(Enable trigger probability in world info settings, set to 30%)

### Important Notes

1. **Position calculation** happens after template rendering and regex replacement.
2. **Content** is processed with template rendering and regex replacement.
3. **Data consistency** is maintained in the message array.
4. **Debug info** is output to the browser console.
5. **Error handling**: Invalid regex or missing target messages will log warnings.

### Prompt Post-Processing

```
This feature is powerful, but its effect depends on the API's prompt format. For strict APIs (Gemini, Claude), ensure your most important system instructions (e.g., character settings) are injected at the very beginning (pos=0 or lowest order). Otherwise, they may be treated as user messages and not work as expected.
```

**⚠️ Please ensure system messages are at the beginning!!!**

> Consecutive messages with the same role may be merged.

See the API connection documentation for more details:  
https://docs.sillytavern.app/usage/api-connections/openai/#prompt-post-processing

---

## Chat Rendering

Differences from regular prompt processing:
- Operates directly on HTML content in message chat (`#chat > div.mes > div.mes_block > div.mes_text`)
- `<%=` escapes HTML, `<%-` outputs raw HTML
- Automatically unescapes `&lt;%` to `<%` and `%&gt;` to `%>`
- Preserves original message content (modifies HTML only)

Regex example to hide `<%...%>` in messages:
```json
{
    "id": "a8ff1bc7-15f2-4122-b43b-ded692560538",
    "scriptName": "Chat Function Call Filter",
    "findRegex": "/<%.*?%>/g",
    "replaceString": "",
    "placement": [1, 2],
    "disabled": false
}
```

---

## Token Counting

Global variables for token tracking:
- `LAST_SEND_TOKENS`: Tokens sent to LLM
- `LAST_SEND_CHARS`: Character count sent
- `LAST_RECEIVE_TOKENS`: Tokens received (estimated)
- `LAST_RECEIVE_CHARS`: Characters received

> Actual token consumption may differ from Tavern's built-in counter

### Context Token Budget
The extension may affect:
- World/Knowledge Book context percentage
- Token budget calculations
- Context length estimates

Use with caution when using `getwi`, `getvar`, or `getchr` as they may cause budget overflows.

---

## Scope Escaping

The `<%` and `%>` within `<#escape-ejs>...<#/escape-ejs>` will be automatically replaced with `<%%` and `%%>`.

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

## Setting Options

Description of each setting option

---

### Enable Extension

Master switch for the extension. Disabling it will disable all extension features (except commands). `<% ... %>` statements will be sent to LLM as-is.

---

### Process Generation Content

Process all `<% ... %>` statements during generation

Subsequent options depend on this setting - disabling this will treat all following options as disabled

#### Inject [GENERATE] Worldbook Entries During Generation

During generation, it will iterate through **all enabled** worldbook entries and filter entries with `[GENERATE:*]` prefix for processing

This process will first sort entries, then process them in order

#### Process During Dry Run Generation

SillyTavern has two generation modes: **normal generation** (results sent to LLM) and **dry run generation** (results not sent to LLM)

Enabling this option will process template prompts during **dry run generation**

#### Inject @INJECT Worldbook Entries

See [Prompt Injection](#Prompt-Injection)

---

### Process Floor Messages

Process all `<% ... %>` statements in message floors

Subsequent options depend on this setting - disabling this will treat all following options as disabled

#### Inject [RENDER] Worldbook Entries During Floor Rendering

During rendering, it will iterate through **all enabled** worldbook entries and filter entries with `[RENDER:*]` prefix for processing

This process will first sort entries, then process them in order

#### Process Code Blocks

Allow template processing for content within `<pre>` code blocks

#### Process Raw Message Content

Process the original message content (as displayed in editor) before rendering

After processing, write the result back to the message's raw content (equivalent to direct message editing)

> This process will NOT go through any **regex** or **macro** processing in advance  
> This will permanently modify the message content

#### Skip Floor Message Processing During Generation

Hide all `<% ... %>` statements in messages before generation to prevent sending them to LLM for processing

---

### Auto-save Variable Updates

Immediately save (to file) any modified variables after processing content

> Enabling this will cause additional performance overhead. SillyTavern already has auto-save functionality, so this is generally not needed

---

### Preload Worldbook

Immediately load all enabled worldbook entries after opening character card/chat, and process their content with templates

---

### Disable With Statement Block

ejs internally uses the deprecated `with(...) { ... }` statement

Enabling this option will disable this statement, using `const variables, ...` parameter unpacking instead

---

### Show Detailed Console Info

Enable this option to output extensive debug information in console

---

### Caching (Experimental)

Enable this feature to cache compiled prompts, avoiding time-consuming recompilation and slightly improving speed

However, due to caching mechanisms, sometimes cached prompts may fail to update

---

### Cache Size

Control the size of the cache pool

---

### Cache Hash Function

Minimal performance impact

---

## Prompt Injection

The prompt injection feature implements dependency inversion through **tag keys** to import prompts, rather than importing through specific entries

For example, we can import **CoT** (Chain of Thought) defined in the worldbook into the preset's **CoT** block

Since LLMs pay stronger attention to formatted, compact prompts, using traditional worldbook entries to add custom CoT would cause LLM to ignore either the preset CoT or worldbook CoT

### Example

In worldbook:
```javascript
<%
injectPrompt("CoT", `
# Affinity
Q: What is <char>'s affinity level?
Q: How will the upcoming generation affect affinity?
Q: What is the affinity level after changes?
# Summarize affinity changes and output new level in generation
`)
%>
```

In preset:
```javascript
Follow the steps below for <thinking>.
<thinking>
// Read CoT defined in worldbook
<%- getPromptsInjected("CoT") %>
</thinking>
```

Resulting in:
```javascript
Follow the steps below for <thinking>.
<thinking>

# Affinity
Q: What is <char>'s affinity level?
Q: How will the upcoming generation affect affinity?
Q: What is the affinity level after changes?
# Summarize affinity changes and output new level in generation

</thinking>
```