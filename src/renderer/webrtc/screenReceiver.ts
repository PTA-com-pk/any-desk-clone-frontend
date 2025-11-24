import { PeerConnection } from './peerConnection';

export class ScreenReceiver {
  private peerConnection: PeerConnection;
  private remoteStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  constructor(peerConnection: PeerConnection) {
    this.peerConnection = peerConnection;
    this.setupTrackHandler();
  }

  private setupTrackHandler(): void {
    this.peerConnection.getPeerConnection().ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.remoteStream = remoteStream;
      if (this.videoElement) {
        this.videoElement.srcObject = remoteStream;
      }
    };
  }

  setVideoElement(element: HTMLVideoElement): void {
    this.videoElement = element;
    if (this.remoteStream) {
      element.srcObject = this.remoteStream;
      element.play().catch((error) => {
        console.error('Failed to play video:', error);
      });
    }
  }

  getStream(): MediaStream | null {
    return this.remoteStream;
  }

  hasStream(): boolean {
    return this.remoteStream !== null && this.remoteStream.active;
  }
}
