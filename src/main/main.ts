import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Optional robotjs import - will be undefined if not installed
let robot: any;
try {
  robot = require('robotjs');
} catch (error) {
  console.warn('robotjs not available - input injection will be disabled');
  console.warn('Install system dependencies and robotjs to enable remote control');
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray(): void {
  // Create a simple icon if no icon file exists
  // You can add an icon.png file to assets/ directory
  const icon = nativeImage.createEmpty();
  
  // Alternative: Create a simple colored icon
  // const icon = nativeImage.createFromDataURL('data:image/png;base64,...');
  
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      },
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Remote Support');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    } else {
      createWindow();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Handle remote control input injection
ipcMain.handle('inject-mouse-event', async (_event, eventData: {
  type: string;
  x: number;
  y: number;
  button?: number;
  deltaX?: number;
  deltaY?: number;
}) => {
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
        } else if (eventData.button === 1) {
          robot.mouseToggle('down', 'middle');
        } else if (eventData.button === 2) {
          robot.mouseToggle('down', 'right');
        }
        break;
      
      case 'mouseup':
        robot.moveMouse(eventData.x, eventData.y);
        if (eventData.button === 0) {
          robot.mouseToggle('up', 'left');
        } else if (eventData.button === 1) {
          robot.mouseToggle('up', 'middle');
        } else if (eventData.button === 2) {
          robot.mouseToggle('up', 'right');
        }
        break;
      
      case 'wheel':
        // Scroll mouse - robotjs scrollMouse takes deltaX and deltaY
        robot.scrollMouse(eventData.deltaX || 0, eventData.deltaY || 0);
        break;
    }
  } catch (error) {
    console.error('Failed to inject mouse event:', error);
    throw error;
  }
});

ipcMain.handle('inject-keyboard-event', async (_event, eventData: {
  type: string;
  key: string;
  code: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}) => {
  if (!robot) {
    console.warn('robotjs not available - input injection disabled');
    return;
  }
  
  try {
    if (eventData.type === 'keydown') {
      const modifiers: string[] = [];
      if (eventData.shiftKey) modifiers.push('shift');
      if (eventData.ctrlKey) modifiers.push('control');
      if (eventData.altKey) modifiers.push('alt');
      if (eventData.metaKey) modifiers.push('command');

      // Map key code to robotjs format
      const key = mapKeyCodeToRobotjs(eventData.key, eventData.code);
      
      if (modifiers.length > 0) {
        robot.keyTap(key, modifiers);
      } else {
        robot.keyTap(key);
      }
    }
    // robotjs keyTap handles both keydown/keyup, so we don't need to handle keyup separately
  } catch (error) {
    console.error('Failed to inject keyboard event:', error);
    throw error;
  }
});

// Helper function to map browser key codes to robotjs format
function mapKeyCodeToRobotjs(key: string, code: string): string {
  // Handle letter keys
  if (code.startsWith('Key')) {
    return code.replace('Key', '').toLowerCase();
  }
  
  // Handle number keys
  if (code.startsWith('Digit')) {
    return code.replace('Digit', '');
  }
  
  // Handle special keys
  const keyMap: { [key: string]: string } = {
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
