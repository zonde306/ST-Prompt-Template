# SillyTavern EJS Template Extension

This extension supercharges SillyTavern's macro system, enabling you to use full-fledged JavaScript within your prompts, character cards, and World Info. It leverages [EJS (Embedded JavaScript templating)](https://ejs.co/) to bring dynamic logic, conditions, loops, and advanced variable management directly into your creative workflow.

Go beyond simple text replacement and create truly dynamic and responsive AI interactions.

[中文文档](README_CN.md)

## Core Features

- **Advanced Scripting**: Use JavaScript logic (`<% ... %>`) anywhere in your prompts, character definitions, or World Info entries.
- **Dynamic Prompt Generation**: Process templates *before* sending them to the LLM. This allows for conditional text, variable insertion (`<%- variables.someValue %>`), and complex, on-the-fly prompt construction.
- **Dynamic Chat Rendering**: Process templates in the LLM's response *after* it's received. This lets you run code from the AI's output to update variables or change how messages are displayed.
- **Powerful Prompt Injection**: Gain precise control over the final prompt structure.
    - **Content Injection**: Use simple tags like `[GENERATE:BEFORE]` in a World Info entry's title to inject its content at the start or end of the prompt context.
    - **Prompt Injection**: Use the `@INJECT` syntax for fine-grained control, allowing you to insert entire messages (`{role: 'system', content: '...'}`) at absolute positions, relative to other messages, or based on regex matches.
- **Comprehensive API**: A rich set of built-in functions (`getvar`, `setvar`, `getwi`, `getchar`) to interact with SillyTavern's data, manage state, and fetch content dynamically.
- **Scoped Variables**: Manage state with `global`, `local` (chat-specific), and even `message`-specific variables that persist across sessions.
- **Full Compatibility**: Works alongside SillyTavern's original macro syntax.

## Basic Usage

Simply use EJS tags in any text field that gets sent to the LLM. The extension will process them at the appropriate time.

**Example 1: Simple Output**
Display a variable's value in a character's prompt.

```javascript
// In a World Info entry or character definition
Character's current affinity: <%- getvar('affinity') %>
```

**Example 2: Conditional Logic**
Change the prompt based on a variable.

```javascript
<% if (getvar('affinity', { defaults: 0 }) > 50) { %>
You are my trusted friend.
<% } else { %>
I'm still wary of you.
<% } %>
```

**Example 3: Updating Variables from LLM Output**
Let the LLM's response modify the character's state.

```javascript
// LLM generates this message
<% setvar('affinity', getvar('affinity') + 10) -%>
Your kindness has been noted. My affinity for you has increased.
New affinity: <%- getvar('affinity') %>
```

The user will see the message with the updated affinity value, and the `affinity` variable will be saved for future interactions.

## Installation

1. In SillyTavern, navigate to the **Extensions** panel (the puzzle piece icon).
2. Under **Install extension**, paste this repository's URL into the text field.
3. Click **Install for all users**.
4. Once installed, enable the **Prompt Template** extension from the list.

## Documentation

For a complete guide to all features and advanced usage, please see:
- **[features.md](docs/features.md)**: A detailed description of all functionalities, including Content Injection, Prompt Injection, and settings.
- **[reference.md](docs/reference.md)**: The full API reference for all available functions, variables, and libraries (`_`, `faker`, etc.).

## License

This project is open-source and available under the [AGPL-3.0 License](LICENSE).