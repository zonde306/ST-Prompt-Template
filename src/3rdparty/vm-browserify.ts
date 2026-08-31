import { settings } from "../modules/ui";

export type SandboxContext = Record<string, any>;

// Host globals withheld from the sandbox copy-in.
//
// THE PROBLEM THESE ADDRESS: a function copied in from the parent keeps running in the PARENT realm.
// The sandbox document's CSP (see initIframe) therefore does not apply to anything it does, so any
// copied-in helper that performs network I/O or executes host commands is a way AROUND the policy
// rather than something it protects. Measured examples on a stock install: `$.ajax('/version')`
// succeeds from inside the sandbox with no CSP violation recorded, and
// `TavernHelper.triggerSlash('/api')` runs to completion.
//
// ⚠ THIS IS A DENY-LIST, AND A DENY-LIST CANNOT BE COMPLETE. Every installed extension adds its own
// globals with their own capabilities, and this file cannot know them. An allow-list would be sound,
// but it is the wrong trade for this project: templates here are general-purpose and legitimately
// reach page globals (a card calling into an engine object it installed, for example), so an
// allow-list would break the feature to secure it. This is deliberate best-effort: it removes the
// capabilities that ship with SillyTavern and the most widely installed extension, and it should be
// read as raising the cost of an attack, NOT as a boundary.
const WITHHELD_HOST_GLOBALS = new Set([
    // -- parent-realm HTTP. jQuery is the sharp one: SillyTavern ships it, so it is present in every
    //    install, and `$.ajax`/`$.get`/`$.post` bypass the sandbox CSP entirely (they run in the
    //    parent realm). Withholding it also removes a parent-DOM handle, since the parent's jQuery is
    //    bound to the parent document — the sandbox's own `document` is the iframe's and is never
    //    copied, so templates have no other route to it.
    '$',
    'jQuery',

    // -- parent-realm persistent storage (IndexedDB wrapper); no legitimate template use.
    'localforage',
]);

// DELIBERATELY NOT WITHHELD, and the reasoning matters more than the list:
//
//   `TavernHelper` — if it is installed, a character card's own HTML already runs with FULL
//   `window.parent` access (its script iframes reach `window.parent.getVariables`,
//   `window.parent.document`, and every other global). Anything a template could do with
//   `TavernHelper` is already doable from an HTML block without involving this extension at all, so
//   withholding it here is pure cost for zero benefit. And a user WITHOUT TavernHelper does not have
//   the global in the first place. The same test should be applied before adding anything here: if a
//   capability is reachable through an unguarded parallel path, blocking it in the sandbox buys
//   nothing.
//
//   `executeQuickReplyByName` / `qrEnumProviderExecutables` — the former only runs a Quick Reply the
//   USER already created; an attacker controls the timing, not the content. The latter returns
//   autocomplete enum names. Neither is an injection point. (The Quick Reply WRITE methods are a
//   different matter — see FILTERED_HOST_GLOBAL_MEMBERS.)
//
//   `SillyTavern` — 145 keys, of which 37 are plain data (`extensionSettings`, `chat`, `characters`,
//   `chatMetadata`, `tags`, ...). Those are ordinary library reads any lorebook may legitimately want,
//   so the object is FILTERED rather than withheld.

// jQuery stamps a per-instance expando on window (`jQuery` + a long random suffix) that is a second
// handle on the same object, so the two names above are not sufficient on their own.
const WITHHELD_HOST_GLOBAL_PATTERNS = [/^jQuery\d+$/];

function isWithheldHostGlobal(name: string): boolean {
    return WITHHELD_HOST_GLOBALS.has(name)
        || WITHHELD_HOST_GLOBAL_PATTERNS.some((pattern) => pattern.test(name));
}

// Globals that are USEFUL to templates but carry a few members that execute host commands or write
// persistent state. These are filtered rather than withheld: reads stay, the sharp edges are hidden.
// The line is EXECUTE-or-WRITE, not "touches the network" — reading settings, chat and characters is
// what a lorebook legitimately does, while repointing the connection or persisting an auto-firing
// Quick Reply is not something a prompt template ever needs to do.
const FILTERED_HOST_GLOBAL_MEMBERS: Record<string, RegExp> = {
    // `getContext()` is filtered too (see filterHostGlobal) — it returns the same surface.
    SillyTavern: /^(executeSlashCommands|executeSlashCommandsWithOptions|registerSlashCommand|SlashCommand|SlashCommandParser|SlashCommandArgument|SlashCommandNamedArgument|SlashCommandEnumValue|ConnectionManagerRequestService|generate|generateRaw|generateQuietPrompt|generateRawData|sendGenerationRequest|sendStreamingRequest|importFromExternalUrl|importTags|getRequestHeaders|save[A-Z]|write[A-Z]|delete[A-Z]|update[A-Z]|register[A-Z]|unregister[A-Z])/,
    // Reads (`list*` / `get*`) stay. The writers do not: a Quick Reply can carry an automation id,
    // so creating one persists code that keeps firing after the card is gone.
    quickReplyApi: /^(execute|create|update|delete|toggle|add|remove|clear)[A-Z]?/,
};

// Hide the matching members without touching the host's own object — the sandbox gets a view, the
// parent keeps its API intact.
function filterHostGlobal(name: string, value: any): any {
    const denied = FILTERED_HOST_GLOBAL_MEMBERS[name];
    if (!denied || !value || (typeof value !== 'object' && typeof value !== 'function')) return value;
    return new Proxy(value, {
        get(target, property, receiver) {
            if (typeof property === 'string' && denied.test(property)) return undefined;
            const member = Reflect.get(target, property, receiver);
            // `SillyTavern.getContext()` hands back the same capabilities under a different door.
            if (name === 'SillyTavern' && property === 'getContext' && typeof member === 'function') {
                return (...args: any[]) => filterHostGlobal(name, member.apply(target, args));
            }
            return typeof member === 'function' ? member.bind(target) : member;
        },
        has(target, property) {
            if (typeof property === 'string' && denied.test(property)) return false;
            return Reflect.has(target, property);
        },
        ownKeys(target) {
            return Reflect.ownKeys(target).filter((k) => !(typeof k === 'string' && denied.test(k)));
        },
    });
}

