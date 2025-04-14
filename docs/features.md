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

Descriptions of individual configuration options:

- **Enable Prompt template**  
  Master toggle to control whether this extension is enabled.

- **Generate-time evaluation**  
  Whether to process prompts during LLM generation.  
  Functions such as world books, presets, and character card data are processed here.

- **[GENERATE] evaluation**  
- **[RENDER] evaluation**  
  Enable corresponding [Prompt Injection](#Prompt Injection) features.

- **Chat message evaluation**  
  Process chat messages (displayed content).

- **Evaluate inside a code block**  
  Process content within `<pre>` tags in chat messages (displayed content).  
  Keep disabled unless necessary, as it may conflict with other extensions.

- **Evaluate raw message (AND SAVE)**  
  Whether to allow processing of raw chat message content.  
  **Raw message content is not processed by regex or macros.**  
  Execution order:  
  1. After generation completes (and displays)/editing messages/sliding messages/opening character cards  
  2. Execute this feature (`Evaluate raw message (AND SAVE)`)  
  3. Process displayed content (`Chat message evaluation`)  

  > This feature only takes effect when `Chat message evaluation` is enabled.

- **Enable activewi to take effect this time**  
  Whether to allow `activewi` and its alias functions to take effect during the same generation cycle.  
  Disabling reduces generation time consumption, but `activewi` and its aliases will only take effect in the next generation cycle.

- **Save variables after updating**  
  Save chat messages after this extension finishes processing and updates variables.

- **Preload world info**  
  Immediately load (pre-warm) required world books when opening character cards.  
  Process world books immediately.  

  > Preloading reduces initial generation time but may slow down character card opening.  
  > This feature is primarily used to load `define` functions.

- **Use strict mode**  
  Enforce JavaScript "strict mode" when processing template code.  
  See [Strict Mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) for details.

- **Enable debug logging**  
  Enable debug logging. When active, this extension outputs extensive debug logs to the console.