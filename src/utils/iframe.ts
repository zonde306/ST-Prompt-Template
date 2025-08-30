

export function renderInFrame(html: string, attrs: Record<string, string> = {}): string {
    const iframe = document.createElement('iframe');
    iframe.srcdoc = html;
    const doc = (iframe.contentDocument ?? iframe.contentWindow?.document);
    iframe.style.width = '100%';
    iframe.style.height = `${doc?.body?.scrollHeight ?? 300}px`;
    iframe.style.border = 'none';
    Object.entries(attrs).forEach(([ k, v ]) => iframe.setAttribute(k, v));

    // Auto resize
    if(doc) {
        const script = doc.createElement('script');
        script.textContent = `
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
                    type: 'iframeResize',
                    height: height,
                    width: width
                }, '*');
                }

                // 初始发送
                sendSize();

                // 监听 DOM 变化
                const observer = new MutationObserver(sendSize);
                observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
                });

                // 监听窗口缩放
                window.addEventListener('resize', sendSize);

                // 监听图片加载完成（避免高度计算不准确）
                document.addEventListener('load', function(e) {
                if (e.target.tagName === 'IMG') sendSize();
                }, true);
            })();
        `;
        doc.head.appendChild(script);
    }

    return iframe.outerHTML;
}
