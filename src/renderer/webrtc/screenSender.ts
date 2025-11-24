import { PeerConnection } from './peerConnection';

export class ScreenSender {
  private peerConnection: PeerConnection;
  private stream: MediaStream | null = null;
  private stopCallback: (() => void) | null = null;

  constructor(peerConnection: PeerConnection) {
    this.peerConnection = peerConnection;
  }

  async startCapture(): Promise<MediaStream> {
    try {
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        } as MediaTrackConstraints,
        audio: false, // Can be enabled if needed
      });

      this.stream = stream;

      // Add video track to peer connection
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        this.peerConnection.addTrack(videoTrack, stream);
      }

      // Handle track ended (user stops sharing)
      videoTrack.onended = () => {
        this.stop();
      };

      // Set up stop callback
      this.stopCallback = () => {
        videoTrack.stop();
        stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
      };

      return stream;
    } catch (error) {
      console.error('Failed to capture screen:', error);
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Screen capture failed: ${error.message}`);
      }
      throw error;
    }
  }

  stop(): void {
    if (this.stopCallback) {
      this.stopCallback();
      this.stopCallback = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  isCapturing(): boolean {
    return this.stream !== null && this.stream.active;
  }
}
