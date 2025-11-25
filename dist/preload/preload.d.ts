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
export {};
//# sourceMappingURL=preload.d.ts.map