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
    variables?: Record<number, Record<string, unknown>>;    // created by extensions
    swipe_id: number;
    swipe_info: Array<unknown>;
    swipes: Array<string>;
}

export interface ScriptInject {
    depth: number;
    filter: string | null;
    position: number;
    role: number;
    scan: boolean;
    value: string;
}

export interface Metadata {
    variables?: Record<string, unknown>;
    chat_id_hash?: number;
    lastInContextMessageId?: number;
    note_depth?: number;
    note_interval?: number;
    note_position?: number;
    note_prompt?: string;
    note_role?: number;
    quickReply?: {
        setList: Array<unknown>,
    };
    script_injects?: Record<number, ScriptInject>;
    tainted?: boolean;
    timedWorldInfo?: {
        cooldown: {};
        sticky: {};
    };
}
