import { useState } from 'react';
import './index.css';

const LANGUAGES = {
  'en-US': { display: 'English', translate: 'en', speech: 'en-US' },
  'kn-IN': { display: 'Kannada', translate: 'kn', speech: 'kn-IN' },
  'hi-IN': { display: 'Hindi', translate: 'hi', speech: 'hi-IN' },
  'te-IN': { display: 'Telugu', translate: 'te', speech: 'te-IN' },
  'ta-IN': { display: 'Tamil', translate: 'ta', speech: 'ta-IN' },
  'es-ES': { display: 'Spanish', translate: 'es', speech: 'es-ES' },
  'fr-FR': { display: 'French', translate: 'fr', speech: 'fr-FR' },
  'de-DE': { display: 'German', translate: 'de', speech: 'de-DE' }
};

const FLOATING_CHARS = ['A', 'ಅ', 'अ', 'a', 'Ω', '文', 'あ', 'b', 'Z', 'ಕ', 'क', 'e', 'm', 'i', 'T', 'G', 'L', 'S', 'P', 'R', 'K'];

function BackgroundLetters() {
  // Use a predictable pseudo-random set to avoid hydration mismatches 
  // or simply rely on Math.random given there's no SSR.
  const letters = Array.from({ length: 35 }).map((_, i) => ({
    id: i,
    char: FLOATING_CHARS[Math.floor(Math.random() * FLOATING_CHARS.length)],
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: Math.random() * 25 + 15,
    delay: Math.random() * -20, // Negative delay to start mid-animation
    fontSize: Math.random() * 2.5 + 1.5,
    opacity: Math.random() * 0.15 + 0.05
  }));

  return (
    <div className="background-letters">
      {letters.map((l) => (
        <div 
          key={l.id} 
          className="floating-letter" 
          style={{
            left: `${l.left}vw`,
            top: `${l.top}vh`,
            animationDuration: `${l.duration}s`,
            animationDelay: `${l.delay}s`,
            fontSize: `${l.fontSize}rem`,
            opacity: l.opacity
          }}
        >
          {l.char}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [sourceCode, setSourceCode] = useState('kn-IN');
  const [targetCode, setTargetCode] = useState('en-US');
  
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const handleSwap = () => {
    setSourceCode(targetCode);
    setTargetCode(sourceCode);
    setSourceText(targetText);
    setTargetText(sourceText);
  };

  const handleListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGES[sourceCode].speech;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSourceText((prev) => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleSpeak = (text, code) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGES[code].speech;
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    
    setLoading(true);
    setError(null);
    setTargetText('');
    
    try {
      const response = await fetch('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          sourceLang: LANGUAGES[sourceCode].translate,
          targetLang: LANGUAGES[targetCode].translate
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }
      
      setTargetText(data.translatedText);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BackgroundLetters />
      <div className="translator-app">
        <h1 className="app-title">Global Language Translator</h1>
      
      <div className="glass-panel">
        <div className="translation-container">
          
          {/* SOURCE INPUT BOX */}
          <div className="input-box">
            <div className="box-header">
              <select 
                className="lang-select" 
                value={sourceCode} 
                onChange={(e) => setSourceCode(e.target.value)}
              >
                {Object.entries(LANGUAGES).map(([code, lang]) => (
                  <option key={`src-${code}`} value={code}>{lang.display}</option>
                ))}
              </select>
              <div className="header-actions">
                <button 
                  className={`icon-btn ${isListening ? 'listening' : ''}`} 
                  onClick={handleListen} 
                  title="Speak"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
                </button>
              </div>
            </div>
            
            <div className="textarea-wrapper">
              <textarea
                className="custom-textarea"
                placeholder="Type your text here..."
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              />
              <div className="textarea-footer">
                <span className="char-count">{sourceText.length} characters</span>
                <button className="icon-btn small-btn" onClick={() => handleCopy(sourceText)} title="Copy Text">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
            </div>
          </div>

          {/* SWAP BUTTON */}
          <div className="swap-container">
            <button className="swap-btn" onClick={handleSwap} title="Swap Languages">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"></path><path d="M15 10l-4-4-4 4"></path><path d="M17 14v-12"></path><path d="M9 14l4 4 4-4"></path></svg>
            </button>
          </div>

          {/* TARGET OUTPUT BOX */}
          <div className="input-box">
            <div className="box-header">
              <select 
                className="lang-select" 
                value={targetCode} 
                onChange={(e) => setTargetCode(e.target.value)}
              >
                {Object.entries(LANGUAGES).map(([code, lang]) => (
                  <option key={`tgt-${code}`} value={code}>{lang.display}</option>
                ))}
              </select>
              <div className="header-actions">
                {targetText && (
                  <button className="icon-btn" onClick={() => handleSpeak(targetText, targetCode)} title="Read Aloud">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="textarea-wrapper">
              <textarea
                className="custom-textarea readonly-textarea"
                placeholder="Translation will appear here..."
                value={targetText}
                readOnly
              />
              <div className="textarea-footer">
                <span className="char-count">{targetText.length} characters</span>
                <button className="icon-btn small-btn" onClick={() => handleCopy(targetText)} title="Copy Text">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
            </div>
          </div>

        </div>
        
        <div className="actions-row">
          <button 
            className="btn-translate" 
            onClick={handleTranslate}
            disabled={loading || !sourceText.trim() || sourceCode === targetCode}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Translating...
              </>
            ) : (
              'Translate Now'
            )}
          </button>
        </div>
        
        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
    </>
  );
}

export default App;
