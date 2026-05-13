/**
 * ==========================================
 * STATE MANAGEMENT - TeachingContext.jsx
 * ==========================================
 * This file uses the React Context API to manage the "Teaching Session".
 * It keeps track of what the AI teacher is doing, which step of the lesson we are on,
 * and if the student is currently writing code.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// 1. Create the Context: Think of this as a global "radio station".
const TeachingContext = createContext();

// 2. Provider Component: This is the "radio tower" that broadcasts state to components.
export function TeachingProvider({ children }) {
  // --- STATE VARIABLES ---
  const [isActive, setIsActive] = useState(false); // Is the AI teacher currently active?
  const [mode, setMode] = useState('IDLE'); // What is the teacher doing? (IDLE, EXPLAINING, BOT_CODING, etc.)
  const [currentStep, setCurrentStep] = useState(0); // Which block of the lesson are we on?
  const [currentCodeLine, setCurrentCodeLine] = useState(0); // Which line of code is being typed?
  const [showContinueButton, setShowContinueButton] = useState(false); // Should we show the 'Next' button?
  const [userHasRun, setUserHasRun] = useState(false); // Has the student clicked 'Run Code' yet?
  const [activeAnimations, setActiveAnimations] = useState(0); // Tracking active UI animations
  const [isPaused, setIsPaused] = useState(false); // Is the teaching session paused?
  const [isSpeaking, setIsSpeaking] = useState(false); // Is the AI currently speaking?
  const [currentWordIndex, setCurrentWordIndex] = useState(-1); // For highlighting words as they are spoken
  const [isAdminMode, setIsAdminMode] = useState(false); // Is the Admin panel visible?
  const [activeLesson, setActiveLesson] = useState(null); // The actual lesson data being taught
  const [isEnglish, setIsEnglish] = useState(false); // Language preference (English vs Hindi/other)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop sidebar collapse state

  const location = useLocation();

  /**
   * START TEACHING: Initializes a session for a specific lesson.
   */
  const startTeaching = (lesson) => {
    // If a session was already running, stop it first.
    if (isActive) stopTeaching();

    setActiveLesson(lesson);
    setIsActive(true);
    setCurrentStep(0);
    
    // If the first block is code, wait for user to try it. Otherwise, start explaining.
    if (lesson && lesson.blocks[0]?.type === 'code') {
      setMode('WAITING_TO_TRY');
    } else {
      setMode('EXPLAINING');
    }
    setCurrentCodeLine(0);
    setShowContinueButton(false);
    setUserHasRun(false);
    setIsPaused(false);
  };

  /**
   * STOP TEACHING: Resets everything to the default state.
   */
  const stopTeaching = () => {
    setIsActive(false);
    setMode('IDLE');
    setCurrentStep(0);
    setCurrentWordIndex(-1);
  };

  // Automatically stop teaching if user navigates away from the lesson page.
  useEffect(() => {
    if (isActive && !location.pathname.startsWith('/lessons/')) {
      stopTeaching();
    }
  }, [location.pathname, isActive]);

  /**
   * CONTINUE TEACHING: Moves to the next step of the lesson.
   */
  const continueTeaching = () => {
    // Check if we reached the end of the lesson
    if (activeLesson && currentStep >= activeLesson.blocks.length - 1) {
      setMode('COMPLETED');
      setTimeout(() => stopTeaching(), 1000);
      return;
    }

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    
    // Set mode based on what type of content is next
    if (activeLesson && activeLesson.blocks[nextStep]?.type === 'code') {
      setMode('WAITING_TO_TRY');
    } else {
      setMode('EXPLAINING');
    }
  };

  /**
   * JUMP TO STEP: Allows navigating to any part of the lesson directly.
   */
  const jumpToStep = (stepIndex) => {
    if (!activeLesson || !isActive) return;
    setCurrentStep(stepIndex);
    
    if (activeLesson.blocks[stepIndex]?.type === 'code') {
      setMode('WAITING_TO_TRY');
    } else {
      setMode('EXPLAINING');
    }
    setCurrentCodeLine(0);
    setShowContinueButton(false);
    setUserHasRun(false);
    setIsPaused(false);
  };

  // Helper functions for various UI actions
  const explainTopic = () => setMode('BOT_CODING');
  const explainLastTopic = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setMode('EXPLAINING');
    }
  };
  const togglePause = () => setIsPaused(prev => !prev);
  const startCodeExplanation = () => setMode('EXPLAINING_CODE');

  // ADMIN SHORTCUT: Press Shift + A to toggle Admin Mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.key.toLowerCase() === 'a') {
        setIsAdminMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 3. Prepare the "value" object containing all state and functions.
  const value = {
    isActive, setIsActive,
    mode, setMode,
    currentStep, setCurrentStep,
    currentCodeLine, setCurrentCodeLine,
    showContinueButton, setShowContinueButton,
    userHasRun, setUserHasRun,
    activeAnimations, setActiveAnimations,
    isPaused, setIsPaused,
    isSpeaking, setIsSpeaking,
    currentWordIndex, setCurrentWordIndex,
    isAdminMode, setIsAdminMode,
    activeLesson, setActiveLesson,
    isSidebarOpen, setIsSidebarOpen,
    isSidebarCollapsed, setIsSidebarCollapsed,
    isEnglish, setIsEnglish,
    startTeaching, stopTeaching, togglePause, continueTeaching, explainTopic, explainLastTopic,
    startCodeExplanation, jumpToStep
  };

  return (
    // 4. Wrap children in the Provider so they can use this data.
    <TeachingContext.Provider value={value}>
      {children}
    </TeachingContext.Provider>
  );
}

// 5. Custom Hook: Makes it easy to use this context in other components.
// Example: const { mode } = useTeachingState();
export const useTeachingState = () => useContext(TeachingContext);
