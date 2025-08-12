import * as jsonpatch from 'fast-json-patch';
import { setVariable, getVariable, SetVarOption } from './variables';

export function jsonPatch<T>(doc: T, change: any[]) : T {
    return jsonpatch.applyPatch(doc, change).newDocument;
}

export function patchVariables(
    this: Record<string, unknown>,
    change: any[],
    options: SetVarOption = {}
) {
    const doc = getVariable.call(this, null);
    return setVariable.call(this, null, jsonPatch(doc, change), options);
}
