import xxhash from 'xxhash-wasm';

export const hasher : { xxhash: null | Awaited<ReturnType<typeof xxhash>> } = {
    xxhash: null,
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
