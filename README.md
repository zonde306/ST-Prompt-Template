# SillyTavern Prompt Template

Using Template Syntax (EJS) in Prompt

Allows [embedded JavaScript templating](https://ejs.co/) in Preset, World/Lorebook, Character Description, and Chat

```
<% if (variables.say_hi) { %>
hi, <%- variables.name %>
<% } %>
```

[EJS Syntax Tutorial](https://ejs.co/#docs)

## Built-in variables/functions

```typescript
// All variables, including global variables, local variables, message (and swipes) variables
// Priority: message (and swipes) in desc -> local variables -> global variables
variables: Record<string, any>;

// lodash
_: LoDashStatic;

// JQuery
$: JQueryStatic;

// Execute slash commands
execute: (cmd: string) => Promise<string>;

// Setting variables
setvar: (key: string, value: any, index?: number, scope : "global" | "local" | "message" = "message")

// SillyTavern context
// @see SillyTavern.getContext()
SillyTavern = SillyTavern.getContext();
```

## Known Issues

1. `<% include(...) %>`is not supported

2. `<%= value %>`is just like`<%- value %>`

