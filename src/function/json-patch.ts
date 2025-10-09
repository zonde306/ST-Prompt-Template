import { setVariable, getVariable, SetVarOption } from './variables';
import { LLMJSONParser } from 'ai-json-fixer';

/**
 * JSON Patch Operation Type (RFC 6902)
 * @see https://tools.ietf.org/html/rfc6902
 */
type JsonPatchOperation =
    | AddOperation
    | RemoveOperation
    | ReplaceOperation
    | MoveOperation
    | CopyOperation
    | TestOperation;

/**
 * Generic JSON Pointer string (such as "/a/b" or "/a/0")
 */
type JsonPointer = string;

/**
 * Any JSON-compatible value (note: excluding undefined and functions)
 */
type JsonValue =
    | null
    | boolean
    | number
    | string
    | JsonValue[]
    | { [key: string]: JsonValue };

// Specific definitions of each operation (using discriminated unions)
interface AddOperation {
    op: 'add';
    path: JsonPointer;
    value: JsonValue;
}

interface RemoveOperation {
    op: 'remove';
    path: JsonPointer;
}

interface ReplaceOperation {
    op: 'replace';
    path: JsonPointer;
    value: JsonValue;
}

interface MoveOperation {
    op: 'move';
    from: JsonPointer;
    path: JsonPointer;
}

interface CopyOperation {
    op: 'copy';
    from: JsonPointer;
    path: JsonPointer;
}

interface TestOperation {
    op: 'test';
    path: JsonPointer;
    value: JsonValue;
}

/**
* Complete JSON Patch document
* @example
* const patch: JsonPatch = [
* { op: "replace", path: "/name", value: "John" },
* { op: "add", path: "/phones/0", value: "+123456" }
* ];
*/
type JsonPatch = JsonPatchOperation[];

/**
 * Convert a JSON Pointer path (e.g., "/a/b/0") to a Lodash path array (e.g., ['a', 'b', '0']).
 * @param {string} pointer - The JSON Pointer string.
 * @returns {string[]} A Lodash-compatible path array.
 */
function convertJsonPointerToLodashPath(pointer: JsonPointer): string[] {
    if (typeof pointer !== 'string') {
        throw new Error('Path must be a string.');
    }

    // An empty pointer refers to the whole document, which we can't operate on with _.set/get for properties.
    // We'll return an empty array, and the main function will handle it.
    if (pointer === '') {
        return [];
    }

    if (pointer.charAt(0) !== '/') {
        throw new Error('Invalid JSON Pointer: must start with "/".');
    }

    // Split path, remove leading empty string, and decode special characters
    return pointer.substring(1).split('/').map(segment => {
        // Per RFC 6901, ~1 is decoded to /, and ~0 is decoded to ~
        return segment.replace(/~1/g, '/').replace(/~0/g, '~');
    });
}

/**
 * Apply JSON Patch (RFC 6902) using Lodash functions.
 * @param {object} doc - The original JSON document.
 * @param {Array<object>} patches - An array of JSON Patch operations.
 * @returns {object} A new document with the patches applied.
 */
export function jsonPatch(doc: object, patches: JsonPatch): object {
    // Create a deep copy to ensure the original document is not mutated.
    const newDoc = _.cloneDeep(doc);

    for (const patch of patches) {
        // @ts-expect-error: 2339
        const { op, path, value } = patch;

        // The 'from' path also needs to be converted for 'move' and 'copy' ops.
        // @ts-expect-error: 2339
        const fromPath = patch.from ? convertJsonPointerToLodashPath(patch.from) : undefined;
        const lodashPath = convertJsonPointerToLodashPath(path);

        switch (op) {
            case 'add':
            case 'replace': {
                // Handle special case for adding to the end of an array (e.g., "/a/-")
                const lastSegment = lodashPath[lodashPath.length - 1];
                if (lastSegment === '-') {
                    const parentPath = lodashPath.slice(0, -1);
                    const parent = _.get(newDoc, parentPath);
                    if (Array.isArray(parent)) {
                        parent.push(value);
                    } else {
                        throw new Error(`Cannot push to a non-array value at path: ${parentPath.join('.')}`);
                    }
                } else {
                    _.set(newDoc, lodashPath, value);
                }
                break;
            }

            case 'remove': {
                if (!_.unset(newDoc, lodashPath)) {
                    // _.unset returns false if the path can't be removed. 
                    // This can be treated as a warning or an error depending on strictness.
                    console.warn(`Path "${path}" could not be removed.`);
                }
                break;
            }

            case 'move': {
                const valueToMove = _.get(newDoc, fromPath);
                if (_.isUndefined(valueToMove)) {
                    throw new Error(`Cannot move from a non-existent path: "${patch.from}"`);
                }
                // Important: remove *before* setting, in case the destination is a child of the source.
                _.unset(newDoc, fromPath);
                _.set(newDoc, lodashPath, valueToMove);
                break;
            }

            case 'copy': {
                const valueToCopy = _.get(newDoc, fromPath);
                if (_.isUndefined(valueToCopy)) {
                    throw new Error(`Cannot copy from a non-existent path: "${patch.from}"`);
                }
                // For copy, the value remains at the source, so we just set it at the destination.
                _.set(newDoc, lodashPath, valueToCopy);
                break;
            }

            case 'test': {
                const existingValue = _.get(newDoc, lodashPath);
                if (!_.isEqual(existingValue, value)) {
                    throw new Error(`Test failed: value at "${path}" is not equal to the provided value.`);
                }
                break;
            }

            default:
                throw new Error(`Unsupported patch operation: "${op}"`);
        }
    }

    return newDoc;
}

export function patchVariables(
    this: Record<string, unknown>,
    key: string | null,
    change: JsonPatch | string,
    options: SetVarOption = {}
) {
    const doc = getVariable.call(this, key, options);
    const patch = jsonPatch(doc, typeof change === 'string' ? parseJSON(change) : change);
    return setVariable.call(this, key, patch, options);
}

let parser: null | LLMJSONParser = null;

export function parseJSON(json: string) {
    if (parser == null) {
        parser = new LLMJSONParser();
    }
    return parser.parse(json, {
        stripMarkdown: true,
        trimTrailing: true,
        fixQuotes: true,
        addMissingCommas: true,
    });
}
