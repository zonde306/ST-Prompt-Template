/// <reference path="../../../../../../global.d.ts" />
import { WorldInfoEntry } from "../function/worldinfo.js";

type TextContent = {
    type: "text";
    text: string;
}

type ImageContent = {
    type: "image";
    image_url: {
        url: string // base64 encoded image
    };
}

export interface Chat {
    role: string;
    content: string | (TextContent | ImageContent)[];
}

// event_types.CHAT_COMPLETION_PROMPT_READY
export interface ChatData {
    chat: Chat[];
    dryRun: boolean;
}

// Allow custom fields
export interface MessageExtra extends ChatMessageExtra, Record<string, unknown> {
}

// Allow custom fields
export interface Message extends ChatMessage {
    // old formats

    /**
     * @deprecated
     */
    variables?: Record<string, any>[];

    /**
     * @deprecated
     */
    is_ejs_processed?: Array<boolean>;

    /**
     * @deprecated
     */
    variables_initialized?: Array<boolean>;

    // new formats
    swipe_info?: (SwipeInfo & {
        variables?: Record<string, any>;
        variables_initialized?: boolean;
        is_ejs_processed?: boolean;
    })[];
}

export interface ScriptInject {
    depth: number;
    filter: string | null;
    position: number;
    role: number;
    scan: boolean;
    value: string;
}

export interface Metadata extends Record<string, unknown> {
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

// event_types.CHAT_COMPLETION_SETTINGS_READY
export interface GenerateData {
    messages: Array<Chat>;
    model: string;
    temperature?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    top_p?: number;
    max_tokens?: number;
    stream?: boolean;
    logit_bias?: Record<string, number> | undefined;
    stop?: string[] | undefined;
    chat_completion_source?: string;
    n?: number | undefined;
    user_name?: string;
    char_name?: string;
    group_names?: string[];
    show_thoughts?: boolean;
    reverse_proxy?: string;
    proxy_password?: string;
    logprobs?: number | undefined;
    top_k?: number;
    claude_use_sysprompt?: boolean;
    assistant_prefill?: string;
    min_p?: number;
    repetition_penalty?: number;
    top_a?: number;
    use_fallback?: boolean;
    provider?: string;
    allow_fallbacks?: boolean;
    middleout?: boolean;
    api_url_scale?: string;
    max_completion_tokens?: number;
    seed?: number;
    tools?: any[];
    tool_choice?: string;
    assistant_impersonation?: string;
}

export interface CombinedPromptData {
    prompt: string;
    dryRun: boolean;
}

export interface GenerateAfterData {
    prompt: string | Chat[];
}

export interface WorldInfoLoaded {
    globalLore: WorldInfoEntry[];
    characterLore: WorldInfoEntry[];
    chatLore: WorldInfoEntry[];
    personaLore: WorldInfoEntry[];
}

export interface WorldInfoScan {
    state: {
        current: number;
        next: number;
        loopCount: number;
    };
    new: {
        all: WorldInfoEntry[];
        successful: WorldInfoEntry[];
    };
    activated: {
        entries: WorldInfoEntry[];
        text: string;
    };
    sortedEntries: WorldInfoEntry[];
    recursionDelay: {
        availableLevels: number[];
        currentLevel: number;
    };
    budget: {
        current: number;
        overflowed: boolean;
    };
    /** @type {import('../../../../../world-info.js').WorldInfoTimedEffects} */
    timedEffects: any;
}
