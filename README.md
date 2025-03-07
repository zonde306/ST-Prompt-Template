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

## Known Issues

1. `<% include(...) %>`is not supported, use `<%- await getwi(...) %>` or `<%- await getchr(...) %>`

2. `<%= value %>` will be converted to HTML code output when rendering the message (use `messageFormatting`), otherwise it will be output directly

