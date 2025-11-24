import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import HomeScreen from './components/HomeScreen';
import UserView from './components/UserView';
import SupportView from './components/SupportView';
import './styles.css';

type AppView = 'home' | 'user' | 'support';

interface AppState {
  view: AppView;
  roomId?: string;
  isHost?: boolean;
}

function App() {
  const [state, setState] = useState<AppState>({ view: 'home' });

  const handleShareScreen = () => {
    setState({ view: 'user', isHost: true });
  };

  const handleJoinSession = (roomId: string) => {
    setState({ view: 'support', roomId, isHost: false });
  };

  const handleBackToHome = () => {
    setState({ view: 'home' });
  };

  return (
    <div className="app">
      {state.view === 'home' && (
        <HomeScreen
          onShareScreen={handleShareScreen}
          onJoinSession={handleJoinSession}
        />
      )}
      {state.view === 'user' && (
        <UserView
          onBack={handleBackToHome}
        />
      )}
      {state.view === 'support' && (
        <SupportView
          roomId={state.roomId!}
          onBack={handleBackToHome}
        />
      )}
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
