# Feature Description

## Syntax Extension

Extends SillyTavern's macro syntax to support more complex logic such as conditional statements, loops, and accessing additional information.

Maintains compatibility with original SillyTavern macros. The extended syntax is implemented using [Embedded JavaScript templating](https://ejs.co/), enabling the use of JavaScript within prompts.

Can be executed in:
- World/Knowledge Books
- Preset prompts
- Character-related content
- Messages

Simply use `<% ... %>` code blocks in your prompts. For example:

```javascript
<% print('hello world!') %>
```

> Full syntax documentation: [EJS Syntax Reference](https://github.com/mde/ejs/blob/main/docs/syntax.md)
>
> Available functions list: [Reference](reference_cn.md)

This feature executes during two key phases:
1. When sending prompts to LLM
2. When rendering LLM outputs into SillyTavern

---

## Template Processing

The extension processes prompts during the **generation initialization** phase by executing all `<% ... %>` code blocks and replacing them with their output (if any).

Execution flow:

1. SillyTavern prepares the prompt (merges presets, world/knowledge books, character definitions, and messages)
2. This extension processes all `<% ... %>` code blocks in the prompt
3. The processed prompt is sent to LLM
4. LLM output is received and rendered into SillyTavern messages
5. After receiving full LLM output, this extension processes visible `<% ... %>` blocks in the output

Example preparation:
```javascript
Current affection: <%- variables.affection %>/100
```

The extension replaces the variable:
```javascript
Current affection: 50/100
```

LLM output example:
```javascript
<% setvar('affection', 60) -%>
New affection: <%- variables.affection %>/100
```

Processed result:
```javascript
New affection: 60/100
```

---

## Prompt Injection

To control prompt placement when world/knowledge book execution order can't be managed, this feature allows injecting specific prompts at designated positions.

Add prefixes to **World/Knowledge Book** entry **titles (memo)** to control injection points:

- `[GENERATE:BEFORE]`: Inject content at the beginning of the prompt sent to LLM
- `[GENERATE:AFTER]`: Append content to the end of the prompt sent to LLM
- `[RENDER:BEFORE]`: Inject content at the beginning of received LLM output
- `[RENDER:AFTER]`: Append content to the end of received LLM output

