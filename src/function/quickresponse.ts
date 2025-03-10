import { extension_settings } from "../../../../../extensions.js";

export interface QuickReplyV1 {
    enabled: boolean;
    label: string;
    mes: string;
};

export function getQuickResponse(name: string | RegExp, label: string | RegExp): string {
    /*
    // @ts-expect-error
    const quickResponseSet : QuickReplyV1[] = extension_settings.quickReply;
    let found = quickResponseSet.find(qr => qr.label === label);
    if (found) {
        return found.mes;
    }
    */

    // @ts-expect-error
    const config = extension_settings.quickReplyV2?.config;
    if(!config)
        return '';

    const setLink = _.find(config.setList, link => link.set.name === name || link.set.name.match(name));
    if (setLink) {
        const quickReplay = _.find(setLink.set.qrList, qr => qr.label === label || qr.label.match(label));
        return quickReplay?.message || '';
    }

    return '';
}
