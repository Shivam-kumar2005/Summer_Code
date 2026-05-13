import React, { useRef, useEffect } from 'react';
import { useTeachingState } from '../contexts/TeachingContext';
import clsx from 'clsx';

export default function TeachingHighlighter({ children, stepIndex, hasCodeBlock, noIndicator }) {
  const { currentStep, isActive, mode } = useTeachingState();
  const blockRef = useRef(null);

  const isCurrentBlock = isActive && currentStep === stepIndex;
  const showTryMessage = isCurrentBlock && hasCodeBlock && (mode === 'AT_CODE_BLOCK' || mode === 'WAITING_TO_TRY' || mode === 'USER_TRYING');

  useEffect(() => {
    if (isCurrentBlock && blockRef.current) {
      blockRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [isCurrentBlock]);

  return (
    <div
      ref={blockRef}
      className={clsx(
        "relative transition-all duration-300 w-full rounded-2xl",
        isCurrentBlock
          ? "bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 shadow-lg shadow-blue-500/5"
          : "bg-transparent border border-transparent",
        isCurrentBlock ? "px-6 py-6" : "px-0 py-4"
      )}
    >
      {showTryMessage && (
        <div className="flex justify-center mb-2 animate-pop-in">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap px-5 py-1.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20 animate-pulse-subtle">
            Ab aap karo!
          </span>
        </div>
      )}

      {children}
    </div>
  );
}
