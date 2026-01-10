export type SandboxContext = Record<string, any>;

export class FunctionSandbox {
    private iframe: HTMLIFrameElement;
    private win: any;

    constructor() {
        this.iframe = document.createElement('iframe');
        this.iframe.style.display = 'none';
        this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    }

    /**
     * Executes a function (automatically handles synchronous or asynchronous execution)
     * @param fn The function compiled by EJS
     * @param args The list of arguments
     * @param context The global context
     * @returns The return value of the function (if it's an async function, it returns a Promise)
    */
    public async run<T>(fn: (...args: any[]) => T | Promise<T>, args: any[] = [], context: SandboxContext = {}): Promise<T> {
        this.initIframe();

        try {
            this.hardenEnvironment();
            this.injectContext(context);

            const fnSource = fn.toString();
            const sandboxedFn = this.win.eval(`(${fnSource})`);
            const result = sandboxedFn.apply(this.win, args);

            if (result && typeof result.then === 'function') {
                try {
                    const resolved = await result;
                    return resolved;
                } catch (asyncError) {
                    throw asyncError;
                }
            } else {
                return result;
            }
        } catch (err) {
            throw err;
        } finally {
            this.destroyIframe();
        }
    }

    private initIframe() {
        document.body.appendChild(this.iframe);
        this.win = this.iframe.contentWindow;
        if (!this.win) throw new Error("Sandbox: Failed to access iframe window");
    }

    private destroyIframe() {
        if (this.iframe.parentNode) {
            this.iframe.parentNode.removeChild(this.iframe);
        }
        this.win = null;
    }

    private injectContext(context: SandboxContext) {
        Object.keys(context).forEach((key) => {
            this.win[key] = context[key];
        });

        if (!this.win.require) {
            this.win.require = (name: string) => {
                throw new Error(`Sandbox: require('${name}') disabled.`);
            };
        }
    }

    private hardenEnvironment() {
        const win = this.win;
        const protect = (name: string) => {
            try {
                Object.defineProperty(win, name, {
                    get: () => null,
                    set: () => { },
                    configurable: false,
                    enumerable: false
                });
            } catch (e) { }
        };
        protect('parent');
        protect('top');
        protect('frameElement');
    }
}