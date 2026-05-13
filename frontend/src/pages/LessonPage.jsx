/**
 * ==========================================
 * LEARNING HUB - LessonPage.jsx
 * ==========================================
 * This is the most complex page in your app. It:
 * 1. Fetches lesson content from the backend.
 * 2. Plays AI voice instructions synchronized with the text.
 * 3. Tracks student progress.
 * 4. Renders interactive Code Blocks.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom'; // Tools to get URL parameters and navigate
import { useTeachingState } from '../contexts/TeachingContext'; // AI State
import TeachingHighlighter from '../components/TeachingHighlighter'; // UI indicator
import CodeBlock from '../components/CodeBlock'; // Interactive code runner
import { Play, ArrowRight, ArrowLeft, AlertCircle, Sparkles, Trophy, Zap } from 'lucide-react';
import clsx from 'clsx';
import { API_URL } from '../config';

/**
 * KARAOKE TEXT COMPONENT
 * A small helper to animate text as it's being explained.
 */
function KaraokeText({ text, isCurrentStep, isAdminMode }) {
  return (
    <span className={clsx(
      "transition-all duration-300 inline-block",
      isCurrentStep ? "scale-[1.02] origin-left" : "",
      isAdminMode && isCurrentStep ? "opacity-0 select-none" : ""
    )}>
      {text}
    </span>
  );
}

