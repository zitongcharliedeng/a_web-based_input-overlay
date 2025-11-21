import { contextBridge, ipcRenderer } from 'electron';

// No global type declaration - this preload is only used by modeSelector.html
// which has inline JavaScript (no TypeScript checking needed)

contextBridge.exposeInMainWorld('electronAPI', {
	launchMode: (mode: 'interactive' | 'readonly'): void => {
		ipcRenderer.send('launch-mode', mode);
	}
});
