import { extension_settings } from "../../../../../extensions.js";

export interface QuickReplyV1 {
    enabled: boolean;
    label: string;
    mes: string;
};

/**
 * Get quick reply content
 * @param name collection name
 * @param label title
 * @returns quick reply content
 */
export function getQuickReply(name: string | RegExp, label: string | RegExp): string {
    // @ts-expect-error
    const config = extension_settings.quickReplyV2?.config;
    if(!config)
        return '';

    // @ts-expect-error
    const setLink = _.find(config.setList, link => link.set.name === name || link.set.name.match(name));
    if (setLink) {
        // @ts-expect-error
        const quickReplay = _.find(setLink.set.qrList, qr => qr.label === label || qr.label.match(label));
        return quickReplay?.message || '';
    }

    return '';
}

/**
 * Get quick reply data
 * @param name collection name
 * @returns quick reply data
 */
export function getQuickReplyData(name: string | RegExp) {
    // @ts-expect-error
    const config = extension_settings.quickReplyV2?.config;
    if(!config)
        return null;

    for(const link of config.setList)
        if(link.set.name === name || link.set.name.match(name))
            return link;

    return null;
}
