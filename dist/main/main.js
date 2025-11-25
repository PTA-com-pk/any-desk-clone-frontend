"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
// Optional robotjs import - will be undefined if not installed
let robot;
try {
    robot = require('robotjs');
}
catch (error) {
    console.warn('robotjs not available - input injection will be disabled');
    console.warn('Install system dependencies and robotjs to enable remote control');
}
let mainWindow = null;
let tray = null;
const isDev = process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        // icon: path.join(__dirname, '../../assets/icon.png'), // Uncomment when icon is available
        title: 'Remote Support',
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
function createTray() {
    // Create a simple icon if no icon file exists
    // You can add an icon.png file to assets/ directory
    const icon = electron_1.nativeImage.createEmpty();
    // Alternative: Create a simple colored icon
    // const icon = nativeImage.createFromDataURL('data:image/png;base64,...');
    tray = new electron_1.Tray(icon);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Show',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                }
                else {
                    createWindow();
                }
            },
        },
        {
            label: 'Quit',
            click: () => {
                electron_1.app.quit();
            },
        },
    ]);
    tray.setToolTip('Remote Support');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            }
            else {
                mainWindow.show();
            }
        }
        else {
            createWindow();
        }
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    createTray();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC handlers
electron_1.ipcMain.handle('get-app-version', () => {
    return electron_1.app.getVersion();
});
// Handle remote control input injection
electron_1.ipcMain.handle('inject-mouse-event', async (_event, eventData) => {
    if (!robot) {
        console.warn('robotjs not available - input injection disabled');
        return;
    }
    try {
        switch (eventData.type) {
            case 'mousemove':
                robot.moveMouse(eventData.x, eventData.y);
                break;
            case 'mousedown':
                robot.moveMouse(eventData.x, eventData.y);
                if (eventData.button === 0) {
                    robot.mouseToggle('down', 'left');
                }
                else if (eventData.button === 1) {
                    robot.mouseToggle('down', 'middle');
                }
                else if (eventData.button === 2) {
                    robot.mouseToggle('down', 'right');
                }
                break;
            case 'mouseup':
                robot.moveMouse(eventData.x, eventData.y);
                if (eventData.button === 0) {
                    robot.mouseToggle('up', 'left');
                }
                else if (eventData.button === 1) {
                    robot.mouseToggle('up', 'middle');
                }
                else if (eventData.button === 2) {
                    robot.mouseToggle('up', 'right');
                }
                break;
            case 'wheel':
                // Scroll mouse - robotjs scrollMouse takes deltaX and deltaY
                robot.scrollMouse(eventData.deltaX || 0, eventData.deltaY || 0);
                break;
        }
    }
    catch (error) {
        console.error('Failed to inject mouse event:', error);
        throw error;
    }
});
electron_1.ipcMain.handle('inject-keyboard-event', async (_event, eventData) => {
    if (!robot) {
        console.warn('robotjs not available - input injection disabled');
        return;
    }
    try {
        if (eventData.type === 'keydown') {
            const modifiers = [];
            if (eventData.shiftKey)
                modifiers.push('shift');
            if (eventData.ctrlKey)
                modifiers.push('control');
            if (eventData.altKey)
                modifiers.push('alt');
            if (eventData.metaKey)
                modifiers.push('command');
            // Map key code to robotjs format
            const key = mapKeyCodeToRobotjs(eventData.key, eventData.code);
            if (modifiers.length > 0) {
                robot.keyTap(key, modifiers);
            }
            else {
                robot.keyTap(key);
            }
        }
        // robotjs keyTap handles both keydown/keyup, so we don't need to handle keyup separately
    }
    catch (error) {
        console.error('Failed to inject keyboard event:', error);
        throw error;
    }
});
// Helper function to map browser key codes to robotjs format
function mapKeyCodeToRobotjs(key, code) {
    // Handle letter keys
    if (code.startsWith('Key')) {
        return code.replace('Key', '').toLowerCase();
    }
    // Handle number keys
    if (code.startsWith('Digit')) {
        return code.replace('Digit', '');
    }
    // Handle special keys
    const keyMap = {
        'Enter': 'enter',
        'Space': 'space',
        'Backspace': 'backspace',
        'Tab': 'tab',
        'Escape': 'escape',
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right',
        'Delete': 'delete',
        'Insert': 'insert',
        'Home': 'home',
        'End': 'end',
        'PageUp': 'pageup',
        'PageDown': 'pagedown',
        'CapsLock': 'capslock',
        'F1': 'f1',
        'F2': 'f2',
        'F3': 'f3',
        'F4': 'f4',
        'F5': 'f5',
        'F6': 'f6',
        'F7': 'f7',
        'F8': 'f8',
        'F9': 'f9',
        'F10': 'f10',
        'F11': 'f11',
        'F12': 'f12',
    };
    // Try code first, then key
    if (keyMap[code]) {
        return keyMap[code];
    }
    // Fallback to lowercase key
    return key.toLowerCase();
}
//# sourceMappingURL=main.js.map