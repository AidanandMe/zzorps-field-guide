import React from 'react';
import './CharacterStage.css';

const CharacterStage = ({ activeCharacter }) => {
  return (
    <div className="character-stage">
      <div className={`character-wrapper ${activeCharacter === 'Ginger' ? 'active' : 'inactive'}`}>
        <img src="/assets/ginger.png" alt="Ginger" className="character-img" />
        <div className="character-name glass-panel">Ginger</div>
      </div>
      
      <div className={`character-wrapper center-stage ${activeCharacter === 'Zzorp' ? 'active' : 'inactive'}`}>
        <img src="/assets/zzorp.png" alt="Zzorp" className="character-img" />
        <div className="character-name glass-panel">Zzorp</div>
      </div>
      
      <div className={`character-wrapper ${activeCharacter === 'Squirf' ? 'active' : 'inactive'}`}>
        <img src="/assets/squirf.png" alt="Squirf" className="character-img" />
        <div className="character-name glass-panel">Squirf</div>
      </div>

      <div className={`character-wrapper ${activeCharacter === 'Unit 7' ? 'active' : 'inactive'}`}>
        <img src="/assets/Unit 7.png" alt="Unit 7" className="character-img" />
        <div className="character-name glass-panel">Unit 7</div>
      </div>

      <div className={`character-wrapper ${activeCharacter === 'Commander Glorp' ? 'active' : 'inactive'}`}>
        <img src="/assets/Commander Glorp.png" alt="Commander Glorp" className="character-img" />
        <div className="character-name glass-panel">Glorp</div>
      </div>
    </div>
  );
};

export default CharacterStage;
