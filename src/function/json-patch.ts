import { applyPatch } from 'fast-json-patch';
import { setVariable, getVariable, SetVarOption } from './variables';

export function jsonPatch<T>(doc: T, change: any[]) : T {
    return applyPatch(doc, change).newDocument;
}

export function patchVariables(
    this: Record<string, unknown>,
    key: string | null,
    change: any[],
    options: SetVarOption = {}
) {
    const doc = getVariable.call(this, key);
    return setVariable.call(this, key, jsonPatch(doc, change), options);
}
