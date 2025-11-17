import { contextBridge, ipcRenderer } from 'electron';

declare global {
	interface Window {
		electronAPI: {
			launchMode: (mode: 'interactive' | 'readonly') => void;
		};
	}
}

contextBridge.exposeInMainWorld('electronAPI', {
	launchMode: (mode: 'interactive' | 'readonly'): void => {
		ipcRenderer.send('launch-mode', mode);
	}
});
