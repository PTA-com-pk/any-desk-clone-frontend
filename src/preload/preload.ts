import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Remote control injection (host side)
  injectMouseEvent: (eventData: {
    type: string;
    x: number;
    y: number;
    button?: number;
    deltaX?: number;
    deltaY?: number;
  }) => ipcRenderer.invoke('inject-mouse-event', eventData),

  injectKeyboardEvent: (eventData: {
    type: string;
    key: string;
    code: string;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  }) => ipcRenderer.invoke('inject-keyboard-event', eventData),
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      injectMouseEvent: (eventData: {
        type: string;
        x: number;
        y: number;
        button?: number;
        deltaX?: number;
        deltaY?: number;
      }) => Promise<void>;
      injectKeyboardEvent: (eventData: {
        type: string;
        key: string;
        code: string;
        shiftKey?: boolean;
        ctrlKey?: boolean;
        altKey?: boolean;
        metaKey?: boolean;
      }) => Promise<void>;
    };
  }
}
