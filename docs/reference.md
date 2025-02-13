# Built-in functions reference

```typescript
/**
 * Import world info entry content
 * @param worldinfo - The name for the lore book.
 * @param title - The identifier of the world info entry to be imported, which can be a string, regular expression, or number.
 * @param data - An optional data object used for template substitution.
 * @returns Returns the processed template string.If not found, returns ''
 */
function getwi(worldinfo: string, title: string | RegExp | number, data: Record<string, any> = {}) : Promise<string>;

/**
 * Set the value of a variable.
 * 
 * @param key - The key name of the variable to be set.
 * @param value - The value to assign to the variable.
 * @param index - (Optional) list index.
 * @param scope - (Optional) The scope of the variable, which can be 'global', 'local', or 'message', defaulting to 'message'.
 * @param flags - (Optional) Flags for setting the variable, which can be 'nx' (set only if the key does not exist), 'xx' (set only if the key exists), or 'n' (set unconditionally), defaulting to 'n'.
 * 
 * Depending on the scope, the variable will be set in global settings, local metadata, or the variables of the last non-system message.
 * If an index is provided, the variable will be set to the value at the specified index in the array.
 * Depending on the flag, the function may return early under certain conditions without making any changes.
 * 
 * Returns the updated variable object.
 */
function setvar(key: string, value: any, index?: number, scope : "global" | "local" | "message" = "message", flags : 'nx' | 'xx' | 'n' = 'n') : Record<string, any>;

/**
 * Get the value of a variable.
 * 
 * @param key - The key name of the variable to retrieve.
 * @param index - (Optional) list index.
 * @param defaults - (Optional) The default value, defaulting to undefined.
 * 
 * @returns Returns the value of the variable with the specified key. If an index is provided, it attempts to retrieve the value at the corresponding index from the array; otherwise, it directly retrieves the variable's value. If the variable does not exist, it returns the default value.
 * 
 * This function first checks if an index is provided. If an index is provided and is not null or undefined, it attempts to parse the variable's value as a JSON object and retrieves the value at the specified index.
 * If no index is provided or the index is null or undefined, it directly retrieves the value of the variable from the variable object.
 * If the variable does not exist, it returns the provided default value.
 */
function getvar(key: string, value: any, index?: number) : any;

/**
 * Increment the value of a variable
 * 
 * @param key - The key of the variable to increment.
 * @param value - The amount to increment by, defaulting to 1.
 * @param index - (Optional) list index.
 * @param scope - The scope of the variable, which can be 'global', 'local', or 'message', defaulting to 'message'.
 * @param flags - Flags controlling the behavior of setting the variable, which can be 'nx', 'xx', or 'n', defaulting to 'n'.
 * 
 * @returns Returns the updated variable storage object.
 * 
 * Depending on the value of flags, the function behaves differently:
 * - 'nx': Sets the new value only if the variable does not exist.
 * - 'xx': Updates the value only if the variable already exists.
 * - 'n': Always sets the new value.
 */
function incvar(key: string, value: any, index?: number, scope : "global" | "local" | "message" = "message", flags : 'nx' | 'xx' | 'n' = 'n') : Record<string, any>;

/**
 * Decrease the value of a variable.
 * @param vars The variables object.
 * @param key The key name of the variable to decrease.
 * @param value The amount to decrease, defaulting to 1.
 * @param index (Optional) list index.
 * @param scope The scope of the variable, which can be 'global', 'local', or 'message', defaulting to 'message'.
 * @param flags Control flags, which can be 'nx' (set only if the key does not exist), 'xx' (set only if the key exists), or 'n' (always set), defaulting to 'n'.
 * @returns The result of the operation.
 */

function decvar(key: string, value: any, index?: number, scope : "global" | "local" | "message" = "message", flags : 'nx' | 'xx' | 'n' = 'n') : Record<string, any>;

/**
 * Execute slash command
 * @param cmd the command(s)
 * @returns pipe output
 */
function execute(cmd: string) : Promise<string>;

/**
 * Import character defines
 * @param name The name for the character, which can be a string and regular expression.
 * @returns Returns the processed template string.If not found, returns ''
 */
function getchr(name: string | RegExp) : Promise<string>;
```

