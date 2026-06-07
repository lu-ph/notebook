import { contextBridge, ipcRenderer } from 'electron';

type ApiCallback = (content: string) => void;

contextBridge.exposeInMainWorld('api', {
  onFileLoaded: (callback: ApiCallback) =>
    ipcRenderer.on('file-loaded', (_, content) => callback(content)),
  onFileChanged: (callback: ApiCallback) => 
    ipcRenderer.on('file-changed', (_event, value) => callback(value)),
  saveFile: (content: string) => ipcRenderer.send('save-file', content),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window')
});