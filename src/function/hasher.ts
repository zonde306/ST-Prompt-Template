import xxhash from 'xxhash-wasm';
import { settings } from '../modules/ui';

export const hasher : { xxhash: null | Awaited<ReturnType<typeof xxhash>> } = {
    xxhash: null,
}

export function hash(content: string, seed: number = 0x1337): number {
    if(hasher.xxhash) {
        if(settings.cache_hasher === 'h32ToString') {
            return hasher.xxhash.h32(content, seed);
        } else if(settings.cache_hasher === 'h64ToString') {
            return Number(hasher.xxhash.h64(content, BigInt(seed)));
        }
    }

    let hash = 5381;
    let i = content.length;
    while (i) 
        hash = (hash << 5) + hash + content.charCodeAt(--i);
    
    return hash | 0;
}

export function hashString(content: string, seed: number = 0x1337): string {
    if(hasher.xxhash) {
        if(settings.cache_hasher === 'h32ToString') {
            return hasher.xxhash.h32ToString(content, seed);
        } else if(settings.cache_hasher === 'h64ToString') {
            return hasher.xxhash.h64ToString(content, BigInt(seed));
        }
    }
    
    return hash(content, seed).toString(16);
}

$(async () => {
    // lazy load faker
    window.setTimeout(() => {
        xxhash().then(api => {
            hasher.xxhash = api;
            console.log(`[Prompt Template] xxhash loaded`);
        }).catch(err => {
            console.error(`[Prompt Template] cannot load xxhash-wasm`);
            console.error(err);
        });
    }, 100);
});
