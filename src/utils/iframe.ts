
/**
 * Create an iframe with the given HTML content
 * @param html content
 * @param title title
 * @param attrs attributes
 * @returns HTML string
 */
export function renderInFrame(html: string, title: string, attrs: Record<string, string> = {}): string {
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '300px';
    iframe.style.border = 'none';
    iframe.scrolling = 'no';
    Object.entries(attrs).forEach(([ k, v ]) => iframe.setAttribute(k, v));
    iframe.id = 'iframe-' + Math.random().toString(36).substring(2, 15);

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const script = doc.createElement('script');
    script.defer = true;
    script.textContent = `
        (() => {
            const iframeId = '${iframe.id}';
            let lastHeight = 0;
            let rafId;
            let idleFrames = 0;
            const IDLE_FRAMES_LIMIT = 5; // Stop checking after 5 frames of no size change

            // Function to send the size to the parent window
            function postSize(height) {
                window.parent.postMessage({
                    type: 'iframeResize',
                    height: height,
                    // width is often less critical to sync, but can be included
                    // width: document.body.scrollWidth,
                    id: iframeId,
                }, '*'); // Use '*' for broad compatibility, or specify the parent origin for security
            }

            // The core update loop, runs on each animation frame
            function updateLoop() {
                const newHeight = document.body.scrollHeight;

                if (newHeight !== lastHeight) {
                    lastHeight = newHeight;
                    postSize(newHeight);
                    idleFrames = 0; // Reset idle counter on change
                } else {
                    idleFrames++; // Increment idle counter if no change
                }

                // If the size hasn't changed for a few frames, stop the loop to save CPU
                if (idleFrames < IDLE_FRAMES_LIMIT) {
                    rafId = requestAnimationFrame(updateLoop);
                } else {
                    rafId = null; // Mark the loop as stopped
                }
            }

            // Function to schedule an update check. This is our trigger.
            function scheduleUpdate() {
                // If a loop is already running, do nothing.
                // If it's stopped, start it again.
                if (!rafId) {
                    idleFrames = 0; // Reset counter
                    rafId = requestAnimationFrame(updateLoop);
                }
            }
            
            // This observer now acts as a trigger to START the size checking loop
            const observer = new MutationObserver(scheduleUpdate);
            
            function init() {
                // Observe the body for any changes that might affect its size
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    characterData: true // Important for text changes
                });
    
                // Also trigger on window resize and load
                window.addEventListener('resize', scheduleUpdate);
                document.addEventListener('transitionend', scheduleUpdate);
                
                // Initial size check
                scheduleUpdate();
            }

            // Wait for the body to be ready before starting
            if (document.body) {
                init();
            } else {
                document.addEventListener('DOMContentLoaded', init);
            }
        })();
    `;
    doc.head.appendChild(script);
    iframe.srcdoc = doc.documentElement.outerHTML;

    if(title)
        return `<details><summary>${title}</summary>${iframe.outerHTML}</details>`;

    return iframe.outerHTML;
}

// This part remains the same, it correctly listens for messages from the iframe
window.addEventListener('message', (event: MessageEvent<{ type: string, height: number, width: number, id:string }>) => {
    // It's a good practice to check the origin for security reasons
    // if (event.origin !== 'expected-origin') return;

    if (event.data && event.data.type === 'iframeResize') {
        const iframe = document.getElementById(event.data.id) as HTMLIFrameElement;
        if (iframe) {
            // Use Math.ceil to avoid sub-pixel layout issues causing unnecessary scrollbars
            iframe.style.height = Math.ceil(event.data.height) + 'px';
            // console.debug('iframe size changed', event.data.id, event.data.height);
        }
    }
});
