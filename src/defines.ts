export interface Chat {
    role: string;
    content: string;
}

export interface ChatData {
    chat: Chat[];
    dryRun: boolean;
}

export interface Message {
    extra: Record<string, unknown>;
    is_system: boolean;
    is_user: boolean;
    mes: string;
    name: string;
    send_date: string;
    variables?: Record<number, Record<string, unknown>>;
    swipe_id: number;
    swipe_info: Array<unknown>;
    swipes: Array<string>;
}

export interface Metadata {
    variables?: Record<string, unknown>;
}
