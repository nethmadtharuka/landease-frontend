import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Mic, MicOff, Volume2, VolumeX,
  ArrowRight, Globe, Loader,
  RefreshCw, Copy, CheckCheck
} from 'lucide-react';
import api from '../../api/axios';

const LANGUAGES = [
  { code: 'en', label: 'English', voice: 'en-US' },
  { code: 'si', label: 'Sinhala', voice: 'si-LK' },
  { code: 'ta', label: 'Tamil', voice: 'ta-IN' },
  { code: 'hi', label: 'Hindi', voice: 'hi-IN' },
  { code: 'zh', label: 'Chinese', voice: 'zh-CN' },
  { code: 'ar', label: 'Arabic', voice: 'ar-SA' },
  { code: 'fr', label: 'French', voice: 'fr-FR' },
  { code: 'de', label: 'German', voice: 'de-DE' },
  { code: 'es', label: 'Spanish', voice: 'es-ES' },
  { code: 'pt', label: 'Portuguese', voice: 'pt-BR' },
  { code: 'ja', label: 'Japanese', voice: 'ja-JP' },
  { code: 'ko', label: 'Korean', voice: 'ko-KR' },
  { code: 'ne', label: 'Nepali', voice: 'ne-NP' },
  { code: 'ur', label: 'Urdu', voice: 'ur-PK' },
  { code: 'bn', label: 'Bengali', voice: 'bn-BD' },
  { code: 'tl', label: 'Filipino', voice: 'fil-PH' },
];

const QUICK_PHRASES = [
  { label: 'Where is the hospital?', category: 'Emergency' },
  { label: 'I need help please.', category: 'Emergency' },
  { label: 'How much does this cost?', category: 'Shopping' },
  { label: 'Where is the nearest bus stop?', category: 'Transport' },
  { label: 'I am looking for accommodation.', category: 'Housing' },
  { label: 'Can you speak slowly please?', category: 'Communication' },
  { label: "I don't understand.", category: 'Communication' },
  { label: 'Where is the immigration office?', category: 'Official' },
];

