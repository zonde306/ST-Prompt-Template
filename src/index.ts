import { init as finit, exit as fexit } from './handler';
import { init as vinit, exit as vexit } from './command';

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
    console.log('ST-Prompt-Template initialized');
}

export async function exit() {
    await fexit();
    await vexit();
    console.log('ST-Prompt-Template exited');
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

jQuery(async () => {
    await init();
});
