import React, { useState } from 'react';

interface HomeScreenProps {
  onShareScreen: () => void;
  onJoinSession: (roomId: string) => void;
}

export default function HomeScreen({ onShareScreen, onJoinSession }: HomeScreenProps) {
  const [roomId, setRoomId] = useState('');

  const handleJoin = () => {
    if (roomId.trim()) {
      onJoinSession(roomId.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="home-screen">
      <div className="home-container">
        <h1 className="home-title">Remote Support</h1>
        <p className="home-subtitle">Connect and share your screen</p>

        <div className="home-actions">
          <div className="action-section">
            <h2>Share Your Screen</h2>
            <p>Start a new support session</p>
            <button className="btn-primary" onClick={onShareScreen}>
              Share Screen
            </button>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="action-section">
            <h2>Join Session</h2>
            <p>Connect to an existing session</p>
            <div className="join-form">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyPress={handleKeyPress}
                className="room-input"
              />
              <button
                className="btn-primary"
                onClick={handleJoin}
                disabled={!roomId.trim()}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
