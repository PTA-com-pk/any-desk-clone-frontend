// Type declarations for robotjs
// This allows TypeScript to compile even if robotjs isn't installed yet
declare module 'robotjs' {
  export function moveMouse(x: number, y: number): void;
  export function mouseClick(button?: 'left' | 'right' | 'middle', double?: boolean): void;
  export function mouseToggle(down: 'down' | 'up', button?: 'left' | 'right' | 'middle'): void;
  export function scrollMouse(x: number, y: number): void;
  export function getMousePos(): { x: number; y: number };
  export function getScreenSize(): { width: number; height: number };
  
  export function keyTap(key: string, modifier?: string | string[]): void;
  export function keyToggle(key: string, down: 'down' | 'up', modifier?: string | string[]): void;
  export function typeString(string: string, cpm?: number): void;
  
  export function setKeyboardDelay(ms: number): void;
  export function setMouseDelay(ms: number): void;
}
