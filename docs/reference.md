# Built-in functions reference

```typescript
/**
 * @typedef {Object} SetVarOption
 * @property {number} [index] - The index at which the variable should be set. Optional.
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='cache'] - The scope in which the variable should be set. Defaults to 'cache'.
 * @property {'nx' | 'xx' | 'n'} [flags] - Flags that control the behavior of setting the variable. Defaults to 'n'.
 */

/**
 * Sets a variable in the specified scope with optional flags and index.
 *
 * @param {string} key - The key under which the variable is stored.
 * @param {unknown} value - The value to set for the variable.
 * @param {SetVarOption} [options={}] - Optional settings for setting the variable.
 * @returns {Record<string, unknown>} - The updated variables object.
 */
function setvar(key, value, options = {});

/**
 * @typedef {Object} GetVarOption
 * @property {number} [index] - The index from which the variable should be retrieved. Optional.
 * @property {'global' | 'local' | 'message' | 'cache'} [scope='cache'] - The scope from which the variable should be retrieved. Defaults to 'cache'.
 * @property {unknown} [defaults] - The default value to return if the variable is not found. Optional.
 */

/**
 * Retrieves a variable from the specified scope with an optional index and default value.
 *
 * @param {string} key - The key under which the variable is stored.
 * @param {GetVarOption} [options={}] - Optional settings for retrieving the variable.
 * @returns {unknown} - The retrieved variable or the default value if not found.
 */
function getvar(key, options = {});

/**
 * @typedef {Object} GetSetVarOption
 * @property {number} [index] - The index at which the variable should be accessed or modified. Optional.
 * @property {unknown} [defaults] - The default value to use if the variable is not found. Defaults to 0.
 * @property {'global' | 'local' | 'message' | 'cache'} [inscope='cache'] - The scope from which the variable should be retrieved. Defaults to 'cache'.
 * @property {'global' | 'local' | 'message' | 'cache'} [outscope='cache'] - The scope in which the variable should be set. Defaults to 'cache'.
 * @property {'nx' | 'xx' | 'n'} [flags] - Flags that control the behavior of setting or getting the variable. Defaults to 'n'.
 */

/**
 * Increases the value of a variable by a specified amount, with options for scope and flags.
 *
 * @param {Record<string, unknown>} vars - The object containing the variables.
 * @param {string} key - The key under which the variable is stored.
 * @param {number} [value=1] - The amount by which to increase the variable. Defaults to 1.
 * @param {GetSetVarOption} [options={}] - Optional settings for retrieving and setting the variable.
 * @returns {Record<string, unknown>} - The updated variables object.
 */
function incvar(key, value = 1, options = {});

/**
 * Decreases the value of a variable by a specified amount, with options for scope and flags.
 *
 * @param {Record<string, unknown>} vars - The object containing the variables.
 * @param {string} key - The key under which the variable is stored.
 * @param {number} [value=1] - The amount by which to decrease the variable. Defaults to 1.
 * @param {GetSetVarOption} [options={}] - Optional settings for retrieving and setting the variable.
 * @returns {Record<string, unknown>} - The updated variables object.
 */
function decvar(key, value = 1, options = {});

/**
 * Execute a slash command.
 *
 * @param {string} cmd - The command(s) to execute.
 * @returns {Promise<string>} - A promise that resolves to the pipe output.
 */
function execute(cmd);

/**
 * Import world info entry content.
 *
 * @param {string} worldinfo - The name for the lore book.
 * @param {string | RegExp | number} title - The identifier of the world info entry to be imported, which can be a string, regular expression, or number.
 * @param {Record<string, any>} [data={}] - An optional data object used for template substitution.
 * @returns {Promise<string>} - A promise that resolves to the processed template string. If not found, returns an empty string ('').
 */
function getwi(worldinfo, title, data = {});

/**
 * Import character definitions.
 *
 * @param {string | RegExp} name - The name for the character, which can be a string or regular expression.
 * @param {string} [template=DEFAULT_CHAR_DEFINE] - The character card formatting prompt template.
 * @param {Record<string, any>} [data={}] - An optional data object used for template substitution.
 * @returns {Promise<string>} - A promise that resolves to the processed template string. If not found, returns an empty string ('').
 */
function getchr(name, template = DEFAULT_CHAR_DEFINE, data = {});

/**
 * Import preset prompt from the current preset.
 *
 * @param {string | RegExp} name - The name for the prompt, which can be a string or regular expression.
 * @param {Record<string, any>} [data={}] - An optional data object used for template substitution.
 * @returns {Promise<string>} - A promise that resolves to the processed template string. If not found, returns an empty string ('').
 */
function getprp(name, data = {});

/**
 * Defines a global variable or function.
 *
 * @param {string} name - The name to be defined.
 * @param {unknown} value - The value to be defined, which can be of any type.
 */
function define(name, value);
```

> `flags` type:
>
> `nx`: execute if **not exists**
>
> `xx`: execute only if **exists**
>
> `n`: **always** execute

---

```javascript
// default character card formatting prompt template
const DEFAULT_CHAR_DEFINE = `\
<% if (name) { %>\
<<%- name %>>
<% if (system_prompt) { %>\
System: <%- system_prompt %>
<% } %>\
name: <%- name %>
<% if (personality) { %>\
personality: <%- personality %>
<% } %>\
<% if (description) { %>\
description: <%- description %>
<% } %>\
<% if (message_example) { %>\
example:
<%- message_example %>
<% } %>\
<% if (depth_prompt) { %>\
System: <%- depth_prompt %>
<% } %>\
</<%- name %>>\
<% } %>\
`;
```

---

# Built-in variables reference

```
// TODO
```

