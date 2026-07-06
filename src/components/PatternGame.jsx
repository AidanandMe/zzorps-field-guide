import React, { useState, useEffect } from 'react';
import Confetti from './Confetti';
import DialogueBox from './DialogueBox';
import './PatternGame.css';

// The game data: sequences and the missing correct answer
const patternChallanges = [
  { sequence: ['🍎', '🍌', '🍎', '🍌', '?'], options: ['🍇', '🍎', '🍌'], correct: '🍎' },
  { sequence: ['⭐', '⭐', '🚀', '⭐', '⭐', '?'], options: ['🚀', '⭐', '🌎'], correct: '🚀' },
  { sequence: ['🟦', '⭕', '🔺', '🟦', '⭕', '?'], options: ['🟦', '⭕', '🔺'], correct: '🔺' },
  { sequence: ['👽', '👽', '🐿️', '🐿️', '👽', '?'], options: ['🐿️', '👽', '👧'], correct: '👽' },
  { sequence: ['1️⃣', '2️⃣', '3️⃣', '1️⃣', '2️⃣', '?'], options: ['3️⃣', '1️⃣', '4️⃣'], correct: '3️⃣' },
];

const PatternGame = ({ isAudioEnabled }) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'correct', 'wrong', 'finished'
  const [pulsePattern, setPulsePattern] = useState(false);
  const [speaker, setSpeaker] = useState('Zzorp');
  const [dialogueText, setDialogueText] = useState('What comes next in the pattern?');
  const [dialogueKey, setDialogueKey] = useState(0); // Used to force re-render of DialogueBox

  // Pulse animation for the pattern sequence on load
  useEffect(() => {
    const timer1 = setTimeout(() => setPulsePattern(true), 0);
    const timer2 = setTimeout(() => setPulsePattern(false), 1000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [currentLevel]);

  const handleGuess = (guess) => {
    if (gameState !== 'playing') return;

    if (guess === patternChallanges[currentLevel].correct) {
      setGameState('correct');
      setScore(s => s + 100);
      
      setSpeaker('Ginger');
      // Mix up Ginger's happy responses
      const happyResponses = ["That's it! You found the pattern!", "Wow, great job!", "Perfect pattern spotting!"];
      setDialogueText(happyResponses[currentLevel % happyResponses.length]);
      setDialogueKey(prev => prev + 1);
      
      // Move to next level after delay
      setTimeout(() => {
        if (currentLevel < patternChallanges.length - 1) {
          setCurrentLevel(l => l + 1);
          setGameState('playing');
          setSpeaker('Zzorp');
          setDialogueText('What about this one? What comes next?');
          setDialogueKey(prev => prev + 1);
        } else {
          setGameState('finished');
          setSpeaker('Zzorp');
          setDialogueText('Amazing! Your brain spots patterns as fast as an AI!');
          setDialogueKey(prev => prev + 1);
        }
      }, 3000); // Wait longer so dialogue finishes
    } else {
      setGameState('wrong');
      setSpeaker('Ginger');
      setDialogueText('Oops, that doesn\'t look right. Try again!');
      setDialogueKey(prev => prev + 1);
      
      // Let them try again after showing error
      setTimeout(() => {
        setGameState('playing');
      }, 2500);
    }
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setScore(0);
    setGameState('playing');
    setSpeaker('Zzorp');
    setDialogueText('Let\'s play again! What comes next?');
    setDialogueKey(prev => prev + 1);
  };

  const currentChallenge = patternChallanges[currentLevel];

  return (
    <div className="pattern-game-container glass-panel" style={{ position: 'relative' }}>
      {(gameState === 'correct' || gameState === 'finished') && <Confetti />}
      
      <div className="game-header">
        <h2>Pattern Spotter! 🔍</h2>
        <div className="score-board">Score: {score}</div>
      </div>

      <div className="game-story-area">
        <img src={`/assets/${speaker.toLowerCase()}.png`} className={`inline-portrait ${speaker.toLowerCase()}-glow`} alt={speaker} />
        <DialogueBox 
          key={`game-${dialogueKey}`} // Force re-render/typing effect on new dialogue
          character={speaker} 
          text={dialogueText} 
          onNext={() => {}} // Empty function, let the timeout handle game flow
          isAudioEnabled={isAudioEnabled}
          hideNext={true}
        />
      </div>

      {gameState === 'finished' ? (
        <div className="game-finished">
          <h3>🎉 Amazing Job! 🎉</h3>
          <p>You have a super pattern-spotting brain just like Zzorp!</p>
          <img src="/assets/zzorp.png" alt="Happy Zzorp" className="winner-img" />
          <button className="primary-btn" onClick={restartGame}>Play Again</button>
        </div>
      ) : (
        <div className="game-board">
          
          <div className={`sequence-display ${pulsePattern ? 'pulse-seq' : ''}`}>
            {currentChallenge.sequence.map((item, index) => (
              <div 
                key={index} 
                className={`sequence-item ${item === '?' ? 'mystery-box' : ''}`}
              >
                {item}
              </div>
            ))}
          </div>

          <div className="options-container">
            {currentChallenge.options.map((option, index) => (
              <button 
                key={index} 
                className="option-btn"
                onClick={() => handleGuess(option)}
                disabled={gameState !== 'playing'}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="feedback-area">
            {gameState === 'correct' && <div className="feedback-anim correct-anim">⭐ Correct! ⭐</div>}
            {gameState === 'wrong' && <div className="feedback-anim wrong-anim">Try Again! 🤔</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternGame;
