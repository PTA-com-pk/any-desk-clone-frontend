"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    // Remote control injection (host side)
    injectMouseEvent: (eventData) => electron_1.ipcRenderer.invoke('inject-mouse-event', eventData),
    injectKeyboardEvent: (eventData) => electron_1.ipcRenderer.invoke('inject-keyboard-event', eventData),
});
//# sourceMappingURL=preload.js.map