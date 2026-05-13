/**
 * ==========================================
 * AI TEACHER UI - TeachingPanel.jsx
 * ==========================================
 * This component is the visual representation of your AI teacher.
 * It's the "character" that sits on the side (or bottom on mobile)
 * and talks to the student.
 */

import React from 'react';
import { useTeachingState } from '../contexts/TeachingContext'; // Pulling global state
import { Play, Pause, RotateCcw, ChevronRight, Sparkles } from 'lucide-react';
import clsx from 'clsx';

export default function TeachingPanel() {
  // Destructuring state and functions from the context
  const {
    isActive, mode, isSpeaking, showContinueButton, userHasRun,
    stopTeaching, togglePause, isPaused, continueTeaching, explainLastTopic,
    startCodeExplanation
  } = useTeachingState();

  const [canExplainCode, setCanExplainCode] = React.useState(false);

  // Effect: When we reach a code block, we wait a few seconds before showing the "Explain Code" button.
  React.useEffect(() => {
    if (mode === 'WAITING_TO_TRY') {
      setCanExplainCode(false);
      const timer = setTimeout(() => setCanExplainCode(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  /**
   * STATUS TEXT LOGIC
   * Returns a friendly message based on what the AI is currently doing.
   */
  const getStatusText = () => {
    switch (mode) {
      case 'EXPLAINING': return "Explaining the topic...";
      case 'EXPLAINING_CODE': return "Explaining the code...";
      case 'WAITING_TO_TRY': return "Try out this code!";
      case 'BOT_CODING': return "I am writing the code...";
      case 'AT_CODE_BLOCK': return showContinueButton ? "Your turn to try!" : "Wait for instruction";
      case 'USER_TRYING': return userHasRun ? "Great! Now run the code." : "Try editing then click Run!";
      default: return "Ready to start!";
    }
  };

  return (
    <aside
      className={clsx(
        "fixed z-[100] flex flex-col transition-all duration-500 ease-in-out",
        // RESPONSIVE DESIGN: 
        // Desktop: Right side (260px wide, full height)
        // Mobile: Bottom (25vh high, full width)
        "bottom-0 left-0 w-full h-[25vh] md:h-[calc(100vh-64px)] md:w-[260px] md:top-16 md:bottom-auto md:right-0 md:left-auto",
        isActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      style={{
        transform: isActive
          ? "translate(0)"
          : (typeof window !== 'undefined' && window.innerWidth < 768) ? "translateY(110%)" : "translateX(110%)",
      }}
    >
      <div className="w-full flex-1 border-t md:border-t-0 md:border-l border-slate-200 bg-white/95 backdrop-blur-md overflow-hidden flex flex-col rounded-t-[2rem] md:rounded-t-none">

        {/* 1. Header Area */}
        <div className="px-6 py-1.5 md:pt-6 md:pb-5 border-b border-slate-100 text-center shrink-0">
          <span className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
            AI Assistant
          </span>
        </div>

        {/* 2. Bot Face Area: The animated part of the UI */}
        <div className="flex-1 flex flex-row md:flex-col items-center justify-center px-8 py-2 md:py-8 gap-6 md:gap-5 overflow-hidden">
          <div className="rounded-full p-1 bg-slate-50 border border-slate-100 shrink-0">
            <div className="relative w-12 h-12 md:w-32 md:h-32 rounded-full bg-slate-900 flex items-center justify-center">
              {/* Eyes */}
              <div className="flex gap-2 md:gap-6 absolute top-[34%]">
                <div className="w-0.5 md:w-[10px] h-2 md:h-6 rounded-full bg-blue-400" />
                <div className="w-0.5 md:w-[10px] h-2 md:h-6 rounded-full bg-blue-400" />
              </div>
              {/* Mouth: Animated dots that pulse when the AI is "speaking" */}
              <div className="absolute bottom-[27%] flex items-center gap-0.5 md:gap-1.5">
                {[0, 0.2, 0.4, 0.2, 0].map((delay, i) => (
                  <div
                    key={i}
                    className="w-0.5 md:w-1.5 h-0.5 md:h-1.5 rounded-full bg-blue-400/80"
                    style={{
                      animationName: isSpeaking ? 'dot-pulse' : 'none', // Pulse only when speaking
                      animationDuration: '1.6s',
                      animationTimingFunction: 'ease-in-out',
                      animationDelay: `${delay}s`,
                      animationIterationCount: 'infinite',
                      animationPlayState: isPaused ? 'paused' : 'running',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Current Status Message */}
          <p className="text-[11px] md:text-sm font-medium text-slate-600 leading-snug">
            "{getStatusText()}"
          </p>
        </div>

        {/* 3. Controls Area: Buttons change based on the current 'mode' */}
        <div className="px-5 pb-5 pt-3 md:pt-5 border-t border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center gap-2">

          {/* Prompt the user to take action when it's their turn */}
          {mode === 'AT_CODE_BLOCK' && !showContinueButton && (
            <div className="w-full py-1.5 bg-emerald-500 text-white font-black rounded-xl flex justify-center items-center gap-2 text-[10px] tracking-[0.2em] uppercase animate-pulse">
              <Sparkles size={14} />
              Your turn!
            </div>
          )}

          {/* Primary Action Row */}
          <div className="flex gap-3 h-10 md:h-12 w-full justify-center">
            
            {/* Logic to show 'Next', 'Resume/Pause', or 'Explain Code' based on state */}
            {mode === 'USER_TRYING' && userHasRun ? (
              <button onClick={continueTeaching} className="flex-1 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">
                Next Topic
              </button>
            ) : (mode === 'AT_CODE_BLOCK' && showContinueButton) ? (
              <div className="flex gap-2 flex-1">
                <button onClick={explainLastTopic} className="flex-1 rounded-xl border bg-white text-[10px] font-bold tracking-widest uppercase">
                  Retry
                </button>
                <button onClick={continueTeaching} className="flex-1 rounded-xl bg-slate-900 text-white text-[10px] font-bold tracking-widest uppercase">
                  Next
                </button>
              </div>
            ) : (mode === 'WAITING_TO_TRY' || mode === 'AT_CODE_BLOCK') ? (
              <button onClick={startCodeExplanation} className="flex-1 rounded-xl bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest border-b-2 border-emerald-700">
                Explain Code
              </button>
            ) : (
              <button
                onClick={togglePause}
                className={clsx(
                  "flex-1 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest",
                  isPaused ? "bg-white border text-slate-700" : "bg-slate-900 text-white"
                )}
              >
                {isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
                {isPaused ? "Resume" : "Pause"}
              </button>
            )}

            {/* Stop Session Button: Exits the AI teaching mode */}
            <button
              onClick={stopTeaching}
              className="w-10 md:w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-red-50"
            >
              <div className="w-3 h-3 rounded-[2px] bg-slate-400 hover:bg-red-500" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
