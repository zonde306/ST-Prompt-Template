export let fakerEnv = {
    faker: undefined as any
};

// jQuery
$(async () => {
    // lazy load faker
    window.setTimeout(() => {
        import('../../libs/faker.mjs').then(module => {
            fakerEnv.faker = module;
            console.log('Faker loaded');
            console.log(module);
        }).catch(err => {
            console.log('cannot load faker');
            console.error(err);
        });
    }, 100);
});

