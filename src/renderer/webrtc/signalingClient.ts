import { io, Socket } from 'socket.io-client';

export interface SignalingClientEvents {
  'room-created': (data: { roomId: string }) => void;
  'room-joined': (data: { roomId: string }) => void;
  'viewer-joined': (data: { roomId: string }) => void;
  'peer-disconnected': (data: { roomId: string }) => void;
  'offer': (data: { offer: RTCSessionDescriptionInit; from: string }) => void;
  'answer': (data: { answer: RTCSessionDescriptionInit; from: string }) => void;
  'ice-candidate': (data: { candidate: RTCIceCandidateInit; from: string }) => void;
  'remote-control-event': (data: { event: any; from: string }) => void;
  'error': (data: { message: string }) => void;
}

export class SignalingClient {
  private socket: Socket | null = null;
  private serverUrl: string;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('Connected to signaling server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Failed to connect to signaling server:', error);
        reject(error);
      });

      // Set up event forwarding
      this.setupEventForwarding();
    });
  }

  private setupEventForwarding() {
    if (!this.socket) return;

    const events: (keyof SignalingClientEvents)[] = [
      'room-created',
      'room-joined',
      'viewer-joined',
      'peer-disconnected',
      'offer',
      'answer',
      'ice-candidate',
      'remote-control-event',
      'error',
    ];

    events.forEach((event) => {
      this.socket!.on(event, (data: any) => {
        const handlers = this.listeners.get(event);
        if (handlers) {
          handlers.forEach((handler) => handler(data));
        }
      });
    });
  }

  on<K extends keyof SignalingClientEvents>(
    event: K,
    handler: SignalingClientEvents[K]
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off<K extends keyof SignalingClientEvents>(
    event: K,
    handler: SignalingClientEvents[K]
  ): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  createRoom(roomId: string): void {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Not connected to signaling server');
    }
    this.socket.emit('create-room', { roomId });
  }

  joinRoom(roomId: string): void {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Not connected to signaling server');
    }
    this.socket.emit('join-room', { roomId });
  }

  sendOffer(roomId: string, offer: RTCSessionDescriptionInit): void {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Not connected to signaling server');
    }
    this.socket.emit('offer', { roomId, offer });
  }

  sendAnswer(roomId: string, answer: RTCSessionDescriptionInit): void {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Not connected to signaling server');
    }
    this.socket.emit('answer', { roomId, answer });
  }

  sendIceCandidate(roomId: string, candidate: RTCIceCandidateInit): void {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Not connected to signaling server');
    }
    this.socket.emit('ice-candidate', { roomId, candidate });
  }

  sendRemoteControlEvent(roomId: string, event: any): void {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Not connected to signaling server');
    }
    this.socket.emit('remote-control-event', { roomId, event });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}
