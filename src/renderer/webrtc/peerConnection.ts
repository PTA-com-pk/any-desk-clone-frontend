import { getWebRTCConfig } from './config';

export type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export interface PeerConnectionCallbacks {
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
  onTrack?: (event: RTCTrackEvent) => void;
  onDataChannel?: (channel: RTCDataChannel) => void;
}

export class PeerConnection {
  private pc: RTCPeerConnection;
  private callbacks: PeerConnectionCallbacks;
  private dataChannel: RTCDataChannel | null = null;

  constructor(callbacks: PeerConnectionCallbacks = {}) {
    this.callbacks = callbacks;
    const config = getWebRTCConfig();
    this.pc = new RTCPeerConnection(config);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.callbacks.onIceCandidate) {
        this.callbacks.onIceCandidate(event.candidate);
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (this.callbacks.onConnectionStateChange) {
        const state = this.pc.connectionState as ConnectionState;
        this.callbacks.onConnectionStateChange(state);
      }
    };

    this.pc.ontrack = (event) => {
      if (this.callbacks.onTrack) {
        this.callbacks.onTrack(event);
      }
    };

    this.pc.ondatachannel = (event) => {
      const channel = event.channel;
      this.dataChannel = channel;
      if (this.callbacks.onDataChannel) {
        this.callbacks.onDataChannel(channel);
      }
    };
  }

  async createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
    return await this.pc.createOffer(options);
  }

  async createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit> {
    return await this.pc.createAnswer(options);
  }

  async setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setLocalDescription(description);
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(description);
  }

  addTrack(track: MediaStreamTrack, stream: MediaStream): RTCRtpSender {
    return this.pc.addTrack(track, stream);
  }

  addTransceiver(
    trackOrKind: MediaStreamTrack | string,
    init?: RTCRtpTransceiverInit
  ): RTCRtpTransceiver {
    return this.pc.addTransceiver(trackOrKind, init);
  }

  createDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel {
    const channel = this.pc.createDataChannel(label, options);
    this.dataChannel = channel;
    return channel;
  }

  getDataChannel(): RTCDataChannel | null {
    return this.dataChannel;
  }

  getConnectionState(): ConnectionState {
    return this.pc.connectionState as ConnectionState;
  }

  getReceivers(): RTCRtpReceiver[] {
    return this.pc.getReceivers();
  }

  getSenders(): RTCRtpSender[] {
    return this.pc.getSenders();
  }

  close(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    this.pc.close();
  }

  getPeerConnection(): RTCPeerConnection {
    return this.pc;
  }
}
