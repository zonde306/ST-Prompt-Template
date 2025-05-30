export let fakerEnv = {
    faker: undefined as any
};

// jQuery
/*
$(async () => {
    // lazy load faker
    window.setTimeout(() => {
        // @ts-expect-error: 2307
        import('https://esm.sh/@faker-js/faker').then(module => {
            fakerEnv.faker = module;
            console.log('Faker loaded');
            console.log(module);
        }).catch(err => {
            console.log('cannot load faker');
            console.error(err);
        });
    }, 100);
});
*/
