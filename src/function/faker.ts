export const fakerEnv = {
    faker: undefined as any
};

// jQuery
$(async () => {
    // lazy load faker
    window.setTimeout(() => {
        import('../../libs/faker.mjs').then(module => {
            fakerEnv.faker = module;
            console.log('[Prompt Template] Faker loaded');
            console.log(Object.keys(module));
        }).catch(err => {
            console.log('cannot load faker');
            console.error(err);
        });
    }, 100);
});

