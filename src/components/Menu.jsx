import React from 'react';
import './Menu.css';

const Menu = ({ currentView, onViewChange, isAudioEnabled, setIsAudioEnabled }) => {
  return (
    <nav className="main-menu glass-panel">
      <div className="logo cursor-pointer" onClick={() => onViewChange('home')}>
        🌍 Zzorp's Guide
      </div>
      <div className="menu-links">
        <button 
          className={`menu-btn ${currentView === 'home' ? 'active-link' : ''}`}
          onClick={() => onViewChange('home')}
        >
          Home
        </button>
        <button 
          className={`menu-btn ${currentView === 'story' ? 'active-link' : ''}`}
          onClick={() => onViewChange('story')}
        >
          AI Literacy
        </button>
        <button 
          className={`menu-btn ${currentView === 'game' ? 'active-link' : ''}`}
          onClick={() => onViewChange('game')}
        >
          Games 🎮
        </button>
        <button 
          className={`menu-btn ${currentView === 'zzorp-story' ? 'active-link' : ''}`}
          onClick={() => onViewChange('zzorp-story')}
        >
          Zzorp's Story 📖
        </button>
        <button 
          className={`menu-btn ${currentView === 'story-lab' ? 'active-link' : ''} menu-btn-with-icon`}
          onClick={() => onViewChange('story-lab')}
        >
          Observation Lab <img src="/assets/zzorp.png" alt="Zzorp" className="menu-zzorp-icon" />
        </button>
        <button 
          className="audio-toggle-btn" 
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          title="Toggle Music & Voices"
          style={{ marginLeft: '1rem', padding: '0.4rem 0.8rem' }}
        >
          {isAudioEnabled ? '🔊 Sound' : '🔇 Muted'}
        </button>
      </div>
    </nav>
  );
};

export default Menu;
