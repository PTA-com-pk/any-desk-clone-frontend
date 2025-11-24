// Error handling utilities

export class RemoteSupportError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'RemoteSupportError';
  }
}

export function handleWebRTCError(error: any): string {
  if (error instanceof Error) {
    // Common WebRTC errors
    if (error.message.includes('getDisplayMedia')) {
      return 'Screen sharing permission denied. Please grant permission to share your screen.';
    }
    if (error.message.includes('NotAllowedError')) {
      return 'Permission denied. Please check your browser permissions.';
    }
    if (error.message.includes('NotFoundError')) {
      return 'No display found. Please connect a display and try again.';
    }
    if (error.message.includes('NotReadableError')) {
      return 'Display is not readable. Another application may be using it.';
    }
    if (error.message.includes('AbortError')) {
      return 'Operation was cancelled. Please try again.';
    }
    if (error.message.includes('NetworkError')) {
      return 'Network error. Please check your internet connection.';
    }
    if (error.message.includes('OverconstrainedError')) {
      return 'Screen capture constraints could not be satisfied.';
    }
    return error.message;
  }
  return String(error);
}

export function handleSignalingError(error: any): string {
  if (error instanceof Error) {
    if (error.message.includes('ECONNREFUSED')) {
      return 'Cannot connect to signaling server. Please check if the server is running.';
    }
    if (error.message.includes('timeout')) {
      return 'Connection timeout. Please check your network connection.';
    }
    if (error.message.includes('404')) {
      return 'Signaling server not found. Please check the server URL.';
    }
    return error.message;
  }
  return String(error);
}

export function handlePeerConnectionError(state: string): string {
  switch (state) {
    case 'failed':
      return 'Connection failed. Please check your network and firewall settings.';
    case 'disconnected':
      return 'Connection lost. Attempting to reconnect...';
    case 'closed':
      return 'Connection closed.';
    default:
      return `Connection state: ${state}`;
  }
}

export function logError(context: string, error: any): void {
  console.error(`[${context}]`, error);
  
  // In production, you might want to send errors to a logging service
  // Example: sendErrorToLoggingService(context, error);
}
