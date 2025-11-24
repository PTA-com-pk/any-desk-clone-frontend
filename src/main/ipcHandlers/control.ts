import { ipcMain, nativeImage } from 'electron';
import * as robot from 'robotjs';

// Install robotjs: npm install robotjs
// Note: robotjs may require native compilation

export function setupControlHandlers() {
  ipcMain.handle('inject-mouse-event', async (_event, eventData: {
    type: string;
    x: number;
    y: number;
    button?: number;
    deltaX?: number;
    deltaY?: number;
  }) => {
    try {
      const screenSize = robot.getScreenSize();
      const screenWidth = screenSize.width;
      const screenHeight = screenSize.height;

      // Scale coordinates from remote video dimensions to screen dimensions
      // For now, assume 1:1 mapping (can be improved based on video dimensions)
      
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
          robot.scrollMouse(eventData.deltaX || 0, eventData.deltaY || 0);
          break;
      }
    } catch (error) {
      console.error('Failed to inject mouse event:', error);
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
    try {
      if (eventData.type === 'keydown') {
        // Handle special keys
        const modifiers: string[] = [];
        if (eventData.shiftKey) modifiers.push('shift');
        if (eventData.ctrlKey) modifiers.push('control');
        if (eventData.altKey) modifiers.push('alt');
        if (eventData.metaKey) modifiers.push('command');

        // Map common key codes to robotjs format
        let key = eventData.key.toLowerCase();
        
        // Handle special keys
        if (eventData.code.startsWith('Key')) {
          key = eventData.code.replace('Key', '').toLowerCase();
        } else if (eventData.code.startsWith('Digit')) {
          key = eventData.code.replace('Digit', '');
        } else {
          // Map other special keys
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
          };
          key = keyMap[eventData.code] || key;
        }

        if (modifiers.length > 0) {
          robot.keyTap(key, modifiers);
        } else {
          robot.keyTap(key);
        }
      }
      // keyup events are typically not needed for robotjs as keyTap handles both
    } catch (error) {
      console.error('Failed to inject keyboard event:', error);
    }
  });
}
