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

## Content Injection

In certain scenarios, the execution order of **lore books/world info** cannot be controlled. To ensure prompts are placed at designated positions, this feature allows injecting specific prompts into the **beginning** and **end** locations.

Simply add prefixes to the **title (memo)** of **lore book/world info** entries to inject the entry's content into the corresponding sequence. Whether the injection takes effect when activated or deactivated depends on the settings.

This feature is affected by **trigger strategy**, **order**, **inclusion groups**, **deterministic priority**, **trigger probability**, **group weight**, **primary keywords**, **logic**, and **optional filters**.

> Sticky, cooldown, and delay are not implemented.

- `[GENERATE:BEFORE]`: Inject this entry's content to the **beginning** of prompts sent to the **LLM** (🔵 only)

- `[GENERATE:AFTER]`: Inject this entry's content to the **end** of prompts sent to the **LLM** (🔵 and 🟢)

- `[RENDER:BEFORE]`: Inject this entry's content to the **beginning** of **LLM output** received (🔵 only)

- `[RENDER:AFTER]`: Inject this entry's content to the **end** of **LLM output** received (🔵 and 🟢)

	> `[RENDER:BEFORE]` and `[RENDER:AFTER]` are for rendering only and **not sent to the LLM**  
	>
	> They also follow [message rendering](#message-rendering) configurations

- `[GENERATE:{idx}:BEFORE]`: Inject this entry to the **beginning** of the `{idx}`-th message sent to the **LLM** (🔵 only)

- `[GENERATE:{idx}:AFTER]`: Inject this entry to the **end** of the `{idx}`-th message sent to the **LLM** (🔵 and 🟢)

	> Based on the order of `messages` sent to the LLM, **`{idx}` starts from 0**  
	>
	> Example: `[GENERATE:1:BEFORE]` injects the prompt into the 1st message (0-indexed)

- `[InitialVariables]`: Treat entry content as a variable tree written to initial message variables. Only standard `JSON` objects are supported.

	> Only effective when **Immediate Lore Book Loading** is enabled  
	>
	> Modifications will be rewritten and overwrite previous content

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

## Configuration Options

Descriptions of each configuration option



### Enable Extension

Master switch for the extension. Disabling it will deactivate all extension features (except commands), and `<% ... %>` statements will be sent to the **LLM** verbatim.



### Process Generated Content

Process all `<% ... %>` statements during generation.

Subsequent options are affected by this setting; disabling this will also disable the following options.



#### Inject [GENERATE] Lore Book Entries During Generation

During generation, all **enabled** lore book entries are scanned, and entries with `[GENERATE:*]` prefixes are processed.

Entries are sorted first, then processed sequentially.



#### Inject @INJECT Lore Book Entries During Generation

See [Prompt Injection](#prompt-injection)



### Process Message Content

Process all `<% ... %>` statements within **messages**.

Subsequent options are affected by this setting; disabling this will also disable the following options.



#### Inject [RENDER] Lore Book Entries During Message Rendering

During rendering, all **enabled** lore book entries are scanned, and entries with `[RENDER:*]` prefixes are processed.

Entries are sorted first, then processed sequentially.



#### Process Code Blocks

Enable template processing for content within code blocks `<pre>`.



#### Process Raw Message Content

Before rendering, process the raw message content (as displayed in edit mode) with templates.

After processing, write the result back to the raw message content (equivalent to direct message editing).

> This process bypasses all **regex** and **macro** preprocessing  
> Permanently modifies message content



#### Ignore Message Processing During Generation

Before generation, hide all `<% ... %>` statements in messages to prevent them from being processed during generation.



### Auto-Save Variable Updates

After any content processing, immediately save modified variables (to file).

> Enabling this causes additional performance overhead. SillyTavern auto-saves by default, so this is generally unnecessary.



### Immediate Lore Book Loading

Immediately load all enabled lore books after opening a character card/chat and process their content with templates.



### Disable `with` Statement Blocks

`ejs` internally uses the deprecated `with(...) { ... }` statement.

Enabling this option disables `with` and uses parameter unpacking via `const variables, ...` instead.



### Show Detailed Console Info

When enabled, the console outputs extensive debug information.



### Treat Disabled GENERATE/RENDER/INJECT Entries as Enabled

- Scope:  
	> All special entries controlled by the extension  
	> Example: `[GENERATE]`, `[RENDER]`, `@@generate`, `@@render`, etc.

- When enabled:  
	
> Special entries are processed **only when disabled**

- When disabled:  
	
	> Special entries are processed **only when enabled**

Enabling maintains backward compatibility ("special entries require **disabling** to activate").  
Disabling uses the new behavior ("special entries require **enabling** to activate").



### Cache (Experimental)

Enabling this caches compiled prompts to avoid redundant compilation, slightly improving speed.

However, cached prompts may sometimes fail to update due to their immutable nature.



### Cache Size

Controls the cache pool size.



### Cache Hash Function

Minimal performance impact

---

## Prompt Injection

Prompt injection implements dependency inversion by importing prompts via **tag keys** instead of direct entry references.

For example, we can import **CoT** defined in lore books into the **CoT** section of a **preset**, ensuring LLMs focus on structured, compact prompts. Traditional lore book additions might scatter the LLM's attention between preset and lore book CoTs.

**Example in lore book:**
```javascript
<%
injectPrompt("CoT", `
# Affection
Q: What is <char>'s affection level?
Q: How will the next generation affect affection?
Q: What is the new affection level?
# Summarize affection changes and output the new level
`)
%>
```

**Example in preset:**
```javascript
Follow these <thinking> steps:
<thinking>
// Read CoT defined in lore book
<%- getPromptsInjected("CoT") %>
</thinking>
```

**Result during generation:**
```javascript
Follow these <thinking> steps:
<thinking>

# Affection
Q: What is <char>'s affection level?
Q: How will the next generation affect affection?
Q: What is the new affection level?
# Summarize affection changes and output the new level

</thinking>
```

---

### List of Available Decorators

- `@@activate`: Treat as a 🔵 entry.
- `@@dont_activate`: Do not activate this entry (completely prevents activation, even with `activewi`).
- `@@message_formatting`: Output as HTML code (only in `[RENDER]` and `@@render` modes).
- `@@generate_before`: Equivalent to `[GENERATE:BEFORE]` (see [Content Injection](#content-injection) for details).
- `@@generate_after`: Equivalent to `[GENERATE:AFTER]` (see [Content Injection](#content-injection) for details).
- `@@render_before`: Equivalent to `[RENDER:BEFORE]` (see [Content Injection](#content-injection) for details).
- `@@render_after`: Equivalent to `[RENDER:AFTER]` (see [Content Injection](#content-injection) for details).
- `@@dont_preload`: Do not process this entry when opening the character card.
- `@@initial_variables`: Equivalent to `[InitialVariables]` (see [Content Injection](#content-injection) for details).
- `@@always_enabled`: Used for special entries like `[GENERATE]`, `[RENDER]`, and `[InitialVariables]` to force enable the entry.
- `@@only_preload`: Enable this entry only during the [Immediate Lore Book Loading](#immediate-lore-book-loading) phase.
- `@@private`: Inserts `<% { %>` and `<% } %>` at the beginning and end of the entry content to avoid the `Identifier ... has already been declared` error.
- `@@if`: Checks a condition; if the result is `false`, excludes this entry.
- `@@iframe`: Wraps `@@render_before` or `@@render_after` content in an `<iframe>` tag to avoid style pollution in the global scope.
- `@@preprocessing`: This extension processes the entry before Tavern handles the lore book.

**General Usage:**

```javascript
@@render_after
@@message_formatting
Name: <%- variables.status_bar.character_name %>
```

**`@@if` Example:**

```javascript
@@if variables.current_stage === 1
Stage 1 content
```

```javascript
@@if variables.current_stage === 2 || variables.current_stage === 3
Stage 2 and 3 content
```

> When the condition check fails (i.e., result is `false`), this entry will not proceed to the lore book processing flow.
>
> The condition can be any `javascript` code, including function calls like `getvar`, and must be a single line.
>
> `@@if` only affects Tavern's built-in lore book processing logic and does not affect features provided by this extension. For example, it does not take effect for `@@generate` and `@@render`.

**`@@iframe` Example:**

```ejs
@@render_after
@@iframe
<% if(!is_user && !is_system) { %>
<html>
<head></head>
<body>
<div>
【Hakimi】<br/>
Favorability: <%- variables.hakimi.favorability %>
</div>
</body>
</html>
<% } %>
```

> The above effect adds a status bar at the end of all message floors.
>
> `if(!is_user && !is_system)` means the status bar is only displayed for character messages.
>
> `ejs` code can still be executed during rendering, but becomes unavailable after rendering. However, Tavern's built-in `SillyTavern.getContext()` can still be used to call Tavern functions.

**`@@iframe` Collapsible Version:**

```ejs
@@render_after
@@iframe Collapsible Status Bar (Click to Show)
<% if(!is_user && !is_system) { %>
<html>
<head></head>
<body>
<div>
【Hakimi】<br/>
Favorability: <%- variables.hakimi.favorability %>
</div>
</body>
</html>
<% } %>
```

> The `@@iframe` decorator can include a string as a title. If the content is not empty, it will be collapsed, and this title becomes the header of the collapsible block.

**Usage of `@@message_formatting`:**

```html
@@render_after
@@message_formatting
​```html
<html>
<head></head>
<body>
<div>
【Hakimi】<br/>
Favorability: <%- variables.hakimi.favorability %>
</div>
</body>
</html>
```
>  This hands off the status bar to other extensions for processing and rendering, such as [Tavern-Helper](https://github.com/N0VI028/JS-Slash-Runner/) or [LittleWhiteBox](https://github.com/RT15548/LittleWhiteBox), allowing the use of functions they provide.

---

## Activation Regex

The `activateRegex` function temporarily creates a **regular expression** to process **prompt content** with additional rules.

It supports function-based replacements (more powerful than SillyTavern's native **regex**), but can also leverage SillyTavern's regex framework.

### SillyTavern Regex
- No function support (string-only replacements)
- No **named capture groups**
- Active only during generation

**Example:**
```javascript
<%
    // Hides deep thinking content in messages
    activateRegex(/<think>[\s\S]*?<\/think>/gi, "");
%>
```

> This injects a temporary **SillyTavern regex** to process content **sent to the LLM**  
> Processing order: **SillyTavern regex** → **prompt template**

### Preprocessing Regex
Applied **before** prompt template processing, then template computation.

Active during both generation and rendering.

```javascript
<%
    // Replace {{getvars::...}} with variable values
    activateRegex(/\{\{getvars::([a-zA-Z0-9_]+?)\}\}/gi, function(match, varName) {
    	return this.getvar(varName);
	}, { generate: true });
%>
```

> Mimics **SillyTavern macro** functionality with custom macro `{{getvars}}`

### Message Regex

Two variants: **raw message content** and **HTML content**.

#### Raw Message Content
Permanently modifies message content directly.

Executed before **prompt template** processing.

```javascript
<%
    // Update message variables from <Variables> blocks
    activateRegex(/<Variables>([\s\S]+?)<\/Variables>/gi, function(match, variables) {
    	const self = this;
    	variables
            .split("\n")	// Split by line
            .filter(x => x.includes(":")) // Validate format
    		.map(x => x.split(":", 2))	// Split key-value
    		.forEach(([k, v]) => self.setvar(k.trim(), v.trim()));	// Write variables
    	
    	// Remove variable block
    	return "";
	}, { message: true });
%>
```

> Reads LLM-output variable updates and writes them to the variable table

#### HTML Content

Modifies message HTML content.

```javascript
<%_
	// Replace catbox image links with proxy to fix loading issues
	activateRegex(
        /files\.catbox\.moe/gi,
        'catbox.***.net',
        { message: true, html: true }
    );
_%>
```

> Replaces all `files.catbox.moe` links in message HTML with `catbox.***.net`

---

## Activating/Loading Specified World Info Entries  

This section primarily explains how to activate specific World info entries via code.  

### Using `getwi` to Directly Load World Info Content  

`getwi` is the most direct method for loading World info. It completely bypasses SillyTavern's built-in World info processing logic, directly injecting the specified World info entry into the current context (even if the current context isn't a World info entry).  

#### Advantages

- Unconditionally activates entries by bypassing SillyTavern's World info processing logic  
- Precisely controls prompt content placement and activation conditions  
- Supports multiple invocations  
- Can activate unmounted World info entries  

#### Disadvantages

- Cannot utilize SillyTavern's World info logic; only retrieves raw content  
- Repeated calls cause duplicated World info processing (executes code multiple times)  

#### Usage Example  
```javascript
Lily's attitude toward {{user}}:  
<%  
    // If within the same World info, the first parameter can be omitted (pass only entry name/UID)  
    if (variables.lily.affinity > 80) {  
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

### Using `activewi` to Trigger Native SillyTavern World Info Activation  

To leverage SillyTavern's native 🟢keyword-based World info activation, use `activewi` to add entries to the pending activation queue for SillyTavern to process.  
Entries activated via this function follow SillyTavern's native activation logic, producing identical results to standard activation.  
**This function treats disabled entries as enabled** (without modifying the World info itself), allowing even disabled entries to be activated.  

#### Advantages  
- Fully adheres to SillyTavern's World info processing system  
- Can activate unmounted World info entries  
- Optional forced activation ignoring 🟢keywords, 🔗vectorization, groups, cooldowns, delays, etc. (see reference documentation)  

#### Disadvantages  
- Must be used within `[GENERATE:BEFORE]` entries (not strictly enforced, but calls outside this context only take effect in the next generation)  

#### Usage Example  
```javascript  
@@generate_before  
<%  
    for (const event of (variables.world.events ?? [])) {  
        await activewi(`[EVENT] ${event}`);  
    }  
%>  
```

> The `@@generate_before` decorator is functionally equivalent to `[GENERATE:BEFORE]`

### Native Recursive 🟢 Keyword Activation via Preprocessing Lorebook Entries

To achieve native green-light recursive activation, you can perform **template processing** on Lorebook entries *before* the Lorebook is processed. This allows SillyTavern’s native 🟢 keyword activation to function as intended.

This feature can be enabled in two ways:

- Add `[Preprocessing]` to the entry title

	> Example: `[Preprocessing] Lorebook Activator`

- Add the decorator `@@preprocessing` within the entry content

> Example:
>
> ```
> @@preprocessing
> This is the content of the lorebook entry...
> ```

#### Advantages

- Fully compatible with SillyTavern’s native 🟢 keyword recursive activation
- Supports template processing for both **primary keywords** and **optional filters**

#### Disadvantages

- Double processing issue

> Since regex, macros, and template code are pre-processed, the extension will perform a second round of processing after the Lorebook has been handled.

- Unordered processing

> Processing here does not follow SillyTavern’s standard Lorebook processing order. Entry execution order cannot be guaranteed, so users must ensure no conflicts arise.

#### Usage Example

```javascript
@@preprocessing
<% if (variables.Hakimi.Affection > 50 && variables.Hakimi.AffectionEventStage === 0) { %>
Current Event: Hakimi lets down her guard
<% } else if (variables.Hakimi.Affection > 70 && variables.Hakimi.AffectionEventStage === 1) { %>
Current Event: Hakimi reveals what happened to her
<% } else if (variables.Hakimi.Affection > 90 && variables.Hakimi.AffectionEventStage === 2) { %>
Current Event: Hakimi shares her past
<% } %>
```

When sent to the LLM, the above content may appear as:

```
Current Event: Hakimi lets down her guard

Corresponding content for the entry "Hakimi lets down her guard"...
```

### Excluding Entries Using the `@@if` Decorator

If you only need to use a condition to determine whether an entry should be activated and don't want to write complex code, there's a simple method.

You can use the `@@if` decorator to exclude entries. If the condition is false, the entry will be disabled.

```
@@if condition
World/Lorebook content...
```

The condition can be any `JavaScript` code, but it must be written on a single line.

#### Advantages

- Fully adheres to SillyTavern's built-in World/Lorebook handling.
- Directly excludes entries, preventing accidental activation of the World/Lorebook.
- Simple to write; no need for a lot of `<% ... %>` tags.

#### Disadvantages

- Only one line of code is allowed.

#### Usage Examples

```
@@if variables.Hakimi.favorability >= 90
Hakimi likes {{user}} very much.
```

```
@@if variables.Hakimi.favorability > 50 && variables.Hakimi.favorability < 90
Hakimi considers {{user}} a friend.
```