export default function VoiceTranslatorPage() {
  const { user } = useAuth();
  const [fromLang, setFromLang] = useState('si');
  const [toLang, setToLang] = useState('en');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const speechRecognitionSupported =
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const speechSynthesisSupported = 'speechSynthesis' in window;

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setOriginalText(translatedText);
    setTranslatedText('');
  };

  const startRecording = () => {
    if (!speechRecognitionSupported) {
      toast.error('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    const fromLanguage = LANGUAGES.find(l => l.code === fromLang);

    recognition.lang = fromLanguage?.voice || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setOriginalText('');
      setTranslatedText('');
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setOriginalText(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (recognitionRef.current?.finalText) {
        handleTranslate(recognitionRef.current.finalText);
      }
    };

    recognition.onerror = (event) => {
      setIsRecording(false);
      if (event.error === 'no-speech') {
        toast.error('No speech detected. Please try again.');
      } else {
        toast.error(`Recording error: ${event.error}`);
      }
    };

    recognition.addEventListener('result', (event) => {
      const finalTranscript = Array.from(event.results)
        .filter(result => result.isFinal)
        .map(result => result[0].transcript)
        .join('');
      if (finalTranscript) {
        recognitionRef.current = { ...recognitionRef.current, finalText: finalTranscript };
      }
    });

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const handleTranslate = async (text) => {
    const textToTranslate = text || originalText;
    if (!textToTranslate.trim()) {
      toast.error('Please speak or type something first.');
      return;
    }

    setIsTranslating(true);
    setTranslatedText('');

    try {
      const fromLanguage = LANGUAGES.find(l => l.code === fromLang);
      const toLanguage = LANGUAGES.find(l => l.code === toLang);

      // ✅ Uses the new dedicated /api/ai/translate endpoint
      const response = await api.post('/api/ai/translate', {
        text: textToTranslate,
        fromLanguage: fromLanguage?.label,
        toLanguage: toLanguage?.label,
      });

      const translated = response.data.data?.reply || '';
      setTranslatedText(translated);

      // Add to history
      setHistory(prev => [{
        original: textToTranslate,
        translated,
        fromLang: fromLanguage?.label,
        toLang: toLanguage?.label,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);

      // Auto speak
      speakText(translated, toLanguage?.voice || 'en-US');

    } catch (err) {
      console.log('Translation error:', err.response?.data);
      toast.error(err.response?.data?.message || 'Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const speakText = (text, voiceLocale) => {
    if (!speechSynthesisSupported || !text) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLocale;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    const voices = synthRef.current.getVoices();
    const matchingVoice = voices.find(v =>
      v.lang.startsWith(voiceLocale.split('-')[0])
    );
    if (matchingVoice) utterance.voice = matchingVoice;

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleQuickPhrase = (phrase) => {
    setOriginalText(phrase);
    handleTranslate(phrase);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="section-title flex items-center gap-3">
          <Globe className="text-gold-400" size={28} />
          Voice Translator
        </h1>
        <p className="section-subtitle">
          Speak in your language and get instant voice translation.
          Perfect for daily conversations in your new home.
        </p>
      </div>

      {/* Language Selector */}
      <div className="card">
        <div className="flex items-center gap-4">

          {/* From Language */}
          <div className="flex-1">
            <label className="label text-xs">Speak in</label>
            <select
              value={fromLang}
              onChange={e => setFromLang(e.target.value)}
              className="input"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button
            onClick={swapLanguages}
            className="mt-5 w-10 h-10 bg-navy-700 hover:bg-gold-500/20 
                       border border-navy-600 hover:border-gold-500 
                       rounded-full flex items-center justify-center 
                       transition-all group shrink-0"
          >
            <ArrowRight size={16}
              className="text-gray-400 group-hover:text-gold-400 transition-colors" />
          </button>

          {/* To Language */}
          <div className="flex-1">
            <label className="label text-xs">Translate to</label>
            <select
              value={toLang}
              onChange={e => setToLang(e.target.value)}
              className="input"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Translator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Input Panel */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {LANGUAGES.find(l => l.code === fromLang)?.label}
            </span>
            {originalText && (
              <button onClick={() => {
                setOriginalText('');
                setTranslatedText('');
              }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Clear
              </button>
            )}
          </div>

          {/* Text Area */}
          <textarea
            value={originalText}
            onChange={e => setOriginalText(e.target.value)}
            placeholder={isRecording
              ? '🎤 Listening...'
              : 'Speak or type your text here...'}
            rows={5}
            className="input resize-none text-sm"
          />

          {/* Record Button */}
          <div className="flex gap-3">
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={!speechRecognitionSupported}
              className={`flex-1 flex items-center justify-center gap-2 
                         py-3 rounded-lg font-medium transition-all
                         ${isRecording
                  ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse'
                  : 'bg-navy-700 hover:bg-navy-600 text-white border border-navy-600'
                } ${!speechRecognitionSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRecording
                ? <><MicOff size={18} /> Release to Stop</>
                : <><Mic size={18} /> Hold to Speak</>
              }
            </button>

            <button
              onClick={() => handleTranslate()}
              disabled={!originalText.trim() || isTranslating}
              className="btn-primary px-4 flex items-center gap-2 
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTranslating
                ? <Loader size={18} className="animate-spin" />
                : <ArrowRight size={18} />
              }
            </button>
          </div>

          {!speechRecognitionSupported && (
            <p className="text-xs text-yellow-500">
              ⚠️ Voice input requires Chrome browser. You can still type manually.
            </p>
          )}
        </div>

        {/* Output Panel */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {LANGUAGES.find(l => l.code === toLang)?.label}
            </span>
            <div className="flex items-center gap-2">
              {translatedText && (
                <>
                  <button onClick={handleCopy}
                    className="text-xs text-gray-500 hover:text-gray-300 
                               flex items-center gap-1 transition-colors">
                    {copied
                      ? <><CheckCheck size={14} className="text-green-400" /> Copied</>
                      : <><Copy size={14} /> Copy</>
                    }
                  </button>
                  <button
                    onClick={() => isSpeaking
                      ? stopSpeaking()
                      : speakText(
                        translatedText,
                        LANGUAGES.find(l => l.code === toLang)?.voice || 'en-US'
                      )
                    }
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 
                               rounded-lg transition-all
                               ${isSpeaking
                        ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                        : 'bg-navy-700 text-gray-400 hover:text-white border border-navy-600'
                      }`}
                  >
                    {isSpeaking
                      ? <><VolumeX size={14} /> Stop</>
                      : <><Volume2 size={14} /> Play</>
                    }
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Translated Text */}
          <div className={`min-h-[120px] p-4 bg-navy-900 rounded-lg border 
                          text-sm leading-relaxed
                          ${isTranslating
              ? 'border-gold-500/30 animate-pulse'
              : 'border-navy-700'
            }`}>
            {isTranslating ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader size={16} className="animate-spin text-gold-400" />
                Translating...
              </div>
            ) : translatedText ? (
              <p className="text-white text-lg">{translatedText}</p>
            ) : (
              <p className="text-gray-600">Translation will appear here...</p>
            )}
          </div>

          {/* Speaking Indicator */}
          {isSpeaking && (
            <div className="flex items-center gap-2 text-gold-400 text-sm">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i}
                    className="w-1 bg-gold-400 rounded-full animate-bounce"
                    style={{
                      height: `${8 + i * 4}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              Speaking...
            </div>
          )}
        </div>
      </div>

      {/* Quick Phrases */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Globe size={16} className="text-gold-400" />
          Quick Phrases for Migrants
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {QUICK_PHRASES.map((phrase, i) => (
            <button key={i}
              onClick={() => handleQuickPhrase(phrase.label)}
              className="flex items-center justify-between px-4 py-3 
                         bg-navy-900 hover:bg-navy-800 border border-navy-700 
                         hover:border-navy-600 rounded-lg text-left 
                         transition-all group">
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                {phrase.label}
              </span>
              <span className="text-xs text-gray-600 ml-2 shrink-0 group-hover:text-gold-400 transition-colors">
                {phrase.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Translation History */}
      {history.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <RefreshCw size={16} className="text-gold-400" />
              Recent Translations
            </h3>
            <button onClick={() => setHistory([])}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Clear history
            </button>
          </div>
          <div className="space-y-3">
            {history.map((item, i) => (
              <div key={i}
                className="flex items-start gap-4 p-3 bg-navy-900 
                           rounded-lg border border-navy-800
                           hover:border-navy-700 transition-colors cursor-pointer"
                onClick={() => {
                  setOriginalText(item.original);
                  setTranslatedText(item.translated);
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 truncate">{item.original}</p>
                  <p className="text-sm text-white truncate mt-1">{item.translated}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-600">{item.fromLang} → {item.toLang}</p>
                  <p className="text-xs text-gray-700 mt-0.5">
                    {item.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}