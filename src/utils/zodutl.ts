import { z, ZodTypeAny } from 'zod';

/**
 * Recursively merge two Zod schemas, schemaB will deeply override schemaA.
 * @param schemaA 
 * @param schemaB 
 * @returns 
 */
export function deepMergeZod(schemaA: ZodTypeAny, schemaB: ZodTypeAny): ZodTypeAny {
    // By enabling internal checks and using `as any`, the `ts(2740)` and `ts(2345)` errors caused by Zod v4's internal `$ZodType` are avoided.
    const unwrappedA = unwrapZodType(schemaA as any);
    const unwrappedB = unwrapZodType(schemaB as any);

    let mergedCore: any;

    // Get the actual runtime type name (compatible with _def.typeName for Zod v3 and _zod.type for Zod v4).
    const typeA = unwrappedA.core._def?.typeName ?? unwrappedA.core._zod?.type;
    const typeB = unwrappedB.core._def?.typeName ?? unwrappedB.core._zod?.type;

    const isObjA = typeA === 'ZodObject' || typeA === 'object';
    const isObjB = typeB === 'ZodObject' || typeB === 'object';

    const isArrA = typeA === 'ZodArray' || typeA === 'array';
    const isArrB = typeB === 'ZodArray' || typeB === 'array';

    if (isObjA && isObjB) {
        // Shape extraction compatible with both v3 and v4
        const shapeA = unwrappedA.core.shape || unwrappedA.core._zod?.def?.shape;
        const shapeB = unwrappedB.core.shape || unwrappedB.core._zod?.def?.shape;
        const mergedShape: Record<string, any> = { ...shapeA };

        for (const key in shapeB) {
            if (key in shapeA) {
                mergedShape[key] = deepMergeZod(shapeA[key], shapeB[key]);
            } else {
                mergedShape[key] = shapeB[key];
            }
        }
        mergedCore = z.object(mergedShape);
    } else if (isArrA && isArrB) {
        // Element extraction compatible with both v3 and v4
        const elementA = unwrappedA.core.element || unwrappedA.core._zod?.def?.element;
        const elementB = unwrappedB.core.element || unwrappedB.core._zod?.def?.element;
        mergedCore = z.array(deepMergeZod(elementA, elementB));
    } else {
        mergedCore = unwrappedB.core;
    }

    const ukA = getUnknownKeysStrategy(unwrappedA.core);
    const ukB = getUnknownKeysStrategy(unwrappedB.core);
    const finalUnknownKeys = (ukB && ukB !== 'strip') ? ukB : (ukA || 'strip');
    if (finalUnknownKeys === 'passthrough') {
        mergedCore = mergedCore.passthrough(); 
    } else if (finalUnknownKeys === 'loose') {
        mergedCore = mergedCore.loose();
    }

    // Restore the optional/nullable state of the outer layer (based on the overriding layer B).
    let finalSchema = mergedCore;
    if (unwrappedB.isNullable) finalSchema = finalSchema.nullable();
    if (unwrappedB.isOptional) finalSchema = finalSchema.optional();

    // Return by casting back to a public type
    return finalSchema as ZodTypeAny;
}

/**
 * Recursive unpacking of ZodSchema
 * @param schema 
 * @returns 
 */
function unwrapZodType(schema: any) {
    let isOptional = false;
    let isNullable = false;
    let isLoose = false;
    let current = schema;

    // Try unwrapping the object if it has an unwrap method.
    while (current && typeof current.unwrap === 'function') {
        const typeName = current._def?.typeName ?? current._zod?.type;

        if(typeName === 'ZodObject' || typeName === 'object') {
            isLoose = current._def?.unknownKeys === 'passthrough' || current._zod?.unknownKeys === 'loose';
        }

        if (typeName === 'ZodOptional' || typeName === 'optional') {
            isOptional = true;
            current = current.unwrap(); // Since current is any, ts(2740) will not be triggered here.
        } else if (typeName === 'ZodNullable' || typeName === 'nullable') {
            isNullable = true;
            current = current.unwrap();
        } else {
            break;
        }
    }

    return { core: current, isOptional, isNullable };
}

function getUnknownKeysStrategy(schemaCore: any) {
  return schemaCore._def?.unknownKeys ?? schemaCore._zod?.def?.unknownKeys;
}
