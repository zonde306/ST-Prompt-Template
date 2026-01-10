try {
    importScripts('../src/3rdparty/ejs.js');
    if(self.ejs == null)
        throw new Error('EJS library not loaded properly');
} catch (err) {
    console.error(err);
    self.postMessage({ id: -1, error: err.message, code });
}

self.onmessage = function(e) {
    const { id, template, options } = e.data;
    options.client = true;
    options.includer = undefined;
    options.escape = undefined;

    if(self.ejs == null) {
        console.error('EJS library not loaded properly');
        self.postMessage({ id, error: 'EJS library not loaded properly', code: null });
        return;
    }

    let func;
    try {
        func = ejs.compile(template, options);
    } catch (err) {
        self.postMessage({ id, error: err.message, code: null });
        return;
    }
    
    self.postMessage({ id, code: func.toString(), error: null });
};