export default function LessonPage() {
  /**
   * TERMINOLOGY: useParams() (React Router Hook)
   * This hook "grabs" the dynamic part of the URL.
   * If the URL is '/lessons/intro-to-python', slug will be 'intro-to-python'.
   */
  const { slug } = useParams();

  /**
   * TERMINOLOGY: useState() (React Hook)
   * This is how React "remembers" things.
   * 'lesson' stores the current data, 'setLesson' is the only way to update it.
   * When you call setLesson, React automatically RE-RENDERS (refreshes) the UI.
   */
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * TERMINOLOGY: Custom Hook (useTeachingState)
   * This pulls "Global State" from our TeachingContext.
   * It's like a radio tuned to a specific station that everyone can hear.
   */
  const {
    isActive, currentStep, isAdminMode,
    setIsSpeaking, mode, isPaused,
    setActiveLesson, continueTeaching, activeLesson, jumpToStep,
    isEnglish, setIsEnglish, isSidebarCollapsed
  } = useTeachingState();

  /**
   * TERMINOLOGY DEEP-DIVE: useRef()
   * -------------------------------
   * Analogy: "Whiteboard vs. Sticky Note"
   * 
   * 1. useState (The Whiteboard): Every time you change it, React stops everything and 
   *    re-renders the whole page to show the change.
   * 
   * 2. useRef (The Sticky Note): You can change its value (in .current) as much as you want, 
   *    and React will NOT re-render. It stays in your "pocket" across renders.
   * 
   * WHY USE IT HERE?
   * We store our Audio object in a Ref because if we used State, every time the audio 
   * started, React would refresh the page, which would create a NEW audio object, 
   * starting a never-ending loop of multiple voices playing at once!
   * 
   * useRef keeps the SAME audio object alive and stable throughout the lesson.
   */
  const audioRef = useRef(null);

  const autoAdvance = (block) => {
    if (!isActive) return;
    const nextIdx = currentStep + 1;
    if (!activeLesson || nextIdx >= activeLesson.blocks.length) return;
    setTimeout(() => continueTeaching(), 400);
  };

  /**
   * TERMINOLOGY: useEffect() (React Hook)
   * This handles "Side Effects" (things that happen outside of React).
   * Here, we use it to FETCH data from the Backend Server.
   * The [] at the end means "only run this once when the page first loads".
   */
  useEffect(() => {
    // fetch() is a standard web tool to make API calls to your Node/Express server.
    fetch(`${API_URL}/api/lessons`, { cache: 'no-store' })
      .then(res => res.json()) // Convert the raw response into a Javascript Object (JSON)
      .then(data => {
        if (Array.isArray(data)) setLessons(data);
      })
      .catch(err => console.error(err));
  }, [slug]);

  /**
   * TERMINOLOGY: Dependency Array [slug, setActiveLesson]
   * This useEffect runs every time the 'slug' (the lesson name in the URL) changes.
   */
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/lessons/${slug}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setLesson(data);
          setActiveLesson(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    /**
     * TERMINOLOGY: localStorage (Browser API)
     * This is a small database inside the user's browser.
     * We use it to store who is logged in so they don't have to login every time.
     */
    const studentData = JSON.parse(localStorage.getItem('studentData'));
    if (studentData && slug) {
      // Sending a POST request to update progress in MongoDB
      fetch(`${API_URL}/api/student/update-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentData.email, lessonSlug: slug })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const updatedData = { ...studentData, completedLessons: data.completedLessons };
            localStorage.setItem('studentData', JSON.stringify(updatedData));
          }
        });
    }
  }, [slug, setActiveLesson]);

  // Logic to find Previous and Next lessons for the footer
  const courseLessons = lessons
    .filter(l => l.course === lesson?.course)
    .sort((a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0));

  const currentIdx = courseLessons.findIndex(l => l.slug === slug);
  const prevLesson = currentIdx > 0 ? courseLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < courseLessons.length - 1 ? courseLessons[currentIdx + 1] : null;

  // 3. AUDIO SYNCHRONIZATION LOGIC
  // This useEffect runs every time the 'currentStep' or 'mode' changes.
  useEffect(() => {
    // Stop any current audio before playing new one
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    // Only play if AI is active and in "EXPLAINING" mode
    if (!isActive || !lesson || (mode !== 'EXPLAINING' && mode !== 'EXPLAINING_CODE')) {
      setIsSpeaking(false);
      return;
    }

    const block = lesson.blocks[currentStep];
    const script = isEnglish ? block?.englishTeachingScript : block?.teachingScript;

    if (!script || !script.fileName) {
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    // Construct the URL for the audio file stored in MongoDB
    const finalAudioUrl = `${API_URL}/api/audio-db/${script.fileName}`;

    const audio = new Audio(finalAudioUrl);
    audioRef.current = audio;

    if (!isPaused) {
      audio.play().catch(() => {
        // Fallback: If audio fails, wait for the estimated duration and move on.
        setTimeout(() => {
          if (audioRef.current === audio) {
            setIsSpeaking(false);
            autoAdvance(block);
          }
        }, script.duration || 3000);
      });
    }

    // When audio finishes, stop speaking and move to next block
    audio.addEventListener('ended', () => {
      setIsSpeaking(false);
      autoAdvance(block);
    });

    audio.addEventListener('error', () => setIsSpeaking(false));

  }, [isActive, mode, currentStep, lesson, setIsSpeaking, isEnglish]);

  // Handle Pause/Resume for audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPaused) audio.pause();
    else if (isActive) audio.play().catch(() => { });
  }, [isPaused, isActive]);

  // Cleanup: Stop audio if the user leaves the page
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
    };
  }, [setIsSpeaking]);

  // --- RENDERING ---

  if (loading && !lesson) {
    return <div className="p-24 animate-pulse">Loading Lesson...</div>;
  }

  if (!lesson) {
    return <div className="p-24 text-center">Lesson not found.</div>;
  }

  return (
    <div className={clsx(
      "p-8 pt-12 md:p-16 relative w-full transition-all duration-500",
      isSidebarCollapsed ? "max-w-[1400px]" : "max-w-5xl",
      "mx-auto"
    )}>

      {/* 1. Header: Chapter Title and Language Switcher */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">
            CHAPTER {String(lesson.chapterOrder || (currentIdx + 1)).padStart(2, '0')}
          </span>

          {/* Language Switcher: Toggle between English and Hinglish */}
          <button
            onClick={() => setIsEnglish(!isEnglish)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border-2 border-slate-200"
          >
            <Sparkles size={14} />
            {isEnglish ? "Hinglish Mode" : "English Mode"}
          </button>
        </div>

        {/* Lesson Main Title */}
        {lesson.blocks[0] && (
          <TeachingHighlighter stepIndex={0} noIndicator={true}>
            <h1 className={clsx(
              "text-4xl md:text-5xl font-black text-slate-900 leading-tight transition-all",
              (isActive && currentStep === 0) ? "text-blue-600 scale-[1.01]" : ""
            )}
            >
              {(isEnglish && lesson.blocks[0].englishText) ? lesson.blocks[0].englishText : lesson.blocks[0].visibleText}
            </h1>
          </TeachingHighlighter>
        )}
      </header>

      {/* 2. Content Blocks: Text Paragraphs and Code Blocks */}
      <div className="space-y-8">
        {lesson.blocks.slice(1).map((block, idx) => {
          const actualStep = idx + 1; // Correct index for teaching state
          const isCurrentBlock = isActive && currentStep === actualStep;

          // IF BLOCK IS CODE: Render the interactive editor
          if (block.type === 'code') {
            return (
              <div key={block.id} onClick={() => isActive && jumpToStep(actualStep)}>
                <TeachingHighlighter stepIndex={actualStep} hasCodeBlock={true}>
                  <CodeBlock
                    visibleText={block.visibleText}
                    language={block.language || 'html'}
                    stepIndex={actualStep}
                  />
                </TeachingHighlighter>
              </div>
            );
          }

          // IF BLOCK IS TEXT: Render normal paragraph
          return (
            <div key={block.id} onClick={() => isActive && jumpToStep(actualStep)}>
              <TeachingHighlighter stepIndex={actualStep}>
                <p className={clsx(
                  "text-xl leading-relaxed transition-all duration-500",
                  isCurrentBlock ? "text-slate-900 font-bold" : "text-slate-700 font-medium"
                )}>
                  <KaraokeText
                    text={(isEnglish && block.englishText) ? block.englishText : block.visibleText}
                    isCurrentStep={isCurrentBlock}
                  />
                </p>
              </TeachingHighlighter>
            </div>
          );
        })}
      </div>

      {/* 3. Practice CTA: Shown at the end of the lesson */}
      <div className="mt-24 p-8 bg-emerald-50 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Zap className="text-emerald-500" size={32} />
          <div>
            <h3 className="text-lg font-black uppercase">Ready for Practice?</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Test what you just learned</p>
          </div>
        </div>
        <Link to={`/practice/${lesson.course}/${lesson.topic}`} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px]">
          Start Exercise
        </Link>
      </div>

      {/* 4. Navigation Footer: Prev/Next Lesson links */}
      <footer className="mt-20 pt-8 border-t flex justify-between">
        {prevLesson && (
          <Link to={`/lessons/${prevLesson.slug}`} className="flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} /> <span>{prevLesson.title}</span>
          </Link>
        )}
        <div className="flex-1" />
        {nextLesson && (
          <Link to={`/lessons/${nextLesson.slug}`} className="flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors flex-row-reverse">
            <ArrowRight size={16} /> <span>{nextLesson.title}</span>
          </Link>
        )}
      </footer>
    </div>
  );
}
