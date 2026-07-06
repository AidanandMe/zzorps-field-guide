import { useState, useEffect, useRef } from 'react'
import CharacterStage from './components/CharacterStage'
import DialogueBox from './components/DialogueBox'
import Hero from './components/Hero'
import Menu from './components/Menu'
import PatternGame from './components/PatternGame'
import StoryLab from './components/StoryLab'
import { storyScript } from './storyData'
import { zzorpStory } from './narrativeData'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'story'
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentNarrativeIndex, setCurrentNarrativeIndex] = useState(0);
  const [userEnding, setUserEnding] = useState('');
  const [isEndingSaved, setIsEndingSaved] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false); // Start muted by default to satisfy browser auto-play policies
  const audioRef = useRef(null);

  const handleNextLine = () => {
    if (currentLineIndex < storyScript.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
    }
  };

  const handlePrevLine = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentLineIndex(0);
  };

  const handleNextNarrativeLine = () => {
    if (currentNarrativeIndex < zzorpStory.length - 1) {
      setCurrentNarrativeIndex(prev => prev + 1);
    }
  };

  const handlePrevNarrativeLine = () => {
    if (currentNarrativeIndex > 0) {
      setCurrentNarrativeIndex(prev => prev - 1);
    }
  };

  const handleRestartNarrative = () => {
    setCurrentNarrativeIndex(0);
    setUserEnding('');
    setIsEndingSaved(false);
  };

  const downloadEnding = () => {
    const element = document.createElement("a");
    const file = new Blob([userEnding], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "My_Zzorp_Ending.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Initialize and handle background music
  useEffect(() => {
    if (!audioRef.current) {
      console.log('Initializing audio...');
      audioRef.current = new Audio('/assets/bg-music.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.05; // Lowered further so dialogue is clearly audible
      
      // Add event listeners for debugging
      audioRef.current.addEventListener('play', () => console.log('Audio emitted play event'));
      audioRef.current.addEventListener('pause', () => console.log('Audio emitted pause event'));
      audioRef.current.addEventListener('error', (e) => console.log('Audio error:', e));
    }

    if (isAudioEnabled) {
      console.log('Attempting to play audio...');
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Audio is playing successfully');
        }).catch(e => {
          console.error('Audio play prevented by browser or other error:', e);
        });
      }
    } else {
      console.log('Pausing audio...');
      audioRef.current.pause();
    }

    // Removing cleanup pause to prevent React Strict Mode bug
    // React 18 fires setup -> cleanup -> setup on mount.
    // We only want to pause when the component unmounts for real, 
    // but App never unmounts, so we just handle it via the state changes above.
  }, [isAudioEnabled]);

  const currentLine = storyScript[currentLineIndex];
  const isFinished = currentLineIndex === storyScript.length - 1;

  return (
    <>
      <div className="stars"></div>
      
      <div className="app-container">
        <Menu 
          currentView={currentView} 
          onViewChange={setCurrentView} 
          isAudioEnabled={isAudioEnabled}
          setIsAudioEnabled={setIsAudioEnabled}
        />

        {currentView === 'home' && (
          <Hero onStart={() => Object.assign(setCurrentView('story'), setCurrentLineIndex(0))} />
        )}
        
        {currentView === 'game' && <PatternGame isAudioEnabled={isAudioEnabled} />}

        {currentView === 'story-lab' && <StoryLab isAudioEnabled={isAudioEnabled} />}

        {currentView === 'story' && (
          <>
            <header className="app-header glass-panel">
              <h1>AI Literacy Guide</h1>
              <div className="header-controls">
                <button className="nav-btn" onClick={handlePrevLine} disabled={currentLineIndex === 0}>◀ Back</button>
                <div className="progress-pill">
                  {currentLineIndex + 1} / {storyScript.length}
                </div>
                <button className="nav-btn" onClick={handleNextLine} disabled={currentLineIndex === storyScript.length - 1}>Next ▶</button>
              </div>
            </header>

            <main className="story-area">
              <CharacterStage activeCharacter={currentLine.character} />
              
              <DialogueBox 
                key={currentLineIndex} // Force re-render/re-mount to restart typing effect
                character={currentLine.character} 
                text={currentLine.text} 
                onNext={handleNextLine}
                isAudioEnabled={isAudioEnabled}
              />
              
              {isFinished && (
                <button className="restart-btn" onClick={handleRestart}>
                  Read Again! 🚀
                </button>
              )}
            </main>
          </>
        )}

        {currentView === 'zzorp-story' && (
          <>
            <header className="app-header glass-panel">
              <h1>Zzorp's Origin Story</h1>
              <div className="header-controls">
                <button className="nav-btn" onClick={handlePrevNarrativeLine} disabled={currentNarrativeIndex === 0}>◀ Back</button>
                <div className="progress-pill">
                  {currentNarrativeIndex + 1} / {zzorpStory.length}
                </div>
                <button className="nav-btn" onClick={handleNextNarrativeLine} disabled={currentNarrativeIndex === zzorpStory.length - 1}>Next ▶</button>
              </div>
            </header>

            <main className="story-area">
              {currentNarrativeIndex < zzorpStory.length - 1 && zzorpStory[currentNarrativeIndex].image && (
                <div className="story-scene-image">
                  <img src={zzorpStory[currentNarrativeIndex].image} alt="Story visual" />
                </div>
              )}

              {currentNarrativeIndex === zzorpStory.length - 1 && (
                <div className="user-ending-space glass-panel fade-in">
                  {isEndingSaved ? (
                     <div className="saved-ending fade-in">
                       <h3>Your Story Ending:</h3>
                       <p>"{userEnding}"</p>
                       <div className="ending-actions">
                         <button className="action-btn edit-action-btn" onClick={() => setIsEndingSaved(false)}>Edit ✏️</button>
                         <button className="action-btn save-action-btn" onClick={downloadEnding}>Download 📄</button>
                         <button className="action-btn restart-action-btn" onClick={handleRestartNarrative}>Read Again 🚀</button>
                       </div>
                     </div>
                  ) : (
                     <div className="ending-input-area fade-in">
                       <h3>Write Your Own Ending!</h3>
                       <p>What happens next? Does Zzorp stay on Earth forever?</p>
                       <textarea 
                           className="ending-textarea"
                           value={userEnding}
                           onChange={(e) => setUserEnding(e.target.value)}
                           placeholder="It all started when..."
                           rows={2}
                       />
                       <br />
                       <button 
                           className="action-btn save-action-btn" 
                           onClick={() => setIsEndingSaved(true)}
                           disabled={userEnding.trim() === ''}
                       >
                           Save My Ending
                       </button>
                     </div>
                  )}
                </div>
              )}
              <CharacterStage activeCharacter={zzorpStory[currentNarrativeIndex].character} />
              
              <DialogueBox 
                key={`narrative-${currentNarrativeIndex}`} // Force re-render/re-mount to restart typing effect
                character={zzorpStory[currentNarrativeIndex].character} 
                text={zzorpStory[currentNarrativeIndex].text} 
                onNext={handleNextNarrativeLine}
                isAudioEnabled={isAudioEnabled}
              />
            </main>
          </>
        )}
      </div>
    </>
  )
}

export default App
