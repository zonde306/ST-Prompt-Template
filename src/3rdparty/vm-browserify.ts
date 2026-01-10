import { settings } from "../modules/ui";

export type SandboxContext = Record<string, any>;

export class FunctionSandbox {
    private iframe: HTMLIFrameElement | null = null;
    private win: any = null;

    constructor() {
        this.initIframe();
        this.hardenEnvironment();
    }

    private initIframe() {
        this.iframe = document.createElement('iframe');
        this.iframe.style.display = 'none';
        this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
        document.body.appendChild(this.iframe);
        this.win = this.iframe.contentWindow;

        if (!this.win) {
            this.destroy();
            throw new Error("Sandbox: Failed to initialize iframe window");
        }

        if(settings.debug_enabled)
            console.log("Sandbox: Initialized iframe window");
    }

    public async run<T>(
        fn: (...args: any[]) => T | Promise<T>,
        args: any[] = [],
        context: SandboxContext = {},
        thisData: any = null,
    ): Promise<T> {
        if (!this.win) {
            throw new Error("Sandbox: Instance has been destroyed. Please create a new BatchSandbox.");
        }

        try {
            this.injectContext(context);
            const fnSource = fn.toString();
            const sandboxedFn = this.win.eval(`(${fnSource})`);
            const result = sandboxedFn.apply(thisData, args);

            // 4. 处理异步结果
            if (result && typeof result.then === 'function') {
                return await result;
            } else {
                return result;
            }
        } catch (err) {
            throw err;
        }
    }

    public destroy() {
        if (this.iframe && this.iframe.parentNode) {
            this.iframe.parentNode.removeChild(this.iframe);
        }
        this.iframe = null;
        this.win = null;

        if(settings.debug_enabled)
            console.log("Sandbox: Destroyed iframe window");
    }

    public destroyIframe() {
        this.destroy();
    }

    private injectContext(context: SandboxContext) {
        if (!this.win) return;
        Object.keys(context).forEach((key) => {
            this.win[key] = context[key];
        });
    }

    private hardenEnvironment() {
        if (!this.win) return;
        const win = this.win;

        const protect = (name: string) => {
            try {
                Object.defineProperty(win, name, {
                    get: () => null, set: () => { },
                    configurable: false, enumerable: false
                });
            } catch (e) { }
        };

        protect('parent');
        protect('top');
        protect('frameElement');

        win.fetch = undefined;
        win.XMLHttpRequest = undefined;
        win.alert = undefined;
    }
}

export function createFinalization() {
    if(globalThis?.FinalizationRegistry) {
        return new FinalizationRegistry((sandbox: FunctionSandbox) => {
            if(typeof sandbox?.destroyIframe === 'function')
                sandbox.destroyIframe();
        });
    }
    return null;
}
