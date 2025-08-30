

export function renderInFrame(html: string, attrs: Record<string, string> = {}): string {
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '300px';
    iframe.style.border = 'none';
    Object.entries(attrs).forEach(([ k, v ]) => iframe.setAttribute(k, v));
    iframe.id = 'iframe-' + Math.random().toString(36).substring(2, 15);

    const dom = new DOMParser().parseFromString(html, 'text/html');
    dom.head.appendChild(dom.createElement('script')).textContent = `
        (function () {
            function sendSize() {
                const height = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight
                );
                const width = Math.max(
                    document.body.scrollWidth,
                    document.documentElement.scrollWidth
                );
                window.parent.postMessage({
                    type: 'iframeSize',
                    height,
                    width,
                    id: '${iframe.id}',
                });
            }
            const observer = new MutationObserver(sendSize);
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
            window.addEventListener('resize', sendSize);
            window.addEventListener('load', sendSize);
            sendSize();
        })();
    `;
    iframe.srcdoc = dom.documentElement.outerHTML;

    return iframe.outerHTML;
}

window.addEventListener('message', (event: MessageEvent<{ type: string, height: number, width: number, id: string }>) => {
    if (event.data.type === 'iframeSize') {
        const iframe = document.getElementById(event.data.id);
        if (iframe) {
            iframe.style.height = event.data.height + 'px';
            console.log('iframe size changed', event.data.id, event.data.height);
        }
    }
});
