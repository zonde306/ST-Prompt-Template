# SillyTavern Prompt Template

Using Template Syntax (EJS) in Prompt

Allows [embedded JavaScript templating](https://ejs.co/) in Preset, World/Lorebook, Character Description, and Chat

```
<% if (variables.say_hi) { %>
hi, <%- variables.name %>
<% } %>
```

[EJS Syntax Reference](https://github.com/mde/ejs/blob/main/docs/syntax.md)

[Built-in functions reference](docs/reference.md)

## Built-in variables/functions

```typescript
// All variables, including global variables, local variables, message (and swipes) variables
// Priority: message (and swipes) in descending -> local variables -> global variables
variables: Record<string, any>;

// lodash
_: LoDashStatic;

// JQuery
$: JQueryStatic;

// Execute slash commands
execute: (cmd: string) : Promise<string>;

// Setting variable
setvar: (key: string, value: any, index?: number, scope : "global" | "local" | "message" = "message", flags : 'nx' | 'xx' | 'n' = 'n') : Record<string, any>;

// Read variable (from variables)
getvar: (key: string, value: any, index?: number) : any;

// increase variable
incvar: (key: string, value: any, index?: number, scope : "global" | "local" | "message" = "message", flags : 'nx' | 'xx' | 'n' = 'n') : Record<string, any>;

// decrease variable
decvar: (key: string, value: any, index?: number, scope : "global" | "local" | "message" = "message", flags : 'nx' | 'xx' | 'n' = 'n') : Record<string, any>;

// SillyTavern context
// @see SillyTavern.getContext()
SillyTavern = SillyTavern.getContext();

// get worldinfo entry
getwi: (worldinfo: string, title: string | RegExp | number, data: Record<string, any> = {}) : Promise<string>;

// get character defines
getchr: (name: string | RegExp, template: string = DEFAULT_CHAR_DEFINE, data: Record<string, any> = {}) : Promise<string>;

// get preset prompt
getprp: (name: string | RegExp, data: Record<string, any> = {}) : Promise<string>;
```

## Known Issues

1. `<% include(...) %>`is not supported, use `<%- await getwi(...) %>` or `<%- await getchr(...) %>`

2. `<%= value %>`is just like`<%- value %>`

