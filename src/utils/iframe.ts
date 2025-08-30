

export function renderInFrame(html: string, attrs: Record<string, string> = {}): string {
    const iframe = document.createElement('iframe');
    iframe.srcdoc = html;
    iframe.setAttribute('style', 'width: 100%; height: auto; border: none;');
    Object.assign(iframe, attrs);
    return iframe.outerHTML;
}
