import React, { useState, useEffect, useRef } from 'react';
import './DialogueBox.css';

const DialogueBox = ({ character, text, onNext, isAudioEnabled, hideNext }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const playOnce = useRef(false);

  // Character voice profiles optimized for pitch, speed, and volume for a child-friendly feel
  const characterVoices = {
    'Zzorp': { pitch: 1.3, rate: 0.95, volume: 1.0 },   // Curious, alien, slightly higher pitch, not too fast
    'Ginger': { pitch: 1.0, rate: 0.85, volume: 1.0 },  // Warm, friendly, reassuring, slower and clear
    'Squirf': { pitch: 1.5, rate: 1.15, volume: 0.95 }   // Energetic, funny, slightly quicker
  };

  const getCharacterVoice = (charName, voices) => {
    const nameLower = (charName || '').toLowerCase();
    
    // Zzorp: default/male/neutral English voices with a slightly high pitch
    if (nameLower === 'zzorp') {
      return voices.find(v => v.name.includes('Google US English') || v.name.includes('David') || v.lang.startsWith('en-US')) || voices[0];
    }
    // Ginger: female voices (Hazel, Zira, Samantha, Google UK English Female)
    if (nameLower === 'ginger') {
      return voices.find(v => 
        v.name.includes('Hazel') || 
        v.name.includes('Zira') || 
        v.name.includes('Samantha') || 
        v.name.includes('Google UK English Female') ||
        v.name.includes('Female')
      ) || voices[0];
    }
    // Squirf: lighter/faster English voices (Google UK English Male, Mark, Hazel)
    if (nameLower === 'squirf') {
      return voices.find(v => 
        v.name.includes('Google UK English Male') || 
        v.name.includes('Hazel') || 
        v.name.includes('Mark') || 
        v.lang.startsWith('en-GB')
      ) || voices[0];
    }
    return voices.find(v => v.lang.startsWith('en-')) || voices[0];
  };

  const speakText = () => {
    if (!isAudioEnabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Strip emojis/icons so the voice doesn't read them out loud
    let textToSpeak = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
    
    // Introduce micro-pauses by adding ellipsis or commas after sentences to avoid robotic streaming
    textToSpeak = textToSpeak
      .replace(/\. /g, '... ')
      .replace(/! /g, '!... ')
      .replace(/\? /g, '?... ');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const profile = characterVoices[character] || { pitch: 1, rate: 1, volume: 1 };
    
    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;
    utterance.volume = profile.volume;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = getCharacterVoice(character, voices);
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  };


  // Typewriter effect
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    playOnce.current = false;
    let i = 0;
    
    // Start speaking as typing begins
    if (!playOnce.current) {
      speakText();
      playOnce.current = true;
    }

    const intervalId = setInterval(() => {
      if (i >= text.length) {
        clearInterval(intervalId);
        setIsTyping(false);
        return;
      }
      
      const nextChar = text.charAt(i);
      setDisplayedText(prev => prev + nextChar);
      i++;
    }, 45); // Slightly slower typing to match speech better

    return () => {
      clearInterval(intervalId);
      window.speechSynthesis.cancel(); // Stop speaking if unmounted
    };
  }, [text, isAudioEnabled]); // Re-run if text changes

  // Stop audio and skip text
  const handleNextClick = () => {
    if (isTyping) {
      // If typing, click to skip to end
      setDisplayedText(text);
      setIsTyping(false);
      window.speechSynthesis.cancel();
    } else {
      // If done typing, advance to next dialogue
      onNext();
    }
  };

  return (
    <div className="dialogue-container">
      <div className="dialogue-box glass-panel" onClick={handleNextClick}>
        <div className="dialogue-speaker">{character} says...</div>
        <p className="dialogue-text">{displayedText}</p>
        
        {!isTyping && !hideNext && (
          <div className="next-indicator blink">
            Tap to continue ▶
          </div>
        )}
      </div>
    </div>
  );
};

export default DialogueBox;
