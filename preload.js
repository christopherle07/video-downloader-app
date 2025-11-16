const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadConfig: () => ipcRenderer.invoke('load-config'),
    getDefaultPath: () => ipcRenderer.invoke('get-default-path'),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    downloadVideo: (data) => ipcRenderer.invoke('download-video', data),
    showError: (title, message) => ipcRenderer.invoke('show-error', title, message),
    
    windowMinimize: () => ipcRenderer.invoke('window-minimize'),
    windowClose: () => ipcRenderer.invoke('window-close'),
    openMainWindow: () => ipcRenderer.invoke('open-main-window'),
    closeMenubarWindow: () => ipcRenderer.invoke('close-menubar-window'),
    
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, progress) => callback(progress)),
    onDownloadComplete: (callback) => ipcRenderer.on('download-complete', (event, data) => callback(data)),
    onDownloadError: (callback) => ipcRenderer.on('download-error', (event, error) => callback(error))
});