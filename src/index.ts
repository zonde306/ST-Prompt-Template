import { init as finit, exit as fexit } from './evaljs';
import { init as vinit, exit as vexit } from './variables';

interface PluginInfo {
    id: string;
    name: string;
    description: string;
}

interface Plugin {
    init: () => Promise<void>;
    exit: () => Promise<void>;
    info: PluginInfo;
}

export async function init() {
    await finit();
    await vinit();
}

export async function exit() {
    await fexit();
    await vexit();
}

export const info: PluginInfo = {
    id: 'ST-Prompt-Template',
    name: 'Prompt Template',
    description: '',
};

const plugin: Plugin = {
    init,
    exit,
    info,
};

export default plugin;

init();
