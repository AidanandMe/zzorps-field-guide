import React, { useState, useRef, useEffect } from 'react';
import './StoryLab.css';
import { verifySafetyAndGetFollowUp, generateFieldGuideReport, generateComicMission } from '../services/observationAgent';

const StoryLab = ({ isAudioEnabled }) => {
  const [step, setStep] = useState(1); // 1, 'redirect', 2, 'draw', 'report'
  
  // Form States
  const [observation, setObservation] = useState('');
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  
  // Status States
  const [safetyRedirection, setSafetyRedirection] = useState(null); // { emergency: boolean, message: string }
  const [reportData, setReportData] = useState(null); // { spotted, theories, kindQuestion, note, badge }
  const [selectedTheory, setSelectedTheory] = useState(null); // Interactive choice for children
  const [comicData, setComicData] = useState(null); // Comic panels data
  const [quizChoice, setQuizChoice] = useState(null); // Interactive quiz choice
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizSuccess, setQuizSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [reportNumber, setReportNumber] = useState(0);

  // Canvas State & Refs
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingImg, setDrawingImg] = useState(null);

  useEffect(() => {
    // Generate a random report number on mount
    setReportNumber(Math.floor(Math.random() * 900) + 100);
  }, []);

  const speakText = (text) => {
    if (!isAudioEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Strip emojis so voice engine doesn't read emoji names
      let textToSpeak = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
      
      // Introduce micro-pauses by adding ellipsis or commas after sentences to avoid robotic streaming
      textToSpeak = textToSpeak
        .replace(/\. /g, '... ')
        .replace(/! /g, '!... ')
        .replace(/\? /g, '?... ');

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.pitch = 1.3; // Curious, alien, slightly higher pitch, not too fast
      utterance.rate = 0.95;
      
      // Select the best available voice fallback
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('David') || v.lang.startsWith('en-US')) || voices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  const sessionRef = useRef(0);

  // Phase 1 verification
  const handleVerifyObservation = async () => {
    if (!observation.trim()) return;

    // Reset downstream states for a clean new run
    sessionRef.current += 1;
    const activeSession = sessionRef.current;

    setFollowUpQuestion('');
    setFollowUpAnswer('');
    setSafetyRedirection(null);
    setReportData(null);
    setSelectedTheory(null);
    setComicData(null);
    setQuizChoice(null);
    setQuizChecked(false);
    setQuizSuccess(false);
    setDrawingImg(null);

    setLoading(true);
    setError(null);
    try {
      const result = await verifySafetyAndGetFollowUp(observation);
      if (activeSession !== sessionRef.current) return;

      if (!result.safe) {
        setSafetyRedirection({
          emergency: result.emergency || false,
          message: result.redirection
        });
        setStep('redirect');
        speakText(result.redirection);
      } else {
        setFollowUpQuestion(result.followUpQuestion);
        setStep(2);
        speakText(result.followUpQuestion);
      }
    } catch (err) {
      if (activeSession !== sessionRef.current) return;
      console.error(err);
      setError("Zzorp's communications transmitter glitched! Let's try again.");
    } finally {
      if (activeSession === sessionRef.current) {
        setLoading(false);
      }
    }
  };

  // Phase 2 generation
  const handleGenerateReport = async () => {
    // Save drawing if it exists
    if (canvasRef.current) {
      setDrawingImg(canvasRef.current.toDataURL());
    }

    const activeSession = sessionRef.current;
    setLoading(true);
    setError(null);
    try {
      const report = await generateFieldGuideReport(observation, followUpQuestion, followUpAnswer);
      if (activeSession !== sessionRef.current) return;

      setReportData(report);
      setStep('report');
      speakText("Generating field guide report! Look at the badge you earned!");
    } catch (err) {
      if (activeSession !== sessionRef.current) return;
      console.error(err);
      setError("Zzorp's report compiler encountered an error. Let's try compiling again!");
    } finally {
      if (activeSession === sessionRef.current) {
        setLoading(false);
      }
    }
  };

  const handleCreateComicMission = async () => {
    const activeSession = sessionRef.current;
    setLoading(true);
    setError(null);
    try {
      const comic = await generateComicMission(observation, followUpAnswer);
      if (activeSession !== sessionRef.current) return;

      setComicData(comic);
      setStep('comic-mission');
      speakText("Zzorp is compiling your comic mission! Let's spot the difference!");
    } catch (err) {
      if (activeSession !== sessionRef.current) return;
      console.error(err);
      setError("Zzorp's comic printer transmitter glitched. Let's try again!");
    } finally {
      if (activeSession === sessionRef.current) {
        setLoading(false);
      }
    }
  };

  // Canvas Drawing Logic
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e.nativeEvent || e);
    const context = canvasRef.current.getContext('2d');
    context.beginPath();
    context.moveTo(x, y);
    context.lineWidth = 4;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#000000';
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e.nativeEvent || e);
    const context = canvasRef.current.getContext('2d');
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Ensure canvas has white background on mount/resize when drawn
  useEffect(() => {
    if (step === 'draw') {
        clearCanvas();
    }
  }, [step]);

  // Reset entirely
  const restartLab = () => {
      sessionRef.current += 1;
      setStep(1);
      setObservation('');
      setFollowUpQuestion('');
      setFollowUpAnswer('');
      setSafetyRedirection(null);
      setReportData(null);
      setSelectedTheory(null);
      setComicData(null);
      setQuizChoice(null);
      setQuizChecked(false);
      setQuizSuccess(false);
      setDrawingImg(null);
      setError(null);
      setReportNumber(Math.floor(Math.random() * 900) + 100);
  };

  const downloadReportText = () => {
    if (!reportData) return;
    const theoriesText = reportData.theories.map((t, i) => `Theory #${i + 1}: ${t}`).join('\n');
    let reportText = `Zzorp Earthling Field Guide Report #${reportNumber}
--------------------------------------------------
What Zzorp Spotted:
${reportData.spotted}

Zzorp’s Alien Theories:
${theoriesText}

Kind Question to Ask:
${reportData.kindQuestion}

Zzorp's Playful Note:
${reportData.note}

Explorer Badge Earned:
${reportData.badge}
--------------------------------------------------`;

    if (comicData) {
      reportText += `\n\n=== ZZORP COMIC MISSION ===
[Panel 1: ${comicData.panel1Title}]
${comicData.panel1Text}

[Panel 2: ${comicData.panel2Title}]
${comicData.panel2Text}

[Panel 3: ${comicData.panel3Title}]
${comicData.panel3Text}

Reflection: ${comicData.reflectionQuestion}
--------------------------------------------------`;
    }

    reportText += `\nGenerated using Zzorp Observation Agent.`;

    const element = document.createElement("a");
    const file = new Blob([reportText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Zzorp_Report_${reportNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const imageToDataURL = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image to data URL:", error);
      return url;
    }
  };

  const downloadUnifiedDossierHTML = async () => {
    if (!reportData || !comicData) return;

    // Convert static assets to base64 Data URLs so they are completely self-contained offline
    const logoBase64 = await imageToDataURL('/assets/zzorp.png');
    const panel1Base64 = await imageToDataURL('/assets/comic_panel_1_observe.png');
    const panel2Base64 = await imageToDataURL(getPanel2Image());
    const panel3Base64 = await imageToDataURL('/assets/comic_panel_3_ask.png');
    
    const badge = getBadgeDetails(reportData.badge);
    const theoriesHTML = reportData.theories.map((t, i) => `
      <li class="theory-item ${selectedTheory === i ? 'selected-theory' : ''}">
        <strong>🚀 Theory #${i + 1}${selectedTheory === i ? ' (My Choice)' : ''}:</strong> ${t}
      </li>
    `).join('');

    const evidenceHTML = drawingImg ? `
      <div class="section">
        <h3>🎨 Evidence Sketch</h3>
        <div class="evidence-container">
          <img src="${drawingImg}" alt="Child Evidence Sketch" class="evidence-img" />
        </div>
      </div>
    ` : '';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Zzorp Earth Explorer Dossier #${reportNumber}</title>
  <style>
    body {
      background: #0f172a;
      color: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      margin: 0;
    }
    .dossier-card {
      max-width: 1000px;
      width: 100%;
      background: rgba(30, 41, 59, 0.9);
      border: 2px solid #334155;
      border-radius: 24px;
      padding: 2.5rem;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
      box-sizing: border-box;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      border-bottom: 2px dashed #334155;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    .header-logo {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid #22d3ee;
      background: rgba(34, 211, 238, 0.1);
    }
    .header-title h1 {
      margin: 0;
      color: #22d3ee;
      font-size: 2.25rem;
      text-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
    }
    .header-title p {
      margin: 5px 0 0 0;
      color: #94a3b8;
      font-size: 1.1rem;
    }
    .badge-card {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid #6366f1;
      border-radius: 16px;
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .badge-emoji {
      font-size: 2.5rem;
    }
    .badge-info h4 {
      margin: 0;
      color: #fbbf24;
      font-size: 1.25rem;
    }
    .badge-info p {
      margin: 3px 0 0 0;
      color: #e2e8f0;
      font-size: 0.95rem;
    }
    .section {
      margin-bottom: 2.5rem;
    }
    .section h3 {
      color: #f472b6;
      border-left: 4px solid #f472b6;
      padding-left: 10px;
      margin-top: 0;
      margin-bottom: 1.25rem;
      font-size: 1.4rem;
    }
    .interview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 768px) {
      .interview-grid {
        grid-template-columns: 1fr;
      }
    }
    .bubble-box {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 1.25rem;
    }
    .bubble-box strong {
      color: #22d3ee;
      display: block;
      margin-bottom: 6px;
    }
    .theories-list {
      list-style-type: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .theory-item {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      padding: 1rem;
      border-radius: 12px;
      line-height: 1.4;
    }
    .selected-theory {
      background: rgba(34, 211, 238, 0.1) !important;
      border-color: rgba(34, 211, 238, 0.4) !important;
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.15);
    }
    .evidence-container {
      display: flex;
      justify-content: center;
      background: #1e293b;
      padding: 1.5rem;
      border-radius: 16px;
      border: 1px solid #334155;
    }
    .evidence-img {
      max-width: 100%;
      max-height: 350px;
      border-radius: 12px;
      border: 2px solid #475569;
    }
    .comic-strip {
      display: flex;
      gap: 1.25rem;
      width: 100%;
    }
    @media (max-width: 768px) {
      .comic-strip {
        flex-direction: column;
        gap: 2rem;
      }
    }
    .panel {
      flex: 1;
      aspect-ratio: 4 / 5;
      position: relative;
      border: 4px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      background: #ffffff;
    }
    .panel-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .panel-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: #1e1b4b;
      border: 1px solid #f472b6;
      color: #f8fafc;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: bold;
      z-index: 2;
    }
    .bubble {
      position: absolute;
      left: 10px;
      right: 10px;
      background: #ffffff;
      border: 3px solid #1e293b;
      border-radius: 12px;
      padding: 0.5rem;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      color: #1e293b;
      text-align: center;
      z-index: 2;
    }
    .bubble-top {
      top: 45px;
    }
    .bubble-bottom {
      bottom: 10px;
    }
    .bubble h5 {
      font-size: 0.75rem;
      font-weight: bold;
      color: #6366f1;
      margin: 0 0 2px 0;
      text-transform: uppercase;
    }
    .bubble p {
      margin: 0;
      font-size: 0.75rem;
      font-weight: bold;
      line-height: 1.3;
      color: #334155;
    }
    .bubble::after {
      content: '';
      position: absolute;
      border-style: solid;
      display: block;
      width: 0;
      z-index: 3;
    }
    .bubble-top::after {
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      border-width: 10px 10px 0;
      border-color: #ffffff transparent;
    }
    .bubble-bottom::after {
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      border-width: 0 10px 10px;
      border-color: #ffffff transparent;
    }
    .footer-reflection {
      margin-top: 2rem;
      background: rgba(255,255,255,0.03);
      padding: 1.25rem 2rem;
      border-radius: 16px;
      border: 1px dashed rgba(255,255,255,0.15);
      text-align: center;
    }
    .footer-reflection strong {
      color: #22d3ee;
    }
    @media print {
      body {
        background: #ffffff;
        color: #0f172a;
        padding: 0;
      }
      .dossier-card {
        background: #ffffff;
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .bubble-box {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #0f172a;
      }
      .bubble-box strong {
        color: #0f766e;
      }
      .theory-item {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #334155;
      }
      .selected-theory {
        background: #ccfbf1 !important;
        border-color: #0d9488 !important;
      }
      .footer-reflection {
        border-color: #cbd5e1;
      }
      .panel {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="dossier-card">
    <div class="header">
      <img src="${logoBase64}" alt="Zzorp" class="header-logo" />
      <div class="header-title">
        <h1>Zzorp Earth Explorer Dossier #${reportNumber}</h1>
        <p>My Fun Space Log of Human Sightings</p>
      </div>
    </div>

    <div class="badge-card">
      <span class="badge-emoji">${badge.emoji}</span>
      <div class="badge-info">
        <h4>${reportData.badge} Earned!</h4>
        <p>${badge.desc}</p>
      </div>
    </div>

    <div class="section">
      <h3>📡 Sighting Log & Q&A Interview</h3>
      <div class="interview-grid">
        <div class="bubble-box">
          <strong>🔍 1. Human Observation Sighting</strong>
          <p style="margin: 0; line-height: 1.4;">"${observation}"</p>
        </div>
        <div class="bubble-box">
          <strong>💬 2. Zzorp's Follow-up Interview</strong>
          <p style="margin: 0; line-height: 1.4; color: #94a3b8; font-style: italic;">Q: ${followUpQuestion}</p>
          <p style="margin: 8px 0 0 0; line-height: 1.4;">A: "${followUpAnswer}"</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>💡 Field Guide Sighting Theories</h3>
      <p style="margin-top: 0; color: #cbd5e1;">Zzorp and the Earthling observer brainstormed the following interpretation theories:</p>
      <ul class="theories-list">
        ${theoriesHTML}
      </ul>
      <p style="margin-top: 1rem; font-style: italic; color: #94a3b8;">🛸 Zzorp's Alien Observation Note: "${reportData.note}"</p>
    </div>

    ${evidenceHTML}

    <div class="section">
      <h3>📖 Illustrated Comic Mission</h3>
      <div class="comic-strip">
        <div class="panel">
          <img src="${panel1Base64}" class="panel-img" />
          <div class="panel-badge">Panel 1 — What Zzorp Saw</div>
          <div class="bubble bubble-top">
            <h5>${comicData.panel1Title}</h5>
            <p>${truncateComicText(comicData.panel1Text, 100)}</p>
          </div>
        </div>

        <div class="panel">
          <img src="${panel2Base64}" class="panel-img" />
          <div class="panel-badge">Panel 2 — Zzorp's Theory</div>
          <div class="bubble bubble-bottom">
            <h5>${comicData.panel2Title}</h5>
            <p>${truncateComicText(comicData.panel2Text, 110)}</p>
          </div>
        </div>

        <div class="panel">
          <img src="${panel3Base64}" class="panel-img" />
          <div class="panel-badge">Panel 3 — The Kind Ask</div>
          <div class="bubble bubble-top">
            <h5>${comicData.panel3Title}</h5>
            <p>${truncateComicText(comicData.panel3Text, 100)}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-reflection">
      <p><strong>💡 Explorer Reflection Prompt:</strong></p>
      <p style="font-style: italic; margin: 5px 0 0 0; color: #cbd5e1;">"${comicData.reflectionQuestion}"</p>
    </div>
  </div>
</body>
</html>`;

    const element = document.createElement("a");
    const file = new Blob([htmlContent], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = `Zzorp_Explorer_Dossier_${reportNumber}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadSketch = () => {
    if(!drawingImg) return;
    const element = document.createElement("a");
    element.href = drawingImg;
    element.download = `Zzorp_Evidence_${reportNumber}.png`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Helper to render badge details
  const getBadgeDetails = (badgeName) => {
    switch (badgeName) {
      case "Curious Observer":
        return {
          emoji: "🔍",
          desc: "Earned for noticing unique and fascinating details in human habits!",
          class: "badge-curious"
        };
      case "Junior Anthropologist":
        return {
          emoji: "🪐",
          desc: "Earned for asking deep questions about why humans do things!",
          class: "badge-anthropologist"
        };
      case "Kind Question Maker":
        return {
          emoji: "💖",
          desc: "Earned for showing kindness and asking gentle, friendly questions!",
          class: "badge-kind"
        };
      default:
        return {
          emoji: "🛸",
          desc: "Earned for excellent work in Zzorp's scientific observation program!",
          class: "badge-default"
        };
    }
  };

  // Zzorp's randomized, playful reactions to theory selections
  const getTheoryFeedback = (idx) => {
    const reactions = [
      `Zzorp wiggles his antenna! "An excellent choice! Theory #${idx + 1} has a 99.9% probability of being correct!"`,
      `Zzorp's eye sparkles! "Oh, Theory #${idx + 1} is my favourite hypothesis too! Great choice, Explorer!"`,
      `Zzorp does a little alien hover dance! "Theory #${idx + 1} is highly scientific. The mothership will be pleased!"`,
      `Zzorp scribbles in his notepad! "I agree! Theory #${idx + 1} makes so much sense. You have a great alien brain!"`
    ];
    return reactions[(reportNumber + idx) % reactions.length];
  };



  // Dynamic Spot the Difference Quiz
  const getQuizData = () => {
    const quizType = reportNumber % 3;
    if (quizType === 0) {
      return {
        question: "Which panel is Zzorp's PLAYFUL GUESS (our alien theory)?",
        correctAnswer: 2,
        correctText: "🎉 Brilliant! Panel 2 is Zzorp's theory. We made a funny guess, but we don't know if it's a real fact yet!",
        incorrectText: "🛸 Oops! That panel isn't the theory. Remember, Panel 2 is Zzorp's alien theory about why they did it!"
      };
    } else if (quizType === 1) {
      return {
        question: "Which panel shows the REAL SIGHTING (what we actually saw with our eyes)?",
        correctAnswer: 1,
        correctText: "🎉 Factual float! Panel 1 is what Zzorp actually SAW. It contains the raw observation, free of any guesses!",
        incorrectText: "🛸 Oh no! That panel contains a theory or a question. Remember, Panel 1 is what we actually saw!"
      };
    } else {
      return {
        question: "Which panel represents the KIND QUESTION (our friendly ask to learn more)?",
        correctAnswer: 3,
        correctText: "🎉 Kind Explorer! Panel 3 is the friendly question. Asking questions with kindness helps us understand humans best!",
        incorrectText: "🛸 Almost! Remember, Panel 3 is Zzorp's friendly question to learn more from the human!"
      };
    }
  };

  // Keyword mapping for Panel 2 comic illustrations
  const getPanel2Image = () => {
    if (!observation) return '/assets/comic_panel_2_generic.png';
    const obsLower = observation.toLowerCase();
    
    if (obsLower.includes('shoes') || obsLower.includes('feet') || obsLower.includes('foot') || obsLower.includes('barefoot')) {
      return '/assets/comic_panel_2_barefoot.png';
    }
    if (obsLower.includes('phone') || obsLower.includes('screen') || obsLower.includes('rectangle') || obsLower.includes('mobile') || obsLower.includes('tablet')) {
      return '/assets/comic_panel_2_phone.png';
    }
    if (obsLower.includes('dog') || obsLower.includes('cat') || obsLower.includes('pet') || obsLower.includes('animal') || obsLower.includes('bird')) {
      return '/assets/comic_panel_2_pet.png';
    }
    if (obsLower.includes('eat') || obsLower.includes('food') || obsLower.includes('pizza') || obsLower.includes('drink') || obsLower.includes('water') || obsLower.includes('restaurant')) {
      return '/assets/comic_panel_2_eating.png';
    }
    return '/assets/comic_panel_2_generic.png';
  };

  // Defensive text truncation to fit inside speech bubbles
  const truncateComicText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    const cutIdx = text.lastIndexOf(' ', maxLength);
    if (cutIdx > maxLength - 30) {
      return text.substring(0, cutIdx) + '...';
    }
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="story-lab-container glass-panel">
      
      <div className="lab-header">
         <div className="header-title-container">
            <img src="/assets/zzorp.png" alt="Zzorp" className="zzorp-header-avatar" />
            <h2>Zzorp's Earthling Sighting Lab</h2>
         </div>
         <p>Write down what humans do and collect funny alien reports!</p>
      </div>

      {loading && (
        <div className="lab-form glass-panel dark-glass loading-container">
          <div className="loading-spinner"></div>
          <p className="instruction-text pulse-glow mt-4">Zzorp is talking to the mothership about your sighting...</p>
        </div>
      )}

      {error && !loading && (
        <div className="lab-form glass-panel dark-glass error-container">
          <div className="error-icon">⚠️</div>
          <p className="error-text">{error}</p>
          <button className="primary-btn mt-4" onClick={() => step === 'report' ? handleGenerateReport() : handleVerifyObservation()}>
            Try Again 🔄
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {step === 1 && (
            <div className="lab-form glass-panel dark-glass slide-in">
              <div className="form-group">
                <label>1️⃣ What did a human do today?</label>
                <p className="form-hint">What is a funny or interesting thing you saw a human do today? (e.g., walking a dog, waving hello, or reading a book)</p>
                <textarea 
                  name="observation" 
                  value={observation} 
                  onChange={(e) => setObservation(e.target.value)} 
                  placeholder="Today, I saw a human..."
                  autoFocus
                />
              </div>

              <div className="guidance-tip">
                <span className="tip-icon">🔒</span>
                <p className="tip-text">
                  <strong>Zzorp's Safety Rule:</strong> To keep everyone safe, please do not include real names, school names, addresses, or phone numbers.
                </p>
              </div>

              <div className="form-navigation mt-4">
                 <button 
                   className="primary-btn pulse-glow" 
                   onClick={handleVerifyObservation} 
                   style={{ marginLeft: 'auto' }}
                   disabled={!observation.trim()}
                 >
                    Next Question ➡️
                 </button>
              </div>
            </div>
          )}

          {step === 'redirect' && safetyRedirection && (
            <div className="lab-form glass-panel dark-glass slide-in safety-warning-container">
              {safetyRedirection.emergency ? (
                <div className="safety-card emergency-card">
                  <div className="safety-icon">🚨</div>
                  <h3>This sounds important!</h3>
                  <p className="safety-message">Please tell a trusted grown-up. They can help you feel safe and comfortable.</p>
                  <button className="primary-btn mt-4" onClick={restartLab}>
                    Try a Safe Observation 🚀
                  </button>
                </div>
              ) : (
                <div className="safety-card redirection-card">
                  <img src="/assets/zzorp.png" alt="Zzorp thinking" className="safety-avatar" />
                  <h3>Let's keep human data private!</h3>
                  <p className="safety-message">{safetyRedirection.message}</p>
                  <button className="primary-btn mt-4" onClick={() => setStep(1)}>
                    Rewrite Observation ✏️
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="lab-form glass-panel dark-glass slide-in">
              <div className="form-group">
                <label>2️⃣ Zzorp's Curious Question</label>
                <div className="zzorp-avatar-container">
                  <img src="/assets/zzorp.png" alt="Zzorp" className="zzorp-avatar-mini" />
                  <div className="zzorp-question-bubble">
                    <strong>Zzorp asks:</strong>
                    <p>"{followUpQuestion}"</p>
                  </div>
                </div>
                <textarea 
                  name="followUpAnswer" 
                  value={followUpAnswer} 
                  onChange={(e) => setFollowUpAnswer(e.target.value)} 
                  placeholder="I think that..."
                  autoFocus
                />
              </div>

              <div className="form-navigation mt-4">
                 <button className="secondary-btn" onClick={() => setStep(1)}>
                   🔙 Go Back
                 </button>
                 
                 <button 
                   className="primary-btn pulse-glow" 
                   onClick={() => setStep('draw')} 
                   style={{ marginLeft: 'auto' }}
                   disabled={!followUpAnswer.trim()}
                 >
                    Done? Let's Draw! 🎨
                 </button>
              </div>
            </div>
          )}

          {step === 'draw' && (
            <div className="lab-drawing glass-panel dark-glass slide-in">
              <h3>🎨 Draw What You Saw!</h3>
              <p className="instruction-text">Draw a picture of your human sighting to put in the report.</p>
              
              <div className="canvas-wrapper">
                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={400}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerOut={stopDrawing}
                    className="drawing-canvas"
                  />
              </div>
              
              <div className="canvas-controls">
                  <button className="secondary-btn" onClick={clearCanvas}>🗑️ Clear Canvas</button>
                  <button className="secondary-btn" onClick={() => setStep(2)}>🔙 Go Back</button>
              </div>

              <button className="primary-btn pulse-glow mt-4 w-full" onClick={handleGenerateReport}>
                🚀 Finished! Create My Alien Report
              </button>
            </div>
          )}

          {step === 'report' && reportData && (
            <div className="lab-report slide-in">
              <h3>📋 Mission Complete! Earthling Report #{reportNumber}</h3>
              
              <div className="report-content glass-panel dark-glass">
                 <div className="report-text">
                    <p><strong>📡 What Zzorp Spotted:</strong></p>
                    <p className="report-field-content">{reportData.spotted}</p>
                    
                    <p><strong>💡 Zzorp’s Alien Theories:</strong></p>
                    <p className="theory-prompt">👇 Which alien theory do you think is most likely? Click one to tell Zzorp!</p>
                    <div className="theories-container">
                       {reportData.theories.map((theory, idx) => (
                         <button 
                           key={idx}
                           className={`theory-card-btn ${selectedTheory === idx ? 'selected-theory' : ''}`}
                           onClick={() => {
                             setSelectedTheory(idx);
                             speakText(getTheoryFeedback(idx));
                           }}
                         >
                           <span className="theory-number">🚀 Theory #{idx + 1}</span>
                           <p className="theory-text">{theory}</p>
                         </button>
                       ))}
                    </div>

                    {selectedTheory !== null && (
                      <div className="theory-feedback slide-in">
                        <img src="/assets/zzorp.png" alt="Zzorp wiggling" className="theory-feedback-avatar" />
                        <div className="theory-feedback-bubble">
                          <p className="panel-content-text" style={{ fontStyle: 'italic', fontWeight: 600 }}>{getTheoryFeedback(selectedTheory)}</p>
                        </div>
                      </div>
                    )}
                    
                    <p style={{ marginTop: '1.5rem' }}><strong>❓ Kind Question to Ask:</strong></p>
                    <p className="report-field-content">{reportData.kindQuestion}</p>
                    
                    <p><strong>🛸 Playful Alien Note:</strong></p>
                    <p className="report-field-content italic-note">"{reportData.note}"</p>
                 </div>

                 {/* Visual Badge Display */}
                 <div className="badge-section mt-4">
                    <p><strong>🏅 Explorer Badge:</strong></p>
                    <div className={`badge-card ${getBadgeDetails(reportData.badge).class}`}>
                      <div className="badge-glow-effect"></div>
                      <span className="badge-emoji">{getBadgeDetails(reportData.badge).emoji}</span>
                      <div className="badge-info">
                        <h4>{reportData.badge}</h4>
                        <p>{getBadgeDetails(reportData.badge).desc}</p>
                      </div>
                    </div>
                 </div>
                 
                 {drawingImg && (
                     <div className="report-evidence mt-4">
                         <p><strong>🎨 Evidence Sketch:</strong></p>
                         <img src={drawingImg} alt="Observation Evidence" className="evidence-img" />
                     </div>
                 )}
               </div>
               
               <div className="report-actions" style={{display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap'}}>
                 <button className="secondary-btn" onClick={downloadReportText}>
                    📄 Save Report as Text
                 </button>
                 {drawingImg && (
                   <button className="secondary-btn" onClick={downloadSketch}>
                      🖼️ Save My Drawing
                   </button>
                 )}
                 <button className="primary-btn" onClick={handleCreateComicMission}>
                    📖 Make My Comic Strip!
                 </button>
                 <button className="secondary-btn" onClick={restartLab}>
                    Start a New Sighting 🪐
                 </button>
               </div>
            </div>
          )}

          {step === 'comic-mission' && comicData && (
            <div className="comic-mission-view slide-in">
              <h3>📖 Zzorp's Comic Mission</h3>
              <p className="instruction-text">Turn your human observation into a 3-panel alien comic!</p>
              
              <div className="comic-strip-container">
                <div className="comic-panel-illustration-card">
                  <img src="/assets/comic_panel_1_observe.png" alt="Observe illustration" className="comic-illustration-bg" />
                  <div className="panel-badge">Panel 1 — What Zzorp Saw</div>
                  <div className="comic-speech-bubble bubble-top">
                    <h5>{comicData.panel1Title}</h5>
                    <p>{truncateComicText(comicData.panel1Text, 100)}</p>
                  </div>
                </div>
                
                <div className="comic-panel-illustration-card">
                  <img src={getPanel2Image()} alt="Theory illustration" className="comic-illustration-bg" />
                  <div className="panel-badge">Panel 2 — Zzorp's Alien Theory</div>
                  <div className="comic-speech-bubble bubble-bottom">
                    <h5>{comicData.panel2Title}</h5>
                    <p>{truncateComicText(comicData.panel2Text, 110)}</p>
                  </div>
                </div>
                
                <div className="comic-panel-illustration-card">
                  <img src="/assets/comic_panel_3_ask.png" alt="Ask illustration" className="comic-illustration-bg" />
                  <div className="panel-badge">Panel 3 — The Kind Question</div>
                  <div className="comic-speech-bubble bubble-top">
                    <h5>{comicData.panel3Title}</h5>
                    <p>{truncateComicText(comicData.panel3Text, 100)}</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Spot the Difference Quiz */}
              <div className="matching-game-card glass-panel dark-glass mt-4">
                <h4>🔍 Can you spot the difference?</h4>
                <p className="game-intro" style={{ fontWeight: 'bold', color: 'var(--star-yellow)', fontSize: '1.05rem', marginBottom: '1.25rem' }}>
                  {getQuizData().question}
                </p>
                
                <div className="quiz-buttons-container" style={{ display: 'flex', gap: '15px', justifyContent: 'center', margin: '1rem 0' }}>
                  {[1, 2, 3].map((panelNum) => (
                    <button
                      key={panelNum}
                      className={`primary-btn quiz-btn ${quizChoice === panelNum ? 'quiz-btn-selected' : ''}`}
                      onClick={() => {
                        setQuizChoice(panelNum);
                        setQuizChecked(true);
                        const correct = panelNum === getQuizData().correctAnswer;
                        setQuizSuccess(correct);
                        if (correct) {
                          speakText(getQuizData().correctText);
                        } else {
                          speakText(getQuizData().incorrectText);
                        }
                      }}
                    >
                      🚀 Panel {panelNum}
                    </button>
                  ))}
                </div>

                {quizChecked && (
                  <div className={`game-feedback-card mt-4 ${quizSuccess ? 'success-feedback' : 'fail-feedback'}`}>
                    {quizSuccess ? (
                      <p>{getQuizData().correctText}</p>
                    ) : (
                      <p>{getQuizData().incorrectText}</p>
                    )}
                  </div>
                )}

                <div className="reflection-prompt mt-4">
                  <p><strong>💡 Fun Alien Question for You:</strong></p>
                  <p className="italic-note">"{comicData.reflectionQuestion}"</p>
                </div>
              </div>

              <div className="report-actions mt-4" style={{display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap'}}>
                <button className="secondary-btn" onClick={() => setStep('report')}>
                  🔙 Go Back to Report
                </button>
                <button className="secondary-btn" onClick={downloadUnifiedDossierHTML}>
                  📥 Download My Alien Journal (.html)
                </button>
                <button className="primary-btn" onClick={restartLab}>
                  Start a New Sighting 🪐
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default StoryLab;
