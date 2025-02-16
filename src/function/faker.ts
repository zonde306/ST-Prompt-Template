export let fakerEnv = {
    faker: undefined as any
};

// @ts-expect-error: 2307
import('https://esm.sh/@faker-js/faker').then(module => {
    fakerEnv.faker = module;
    console.log('Faker loaded');
    console.log(module);
});