export class FunctionSandbox {
    private iframe: HTMLIFrameElement | null = null;
    private win: Record<string, any> = {};

    constructor() {
        this.initIframe();
        this.hardenEnvironment();
    }

    private initIframe() {
        this.iframe = document.createElement('iframe');
        this.iframe.style.display = 'none';
        this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
        document.body.appendChild(this.iframe);

        // Give the sandbox document its own CSP, before anything can run inside it.
        //
        // WHY: `hardenEnvironment()` below removes `fetch`/`XMLHttpRequest` from ONE realm. Template
        // code can mint a fresh one — `document.createElement('iframe').contentWindow.fetch` is a
        // brand-new realm the hardening never ran against, so the removal is undone in a single line.
        // A *document* policy is inherited by those nested realms, which is what closes that gap. It
        // also covers the sinks a property swap cannot reach at all: `navigator.sendBeacon`,
        // `WebSocket`, `EventSource`, and `new Image().src`.
        //
        // WHAT IT DOES NOT DO: no `default-src`, and deliberately no `script-src` — this extension
        // exists to let people run JavaScript in lorebooks, and restricting execution would break the
        // feature rather than secure it. `eval`, DOM access, and the globals copied in below keep
        // working exactly as before.
        //
        // ⚠ AND IT DOES NOT, BY ITSELF, STOP EGRESS. A document CSP binds the SANDBOX realm; it has no
        // effect on a function that runs in the PARENT realm. Anything copied in from the parent —
        // jQuery's `$.ajax`, an extension's API object, the injected `getvar`/`setvar` helpers — keeps
        // the parent's policy and can still reach the network. That is why the copy loop below
        // withholds the known offenders, and why neither half is sufficient alone: the CSP closes the
        // realm escape and the raw sinks, the withholding closes the parent-realm detour.
        //
        // KNOWN RESIDUAL, measured — this is NOT a complete boundary and should not be described as one:
        // the sandbox document can still navigate ITSELF (`location.href = '…?data=…'`). CSP does not
        // cover that (`navigate-to` was dropped from the spec) and the `sandbox` attribute has no token
        // for it. It is GET-shaped, capped by URL length, and destroys the sandbox document as it goes,
        // so it is a slow dribble rather than a bulk channel — but it is open. `frame-src 'none'` above
        // closes the equivalent trick via a CHILD frame, which was NOT capped in either of those ways.
        const sandboxDocument = this.iframe.contentWindow?.document;
        if (sandboxDocument) {
            sandboxDocument.open();
            sandboxDocument.write(
                `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" `
                + `content="connect-src 'none'; img-src 'none'; form-action 'none'; frame-src 'none'">`
                + `</head><body></body></html>`
            );
            sandboxDocument.close();
        }

        this.win = this.iframe.contentWindow ?? {};

        if (!this.win) {
            this.destroy();
            throw new Error("Sandbox: Failed to initialize iframe window");
        }

        const cleanGlobal = this.iframe.contentWindow ?? {};
        const currentGlobal = window as Record<string, any>;
        const nativeKeys = new Set(Reflect.ownKeys(cleanGlobal));
        for (const key of Reflect.ownKeys(currentGlobal)) {
            if (!nativeKeys.has(key)) {
                const k = typeof key === 'symbol' ? Symbol.keyFor(key) : key;
                // Withhold the parent-realm capabilities listed at the top of this file. Everything a
                // template legitimately uses arrives as the `data` argument (getvar/setvar/getwi/...,
                // see evalTemplate), not off the global — so this costs ordinary templates nothing.
                // Every other page global is still copied in, so a card reaching an object it
                // installed itself keeps working.
                if (typeof k === 'string' && isWithheldHostGlobal(k)) continue;
                if (typeof k === 'string' && FILTERED_HOST_GLOBAL_MEMBERS[k]) {
                    try { this.win[k] = filterHostGlobal(k, currentGlobal[k]); } catch (e) { /* skipped below */ }
                    continue;
                }
                // Skip array-index keys (e.g. "0", "1", ...). When the page contains
                // child frames, the browser exposes them as read-only *indexed*
                // properties on `window`, and assigning to `this.win[0]` throws
                // "Failed to set an indexed property [0] on 'Window': Indexed property
                // setter is not supported." — which aborts the whole sandbox init.
                if (k && !(typeof k === 'string' && /^\d+$/.test(k))) {
                    try {
                        this.win[k] = currentGlobal[k];
                    } catch (e) {
                        // Some globals are non-writable / read-only on Window; skip
                        // them instead of failing sandbox initialization.
                        if (settings.debug_enabled)
                            console.warn("Sandbox: skipped non-writable global", k, e);
                    }
                }
            }
        }

        if(settings.debug_enabled)
            console.log("Sandbox: Initialized iframe window, ", this.win);
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

    public destroy(immediately = false) {
        function destructor(self: FunctionSandbox) {
            self.iframe?.parentNode?.removeChild(self.iframe);
            self.iframe = null;
            self.win = {};
        }

        if(immediately)
            destructor(this);
        else
            setTimeout(() => destructor(this), 100);

        if(settings.debug_enabled)
            console.log("Sandbox: Destroyed iframe window");
    }

    public destroyIframe() {
        this.destroy(true);
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
