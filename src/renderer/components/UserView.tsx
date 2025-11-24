import React, { useEffect, useState, useRef } from 'react';
import { SignalingClient } from '../webrtc/signalingClient';
import { PeerConnection } from '../webrtc/peerConnection';
import { ScreenSender } from '../webrtc/screenSender';
import { getSignalingServerUrl } from '../webrtc/config';
import { handleWebRTCError, handleSignalingError, handlePeerConnectionError, logError } from '../utils/errorHandler';

interface UserViewProps {
  onBack: () => void;
}

export default function UserView({ onBack }: UserViewProps) {
  const [roomId, setRoomId] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Setting up...');
  const [isConnected, setIsConnected] = useState(false);
  const [viewerJoined, setViewerJoined] = useState(false);
  
  const signalingClientRef = useRef<SignalingClient | null>(null);
  const peerConnectionRef = useRef<PeerConnection | null>(null);
  const screenSenderRef = useRef<ScreenSender | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializeSession();

    return () => {
      cleanup();
    };
  }, []);

  const generateRoomId = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const initializeSession = async () => {
    try {
      const newRoomId = generateRoomId();
      setRoomId(newRoomId);

      // Connect to signaling server
      const signaling = new SignalingClient(getSignalingServerUrl());
      await signaling.connect();
      signalingClientRef.current = signaling;

      setConnectionStatus('Connected to server');

      // Create room
      signaling.createRoom(newRoomId);

      signaling.on('room-created', () => {
        setConnectionStatus('Room created. Waiting for viewer...');
      });

      signaling.on('viewer-joined', () => {
        setViewerJoined(true);
        setConnectionStatus('Viewer connected. Setting up WebRTC...');
        setupWebRTC();
      });

      signaling.on('peer-disconnected', () => {
        setViewerJoined(false);
        setConnectionStatus('Viewer disconnected');
      });

      signaling.on('offer', async ({ offer }) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(offer);
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          signaling.sendAnswer(newRoomId, answer);
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
      logError('Session Initialization', error);
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
        onDataChannel: (channel) => {
          channel.onmessage = (event) => {
            try {
              const eventData = JSON.parse(event.data);
              handleRemoteControlEvent(eventData);
            } catch (error) {
              console.error('Failed to parse remote control event:', error);
            }
          };
        },
      });

      peerConnectionRef.current = pc;

      // Start screen capture
      const sender = new ScreenSender(pc);
      screenSenderRef.current = sender;
      
      const stream = await sender.startCapture();
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(console.error);
      }

      // Wait for viewer to create data channel (they will create it)

      setConnectionStatus('Screen sharing active');
    } catch (error) {
      logError('WebRTC Setup', error);
      const errorMsg = handleWebRTCError(error);
      setConnectionStatus(`Failed to start sharing: ${errorMsg}`);
    }
  };

  const handleRemoteControlEvent = async (event: any) => {
    if (!window.electronAPI) return;

    if (event.type === 'mousemove' || event.type === 'mousedown' || event.type === 'mouseup' || event.type === 'wheel') {
      await window.electronAPI.injectMouseEvent(event);
    } else if (event.type === 'keydown' || event.type === 'keyup') {
      await window.electronAPI.injectKeyboardEvent(event);
    }
  };

  const handleStopSharing = () => {
    cleanup();
    onBack();
  };

  const cleanup = () => {
    if (screenSenderRef.current) {
      screenSenderRef.current.stop();
      screenSenderRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (signalingClientRef.current) {
      signalingClientRef.current.disconnect();
      signalingClientRef.current = null;
    }
  };

  return (
    <div className="user-view">
      <div className="user-view-header">
        <div className="session-info">
          <h2>Sharing Session</h2>
          <div className="room-id">
            <label>Room ID:</label>
            <span className="room-id-value">{roomId}</span>
            <button
              className="btn-small"
              onClick={() => {
                navigator.clipboard.writeText(roomId);
              }}
            >
              Copy
            </button>
          </div>
        </div>
        <div className="connection-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>{connectionStatus}</span>
        </div>
        <button className="btn-danger" onClick={handleStopSharing}>
          Stop Sharing
        </button>
      </div>

      <div className="preview-container">
        <video
          ref={localVideoRef}
          className="preview-video"
          autoPlay
          muted
          playsInline
        />
        {!viewerJoined && (
          <div className="waiting-overlay">
            <p>Waiting for viewer to join...</p>
            <p className="room-id-display">Share this Room ID: {roomId}</p>
          </div>
        )}
      </div>
    </div>
  );
}
