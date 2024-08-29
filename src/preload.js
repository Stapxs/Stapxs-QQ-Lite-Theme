const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('bcui_theme', {
    rendererReady: () => ipcRenderer.send('LiteLoader.bcui_theme.rendererReady'),
    updateStyle: (callback) => ipcRenderer.on('LiteLoader.bcui_theme.updateStyle', callback),
    updateTheme: (config) => ipcRenderer.on('LiteLoader.bcui_theme.updateTheme', config),
    setSetting: (k, v) => ipcRenderer.send('LiteLoader.bcui_theme.setSetting', k, v),

    logToMain: (...args) => ipcRenderer.send('LiteLoader.bcui_theme.logToMain', ...args),
    logToError: (...args) => ipcRenderer.send('LiteLoader.bcui_theme.logToError', ...args),

    getVersion: () => ipcRenderer.invoke('LiteLoader.bcui_theme.getVersion'),
    getSetting: () => ipcRenderer.invoke('LiteLoader.bcui_theme.getSetting'),
    getSettingHTML: () => ipcRenderer.invoke('LiteLoader.bcui_theme.getSettingHTML'),
    chooseImage: () => ipcRenderer.send('LiteLoader.bcui_theme.chooseImage')
})
