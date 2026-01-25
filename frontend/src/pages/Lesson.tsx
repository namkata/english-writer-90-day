import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Pattern } from '../types';
import { ArrowLeft, Check, X, Volume2, Mic, MicOff } from 'lucide-react';
import clsx from 'clsx';

export default function Lesson() {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0); // 0: Theory, 1: Practice (VI->EN), 2: Practice (EN->VI)
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (day) {
      api.getLesson(parseInt(day))
        .then((res) => {
          setPatterns(res.patterns);
          setLoading(false);
        })
        .catch(console.error);
    }
  }, [day]);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        // Default to US English, will toggle to VI when needed
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };
    }
  }, []);

  const toggleListening = (lang: 'en-US' | 'vi-VN' = 'en-US') => {
      if (isListening) {
          recognitionRef.current?.stop();
      } else {
          if (recognitionRef.current) {
            recognitionRef.current.lang = lang;
            recognitionRef.current.start();
            setIsListening(true);
          }
      }
  };

  const speak = (text: string, lang: 'en-US' | 'vi-VN' = 'en-US') => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
  };

  if (loading) return <div className="p-8 text-center">Loading Lesson...</div>;
  if (patterns.length === 0) return <div className="p-8 text-center">No patterns found for this day.</div>;

  const currentPatternIndex = Math.floor(step / 3);
  const stepInPattern = step % 3; // 0: Theory, 1: VI->EN, 2: EN->VI
  const currentPattern = patterns[currentPatternIndex];
  const progress = ((step) / (patterns.length * 3)) * 100;

  const handleNext = () => {
    if (step >= patterns.length * 3 - 1) {
      // Finished
      api.completeDay(parseInt(day!), 100).then(() => {
        navigate('/');
      });
    } else {
      setStep(step + 1);
      setInput('');
      setFeedback(null);
      setShowAnswer(false);
    }
  };

  const checkAnswer = () => {
    // Normalize string: remove punctuation, lowercase, trim, remove accents (for Vietnamese)
    const normalize = (s: string) => s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Remove punctuation
      .trim();
    
    let isCorrect = false;

    if (stepInPattern === 1) {
        // VI -> EN Check
        isCorrect = normalize(input) === normalize(currentPattern.english);
        if (!isCorrect && currentPattern.alternatives) {
            isCorrect = currentPattern.alternatives.some(alt => normalize(input) === normalize(alt));
        }
    } else if (stepInPattern === 2) {
        // EN -> VI Check
        isCorrect = normalize(input) === normalize(currentPattern.vietnamese);
        if (!isCorrect && currentPattern.vietnamese_alternatives) {
            isCorrect = currentPattern.vietnamese_alternatives.some(alt => normalize(input) === normalize(alt));
        }
    }

    if (isCorrect) {
      setFeedback('correct');
      // Auto speak correct answer in target language
      if (stepInPattern === 1) speak(currentPattern.english, 'en-US');
      else speak(currentPattern.vietnamese, 'vi-VN');
    } else {
      setFeedback('incorrect');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft />
        </button>
        <div className="w-full mx-4 bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-sm font-semibold text-gray-500">
          {currentPatternIndex + 1}/{patterns.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {stepInPattern === 0 ? (
          // Theory Card
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-blue-600 mb-2">New Pattern</h2>
            <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl font-bold text-gray-800">{currentPattern.english}</div>
                <button onClick={() => speak(currentPattern.english, 'en-US')} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                    <Volume2 className="text-blue-600" />
                </button>
            </div>

            {currentPattern.alternatives && currentPattern.alternatives.length > 0 && (
                <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <span className="block text-sm text-purple-600 uppercase font-bold mb-2">Các cách nói khác (Variations)</span>
                    <ul className="list-disc list-inside space-y-1">
                        {currentPattern.alternatives.map((alt, idx) => (
                            <li key={idx} className="text-gray-700 italic flex items-center justify-between group">
                                <span>{alt}</span>
                                <button onClick={() => speak(alt, 'en-US')} className="opacity-0 group-hover:opacity-100 p-1">
                                    <Volume2 size={16} className="text-purple-600" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="block text-sm text-gray-500 uppercase font-bold">Tiếng Việt</span>
                <span className="text-xl text-gray-700">{currentPattern.vietnamese}</span>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <span className="block text-sm text-blue-500 uppercase font-bold">Cấu trúc (Structure)</span>
                <span className="text-lg font-mono text-blue-800">{currentPattern.structure}</span>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <span className="block text-sm text-yellow-600 uppercase font-bold">Cách dùng (Usage)</span>
                <span className="text-gray-700">{currentPattern.explanation}</span>
                {currentPattern.context && (
                    <div className="mt-2 text-sm text-yellow-800 italic">
                        Ngữ cảnh: {currentPattern.context}
                    </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleNext}
              className="mt-8 w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition"
            >
              Bắt đầu thực hành
            </button>
          </div>
        ) : (
          // Practice Card (Handles both VI->EN and EN->VI)
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-purple-600 mb-2">
                {stepInPattern === 1 ? "Dịch sang Tiếng Anh (Translate to English)" : "Dịch sang Tiếng Việt (Translate to Vietnamese)"}
            </h2>
            
            {/* Question Display */}
            <div className="text-2xl font-medium text-gray-700 mb-6 flex items-center gap-3">
                {stepInPattern === 1 ? currentPattern.vietnamese : currentPattern.english}
                {stepInPattern === 2 && (
                    <button onClick={() => speak(currentPattern.english, 'en-US')} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                        <Volume2 size={20} className="text-blue-600" />
                    </button>
                )}
            </div>
            
            <div className="relative">
                <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={stepInPattern === 1 ? "Type or say in English..." : "Nhập hoặc nói bằng Tiếng Việt..."}
                className={clsx(
                    "w-full p-4 pr-12 text-xl border-2 rounded-xl focus:outline-none transition-colors",
                    feedback === 'correct' ? "border-green-500 bg-green-50" :
                    feedback === 'incorrect' ? "border-red-500 bg-red-50" :
                    "border-gray-200 focus:border-blue-500"
                )}
                rows={3}
                disabled={feedback === 'correct'}
                />
                <button 
                    onClick={() => toggleListening(stepInPattern === 1 ? 'en-US' : 'vi-VN')}
                    className={clsx(
                        "absolute right-4 bottom-4 p-2 rounded-full transition-colors",
                        isListening ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                    title="Use Microphone"
                >
                    {isListening ? <MicOff /> : <Mic />}
                </button>
            </div>

            {feedback === 'incorrect' && (
              <div className="mt-4 text-red-600 animate-pulse">
                Incorrect. Try again! Hint: Starts with "{stepInPattern === 1 ? currentPattern.english.substring(0, 1) : currentPattern.vietnamese.substring(0, 1)}..."
              </div>
            )}

            {feedback === 'correct' && (
              <div className="mt-4 flex items-center gap-2 text-green-600 font-bold text-lg">
                <Check /> Correct! Well done.
              </div>
            )}

            <div className="mt-8 flex gap-4">
              {feedback !== 'correct' ? (
                 <button 
                 onClick={checkAnswer}
                 className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-lg hover:bg-black transition"
               >
                 Check Answer
               </button>
              ) : (
                <button 
                  onClick={handleNext}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-700 transition"
                >
                  {stepInPattern === 1 ? "Next Step (Reverse)" : "Next Pattern"}
                </button>
              )}
            </div>
             
            {/* Skip button */}
             {feedback !== 'correct' && (
                <div className="mt-4 text-center">
                    {!showAnswer ? (
                        <button onClick={() => setShowAnswer(true)} className="text-gray-400 text-sm hover:text-gray-600 underline">
                            Show Answer
                        </button>
                    ) : (
                        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 inline-block animate-fade-in">
                            <span className="block text-xs font-bold text-yellow-600 uppercase mb-1">Answer</span>
                            <div className="text-lg font-medium text-gray-800 flex items-center gap-2">
                                {stepInPattern === 1 ? currentPattern.english : currentPattern.vietnamese}
                                <button onClick={() => speak(stepInPattern === 1 ? currentPattern.english : currentPattern.vietnamese, stepInPattern === 1 ? 'en-US' : 'vi-VN')} className="p-1 rounded-full bg-yellow-100 hover:bg-yellow-200">
                                    <Volume2 size={16} className="text-yellow-700" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
