# SillyTavern Prompt Template

Using Template Syntax (EJS) in Prompt

Allows [embedded JavaScript templating](https://ejs.co/) in Preset, World/Lorebook, Character Description, and Chat

```
<% if (variables.say_hi) { %>
hi, <%- variables.name %>
<% } %>
```

