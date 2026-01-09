import ejs from '../src/3rdparty/ejs.js';

self.onmessage = function(e) {
    const { id, template, options } = e.data;
    options.client = true;
    options.includer = undefined;
    options.escape = undefined;

    let func;
    try {
        func = ejs.compile(template, options);
    } catch (err) {
        self.postMessage({ id, error: err.message, code: null });
        return;
    }
    
    self.postMessage({ id, code: func.toString(), error: null });
};
