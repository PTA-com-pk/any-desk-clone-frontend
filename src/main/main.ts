import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

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
// Note: For production, you'll need to install and configure native input injection library
// Options: robotjs (cross-platform but requires compilation), nut-js (modern alternative)
// For now, these are placeholders that log events
ipcMain.handle('inject-mouse-event', async (_event, eventData: {
  type: string;
  x: number;
  y: number;
  button?: number;
  deltaX?: number;
  deltaY?: number;
}) => {
  console.log('Mouse event received:', eventData);
  // TODO: Implement native mouse injection using robotjs, nut-js, or platform-specific APIs
  // Example with robotjs (requires: npm install robotjs):
  // robot.moveMouse(eventData.x, eventData.y);
  // robot.mouseClick(eventData.button === 0 ? 'left' : 'right');
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
  console.log('Keyboard event received:', eventData);
  // TODO: Implement native keyboard injection
  // Example with robotjs:
  // robot.keyTap(eventData.key, modifiers);
});
