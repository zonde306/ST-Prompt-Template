

export function renderInFrame(html: string, attrs: Record<string, string> = {}): string {
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '300px';
    iframe.style.border = 'none';
    Object.entries(attrs).forEach(([ k, v ]) => iframe.setAttribute(k, v));
    iframe.id = iframe.id || 'iframe-' + Math.random().toString(36);

    const dom = new DOMParser().parseFromString(html, 'text/html');
    dom.head.appendChild(dom.createElement('script')).innerText = `
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
                window.parent.document.querySelector('#${iframe.id}').style.height = height + 'px';
            }
            sendSize();
            const observer = new MutationObserver(sendSize);
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
            window.addEventListener('resize', sendSize);
            document.addEventListener('load', function(e) {
                if (e.target.tagName === 'IMG')
                    sendSize();
            }, true);
        })();
    `;
    iframe.srcdoc = dom.documentElement.innerHTML;

    return iframe.outerHTML;
}
