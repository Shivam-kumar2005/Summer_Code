import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, CheckCircle2, XCircle,
  Trophy, RotateCcw, ArrowRight, Play, Loader2, Sparkles,
  HelpCircle, Code, Bug, Terminal
} from 'lucide-react';
import { API_URL } from '../config';
import clsx from 'clsx';
import CodeBlock from '../components/CodeBlock';

export default function PracticePage() {
  const { courseId, topicId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userCode, setUserCode] = useState('');
  const [executionResult, setExecutionResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const user = JSON.parse(localStorage.getItem('studentData') || '{}');

  useEffect(() => {
    fetchQuestions();
  }, [topicId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/practice?topicId=${topicId}&userId=${user.email}`);
      const data = await res.json();
      setQuestions(data);
      if (data.length > 0 && data[0].starterCode) {
        setUserCode(data[0].starterCode);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (option) => {
    if (isSubmitted) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (isSubmitted) return;

    let isCorrect = false;
    if (currentQuestion.type === 'mcq' || currentQuestion.type === 'output') {
      isCorrect = selectedOption === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === 'debug' || currentQuestion.type === 'coding') {
      // For simplicity in this demo, we check if execution passed
      isCorrect = executionResult?.success;
    }

    if (isCorrect) setScore(prev => prev + 1);
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedOption(null);
      setIsSubmitted(false);
      setExecutionResult(null);
      if (questions[nextIndex].starterCode) {
        setUserCode(questions[nextIndex].starterCode);
      }
    } else {
      submitFinalScore();
    }
  };

  const submitFinalScore = async () => {
    const finalScorePerc = Math.round((score / questions.length) * 100);
    try {
      await fetch(`${API_URL}/api/practice/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          topicId,
          score: finalScorePerc
        })
      });
    } catch (err) {
      console.error('Failed to submit score:', err);
    }
    setShowSummary(true);
  };

  const handleRunCode = async () => {
    setIsExecuting(true);
    try {
      const res = await fetch(`${API_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: userCode,
          language: 'javascript', // Defaulting to JS for practice
        })
      });
      const data = await res.json();

      // Simple validation for practice: match output
      const success = data.output?.trim() === currentQuestion.correctAnswer?.trim();
      setExecutionResult({ output: data.output, success, error: data.error });

      if (success) {
        // Auto submit for coding questions if correct
        setSelectedOption(true);
      }
    } catch (err) {
      setExecutionResult({ output: 'Execution failed', error: true });
    } finally {
      setIsExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-6 text-center">
        <div className="space-y-6">
          <HelpCircle size={64} className="mx-auto text-slate-300" />
          <h2 className="text-2xl font-black text-slate-900 uppercase">No Questions Found</h2>
          <p className="text-slate-500">We couldn't find any practice questions for this topic yet.</p>
          <button onClick={() => navigate(-1)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold">Go Back</button>
        </div>
      </div>
    );
  }

  if (showSummary) {
    const perc = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-[3rem] p-12 text-center shadow-2xl shadow-blue-100/50 space-y-10 animate-entrance">
          <div className="relative inline-block">
            <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
              <Trophy size={64} />
            </div>
            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
              <Sparkles size={20} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Session Complete!</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Topic: {topicId}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-5xl font-black text-slate-900">{score}/{questions.length}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Questions Correct</p>
            </div>
            <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100">
              <p className="text-5xl font-black text-blue-600">{perc}%</p>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-2">Mastery Level</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
            >
              <RotateCcw size={16} /> Retry Session
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3"
            >
              Back to Courses <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] pb-20 font-sans selection:bg-blue-100">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-widest">{topicId}</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Practice Session</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
              <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden border border-slate-200/50">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-12">
        <div className="space-y-8 animate-entrance">

          {/* Question Type Badge */}
          <div className="flex items-center gap-3">
            <div className={clsx(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
              currentQuestion.type === 'mcq' && "bg-blue-50 text-blue-600 border border-blue-100",
              currentQuestion.type === 'output' && "bg-amber-50 text-amber-600 border border-amber-100",
              currentQuestion.type === 'debug' && "bg-rose-50 text-rose-600 border border-rose-100",
              currentQuestion.type === 'coding' && "bg-emerald-50 text-emerald-600 border border-emerald-100"
            )}>
              {currentQuestion.type === 'mcq' && <HelpCircle size={12} />}
              {currentQuestion.type === 'output' && <Terminal size={12} />}
              {currentQuestion.type === 'debug' && <Bug size={12} />}
              {currentQuestion.type === 'coding' && <Code size={12} />}
              {currentQuestion.type}
            </div>
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
              {currentQuestion.difficulty}
            </span>
          </div>

          {/* Question Title */}
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
            {currentQuestion.question}
          </h2>

          {/* Content Area */}
          <div className="space-y-6">
            {(currentQuestion.type === 'mcq' || currentQuestion.type === 'output') ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = isSubmitted && option === currentQuestion.correctAnswer;
                  const isWrong = isSubmitted && isSelected && option !== currentQuestion.correctAnswer;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      disabled={isSubmitted}
                      className={clsx(
                        "p-6 rounded-[1.5rem] border-2 text-left transition-all group flex items-center justify-between",
                        !isSubmitted && isSelected && "border-blue-600 bg-blue-50/50",
                        !isSubmitted && !isSelected && "border-slate-200 hover:border-slate-300 bg-white",
                        isSubmitted && isCorrect && "border-emerald-500 bg-emerald-50",
                        isSubmitted && isWrong && "border-red-500 bg-red-50",
                        isSubmitted && !isCorrect && !isWrong && "border-slate-200 opacity-50 bg-white"
                      )}
                    >
                      <span className={clsx(
                        "text-lg font-bold transition-colors",
                        !isSubmitted && isSelected ? "text-blue-600" : "text-slate-700"
                      )}>
                        {option}
                      </span>
                      {isSubmitted && isCorrect && <CheckCircle2 className="text-emerald-500" size={24} />}
                      {isSubmitted && isWrong && <XCircle className="text-red-500" size={24} />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 overflow-hidden shadow-sm bg-slate-900">
                  <div className="bg-slate-800 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editor</span>
                    <button
                      onClick={handleRunCode}
                      disabled={isExecuting || isSubmitted}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
                    >
                      {isExecuting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                      Run Test
                    </button>
                  </div>
                  <textarea
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    disabled={isSubmitted}
                    spellCheck="false"
                    className="w-full h-64 bg-slate-900 text-emerald-400 font-mono p-6 outline-none resize-none text-sm"
                  />
                </div>

                {executionResult && (
                  <div className={clsx(
                    "p-6 rounded-3xl border animate-pop-in",
                    executionResult.success ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={clsx("text-[10px] font-black uppercase tracking-widest", executionResult.success ? "text-emerald-600" : "text-red-600")}>
                        {executionResult.success ? "Test Passed" : "Test Failed"}
                      </span>
                    </div>
                    <pre className="text-xs font-mono text-slate-700">{executionResult.output}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Explanation Section */}
          {isSubmitted && (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-4 shadow-lg shadow-slate-100 animate-pop-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Sparkles size={16} />
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Explanation</h4>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-8 flex justify-end">
            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={(!selectedOption && (currentQuestion.type === 'mcq' || currentQuestion.type === 'output'))}
                className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black disabled:opacity-30 transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-200 flex items-center gap-3"
              >
                {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
                <ChevronRight size={18} />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
