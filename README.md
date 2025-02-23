# SillyTavern Prompt Template

Using Template Syntax (EJS) in Prompt

Allows [embedded JavaScript templating](https://ejs.co/) in Preset, World/Lorebook, Character Description, and Chat

```
<% if (variables.say_hi) { %>
hi, <%- variables.name %>
<% } %>
```

[EJS Syntax Reference](https://github.com/mde/ejs/blob/main/docs/syntax.md)

[Built-in functions reference](docs/reference.md)|[中文文档](docs/reference_cn.md)

## Built-in constant/modules

```typescript
// All variables, including global variables, local variables, message (and swipes) variables
// Priority: message (and swipes) in descending -> local variables -> global variables
// example: variables.myvar
variables: Record<string, any>;

// lodash, example: _.add(1, 2)
_: LoDashStatic;

// JQuery, example: $('#mes_text').text()
$: JQueryStatic;

// faker module, example: faker.fakerEN.person.fullName()
faker: Module;
```

## Known Issues

1. `<% include(...) %>`is not supported, use `<%- await getwi(...) %>` or `<%- await getchr(...) %>`

2. `<%= value %>`is just like`<%- value %>`

