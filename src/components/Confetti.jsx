import React, { useState } from 'react';
import './Confetti.css';

const Confetti = () => {
    const [particles] = useState(() => 
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      animationDelay: Math.random() * 0.5 + 's',
      color: ['#fef08a', '#22d3ee', '#f472b6', '#ffffff'][Math.floor(Math.random() * 4)],
      shape: Math.random() > 0.5 ? 'circle' : 'square',
    }))
  );

  return (
    <div className="confetti-container">
      {particles.map(p => (
        <div
          key={p.id}
          className={`confetti-particle ${p.shape}`}
          style={{
            left: p.left,
            animationDelay: p.animationDelay,
            backgroundColor: p.color
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
