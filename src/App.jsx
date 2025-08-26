import React, { useState, useEffect } from 'react';
import Room from './Room';
import VideoPlayer from './VideoPlayer';
import StreamingServices from './components/StreamingServices';
import '../components/quick-actions.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="app">
      <header>
        <h1 className="app-logo">🎬 WatchTogether</h1>
      </header>
      
      {!isAuthenticated ? (
        <div id="auth-screen" className="screen">
          <div className="auth-container">
            <div className="auth-header">
              <p className="app-tagline">Premium synchronized movie watching experience</p>
            </div>
            {/* Auth components will go here */}
          </div>
        </div>
      ) : !currentRoom ? (
        <StreamingServices onRoomCreated={setCurrentRoom} />
      ) : (
        <Room room={currentRoom}>
          <VideoPlayer />
        </Room>
      )}
    </div>
  );
}

export default App;
