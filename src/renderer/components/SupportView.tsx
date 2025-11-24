import React, { useEffect, useState, useRef } from 'react';
import { SignalingClient } from '../webrtc/signalingClient';
import { PeerConnection } from '../webrtc/peerConnection';
import { ScreenReceiver } from '../webrtc/screenReceiver';
import { getSignalingServerUrl } from '../webrtc/config';
import { handleSignalingError, handlePeerConnectionError, logError } from '../utils/errorHandler';

interface SupportViewProps {
  roomId: string;
  onBack: () => void;
}

export default function SupportView({ roomId, onBack }: SupportViewProps) {
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const signalingClientRef = useRef<SignalingClient | null>(null);
  const peerConnectionRef = useRef<PeerConnection | null>(null);
  const screenReceiverRef = useRef<ScreenReceiver | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  useEffect(() => {
    initializeConnection();

    return () => {
      cleanup();
    };
  }, [roomId]);

  useEffect(() => {
    const videoElement = remoteVideoRef.current;
    if (videoElement && screenReceiverRef.current) {
      screenReceiverRef.current.setVideoElement(videoElement);
    }
  }, []);

  const initializeConnection = async () => {
    try {
      // Connect to signaling server
      const signaling = new SignalingClient(getSignalingServerUrl());
      await signaling.connect();
      signalingClientRef.current = signaling;

      setConnectionStatus('Connected to server');

      // Join room
      signaling.joinRoom(roomId);

      signaling.on('room-joined', () => {
        setConnectionStatus('Room joined. Connecting to host...');
        setupWebRTC();
      });

      signaling.on('peer-disconnected', () => {
        setConnectionStatus('Host disconnected');
        setIsConnected(false);
      });

      signaling.on('answer', async ({ answer }) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(answer);
        }
      });

      signaling.on('ice-candidate', async ({ candidate }) => {
        if (peerConnectionRef.current && candidate) {
          await peerConnectionRef.current
            .getPeerConnection()
            .addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      signaling.on('error', ({ message }) => {
        const errorMsg = handleSignalingError(new Error(message));
        setConnectionStatus(`Error: ${errorMsg}`);
        logError('Signaling', new Error(message));
      });
    } catch (error) {
      logError('Connection Initialization', error);
      const errorMsg = handleSignalingError(error);
      setConnectionStatus(`Failed to connect: ${errorMsg}`);
    }
  };

  const setupWebRTC = async () => {
    try {
      const pc = new PeerConnection({
        onIceCandidate: (candidate) => {
          if (signalingClientRef.current && roomId) {
            signalingClientRef.current.sendIceCandidate(roomId, candidate.toJSON());
          }
        },
        onConnectionStateChange: (state) => {
          if (state === 'failed' || state === 'disconnected' || state === 'closed') {
            const errorMsg = handlePeerConnectionError(state);
            setConnectionStatus(errorMsg);
            logError('PeerConnection', new Error(`Connection state: ${state}`));
          } else {
            setConnectionStatus(`Connection: ${state}`);
          }
          setIsConnected(state === 'connected');
        },
        onTrack: () => {
          setConnectionStatus('Receiving stream...');
        },
        onDataChannel: (channel) => {
          dataChannelRef.current = channel;
          channel.onopen = () => {
            console.log('Data channel opened');
          };
        },
      });

      peerConnectionRef.current = pc;

      // Create receiver
      const receiver = new ScreenReceiver(pc);
      screenReceiverRef.current = receiver;

      if (remoteVideoRef.current) {
        receiver.setVideoElement(remoteVideoRef.current);
      }

      // Wait for data channel or create one
      if (!dataChannelRef.current) {
        const dataChannel = pc.createDataChannel('remote-control', {
          ordered: true,
        });
        dataChannelRef.current = dataChannel;
      }

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (signalingClientRef.current) {
        signalingClientRef.current.sendOffer(roomId, offer);
      }

      setConnectionStatus('Waiting for host...');
    } catch (error) {
      logError('WebRTC Setup', error);
      const errorMsg = handleSignalingError(error);
      setConnectionStatus(`Failed to setup connection: ${errorMsg}`);
    }
  };

  const sendRemoteControlEvent = (event: any) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify(event));
    } else if (signalingClientRef.current) {
      signalingClientRef.current.sendRemoteControlEvent(roomId, event);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = remoteVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const rect = video.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * video.videoWidth;
    const y = ((e.clientY - rect.top) / rect.height) * video.videoHeight;

    sendRemoteControlEvent({
      type: 'mousemove',
      x: Math.round(x),
      y: Math.round(y),
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = remoteVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const rect = video.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * video.videoWidth;
    const y = ((e.clientY - rect.top) / rect.height) * video.videoHeight;

    sendRemoteControlEvent({
      type: 'mousedown',
      x: Math.round(x),
      y: Math.round(y),
      button: e.button,
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = remoteVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const rect = video.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * video.videoWidth;
    const y = ((e.clientY - rect.top) / rect.height) * video.videoHeight;

    sendRemoteControlEvent({
      type: 'mouseup',
      x: Math.round(x),
      y: Math.round(y),
      button: e.button,
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLVideoElement>) => {
    sendRemoteControlEvent({
      type: 'wheel',
      deltaX: e.deltaX,
      deltaY: e.deltaY,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    sendRemoteControlEvent({
      type: 'keydown',
      key: e.key,
      code: e.code,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
    });
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    sendRemoteControlEvent({
      type: 'keyup',
      key: e.key,
      code: e.code,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
    });
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleDisconnect = () => {
    cleanup();
    onBack();
  };

  const cleanup = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (signalingClientRef.current) {
      signalingClientRef.current.disconnect();
      signalingClientRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="support-view"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <div className="support-view-header">
        <div className="session-info">
          <h2>Remote Support Session</h2>
          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
            <span>{connectionStatus}</span>
          </div>
        </div>
        <div className="support-actions">
          <button className="btn-secondary" onClick={toggleFullscreen}>
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button className="btn-danger" onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      </div>

      <div className="remote-screen-container">
        <video
          ref={remoteVideoRef}
          className="remote-video"
          autoPlay
          playsInline
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        />
        {!isConnected && (
          <div className="loading-overlay">
            <p>Connecting to remote screen...</p>
          </div>
        )}
      </div>
    </div>
  );
}
