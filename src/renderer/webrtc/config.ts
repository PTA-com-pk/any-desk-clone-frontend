// WebRTC configuration
// TURN server configuration will be loaded from environment or config file

export interface TurnConfig {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface WebRTCConfig {
  iceServers: (RTCIceServer | TurnConfig)[];
}

const defaultStunServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// Load TURN server config from environment or use defaults
export function getWebRTCConfig(): WebRTCConfig {
  const turnServerUrl = import.meta.env.VITE_TURN_SERVER_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnPassword = import.meta.env.VITE_TURN_PASSWORD;

  const iceServers: RTCIceServer[] = [...defaultStunServers];

  if (turnServerUrl && turnUsername && turnPassword) {
    iceServers.push({
      urls: turnServerUrl,
      username: turnUsername,
      credential: turnPassword,
    });
  }

  return { iceServers };
}

export function getSignalingServerUrl(): string {
  return import.meta.env.VITE_SIGNALING_SERVER_URL || 'http://localhost:3000';
}
