import React from 'react';
import './Hero.css';

const Hero = ({ onStart }) => {
  return (
    <div className="hero-container">
      <div className="hero-content glass-panel">
        <div className="hero-text">
          <h1 className="hero-title">Zzorp's Field Guide to Humans</h1>
          <p className="hero-subtitle">The Multi-Media Roadmap</p>
          <p className="hero-description">
            Join Zzorp, Ginger, and Squirf on an intergalactic mission to understand Earth! 
            Dive into our interactive AI Literacy guide to see how machines learn.
          </p>
          <button className="primary-btn pulse-glow" onClick={onStart}>
            Start the Adventure 🚀
          </button>
        </div>
        <div className="hero-characters">
          <img src="/assets/zzorp.png" alt="Zzorp" className="hero-img z-float" />
          <img src="/assets/ginger.png" alt="Ginger" className="hero-img g-float" />
          <img src="/assets/squirf.png" alt="Squirf" className="hero-img s-float" />
        </div>
      </div>
    </div>
  );
};

export default Hero;
