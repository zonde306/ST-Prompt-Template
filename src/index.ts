import { init as finit, exit as fexit } from './modules/handler';
import { init as vinit, exit as vexit } from './modules/command';
import { init as uinit, exit as uexit } from './modules/ui';
import { init as einit, exit as eexit } from './modules/exports';

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
    await uinit();
    await einit();
    console.log('ST-Prompt-Template initialized');
}

export async function exit() {
    await fexit();
    await vexit();
    await uexit();
    await eexit();
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

// jQuery
$(async () => {
    await init();
});
