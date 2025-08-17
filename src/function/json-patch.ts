import { applyPatch, Operation } from 'fast-json-patch';
import { setVariable, getVariable, SetVarOption } from './variables';

export function jsonPatch<T>(doc: T, change: Operation[], validate?: any) : T {
    return applyPatch(doc, change, validate).newDocument;
}

export function patchVariables(
    this: Record<string, unknown>,
    key: string | null,
    change: Operation[],
    options: SetVarOption & { validate?: any } = {}
) {
    const doc = getVariable.call(this, key);
    return setVariable.call(this, key, jsonPatch(doc, change, options.validate), options);
}
