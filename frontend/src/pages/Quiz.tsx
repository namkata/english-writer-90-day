import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Pattern, QuizResult } from '../types';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

export default function Quiz() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({}); // Index -> Answer
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [result, setResult] = useState<QuizResult | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    api.getQuiz().then((res) => {
      setQuestions(res.questions);
      setAttemptsLeft(res.attempts_left);
      if (res.attempts_left <= 0) {
          setLimitReached(true);
      }
      setLoading(false);
    }).catch((err) => {
        if (err.response?.status === 403) {
            setLimitReached(true);
            setLoading(false);
        }
    });
  }, []);

  useEffect(() => {
    if (!loading && !submitted && timeLeft > 0 && !limitReached) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !submitted && !loading && !limitReached) {
      handleSubmit();
    }
  }, [loading, submitted, timeLeft, limitReached]);

  const handleAnswer = (val: string) => {
    setAnswers({ ...answers, [currentIdx]: val });
  };

  const handleSubmit = async () => {
    // Map answers to Pattern ID
    const payload: Record<number, string> = {};
    questions.forEach((q, idx) => {
        payload[q.id] = answers[idx] || "";
    });

    try {
        const res = await api.submitQuiz(payload);
        setResult(res);
        setSubmitted(true);
    } catch (error) {
        console.error("Submit failed", error);
        alert("Failed to submit quiz. Please try again.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Quiz...</div>;
  
  if (limitReached) {
      return (
        <div className="max-w-md mx-auto p-8 text-center bg-white rounded-2xl shadow-xl mt-10">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Daily Limit Reached</h2>
            <p className="text-gray-600 mb-6">You have used all 3 attempts for today. Please come back tomorrow or review your lessons.</p>
            <button 
                onClick={() => navigate('/')}
                className="bg-gray-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-black"
            >
                Back to Dashboard
            </button>
        </div>
      )
  }

  const currentQ = questions[currentIdx];
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (submitted && result) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-xl my-10">
        <div className="text-center mb-8 border-b pb-6">
            <h2 className="text-3xl font-bold mb-2">Quiz Result</h2>
            <div className={clsx(
            "text-6xl font-black mb-2",
            result.score >= 80 ? "text-green-600" : result.score >= 50 ? "text-yellow-600" : "text-red-600"
            )}>
            {result.score}%
            </div>
            <p className="text-gray-500">Attempts left for today: {result.attempts_left}</p>
        </div>

        <div className="space-y-6">
            {result.details.map((detail, idx) => (
                <div key={idx} className={clsx("p-4 rounded-xl border-2", detail.is_correct ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50")}>
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">Question {idx + 1}: {detail.question}</h3>
                        {detail.is_correct ? <CheckCircle className="text-green-600" /> : <XCircle className="text-red-600" />}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Your Answer</p>
                            <p className={clsx("font-medium", detail.is_correct ? "text-green-700" : "text-red-700")}>
                                {detail.user_answer || "(No answer)"}
                            </p>
                        </div>
                        {!detail.is_correct && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Correct Answer</p>
                                <p className="font-medium text-green-700">{detail.correct_answer}</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600"><span className="font-bold">Structure:</span> {detail.structure}</p>
                        <p className="text-sm text-gray-600 mt-1"><span className="font-bold">Explanation:</span> {detail.explanation}</p>
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-8 flex justify-center gap-4">
            <button 
                onClick={() => navigate('/')}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-300"
            >
                Back to Dashboard
            </button>
            {result.attempts_left > 0 && (
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700"
                >
                    Try Again
                </button>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold">Question {currentIdx + 1}/{questions.length}</h2>
        <div className={clsx("flex items-center gap-2 font-mono text-xl", timeLeft < 60 ? "text-red-600" : "text-gray-700")}>
          <Clock size={24} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex-1">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-6">
          <div className="text-gray-500 font-bold uppercase text-sm mb-2">Translate to English</div>
          <div className="text-2xl font-medium text-gray-800 mb-6">{currentQ.vietnamese}</div>
          
          <textarea
            value={answers[currentIdx] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full p-4 text-xl border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Type your answer..."
            autoFocus
          />
        </div>

        <div className="flex justify-between">
            <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(c => c - 1)}
                className="px-6 py-3 rounded-xl font-bold text-gray-500 disabled:opacity-30 hover:bg-gray-100"
            >
                Previous
            </button>

            {currentIdx < questions.length - 1 ? (
                 <button
                 onClick={() => setCurrentIdx(c => c + 1)}
                 className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
             >
                Next
             </button>
            ) : (
                <button
                    onClick={handleSubmit}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                >
                    Submit Quiz
                </button>
            )}
        </div>
      </div>
    </div>
  );
}
