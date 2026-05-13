/**
 * ==========================================
 * UI STRUCTURE - MainLayout.jsx
 * ==========================================
 * This component defines the "Skeleton" of your application.
 * It places the Top Navigation, the Sidebar, and the Teaching Panel
 * in their correct positions.
 */

import React from 'react';
import { useTeachingState } from '../contexts/TeachingContext'; // Accessing global state
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import TeachingPanel from './TeachingPanel';
import clsx from 'clsx'; // A utility to combine CSS classes conditionally
import { Play, ChevronRight, Menu, ArrowRight, Ban } from 'lucide-react'; // Icons

export default function MainLayout({ children }) {
  // Pulling needed data from our "radio station" (Context)
  const { 
    isActive, 
    startTeaching, 
    activeLesson, 
    isSidebarOpen, 
    setIsSidebarOpen, 
    isEnglish, 
    isSidebarCollapsed, 
    setIsSidebarCollapsed 
  } = useTeachingState();

  // --- MOBILE SWIPE LOGIC ---
  // These variables help detect if a user swipes their finger on a phone screen.
  const [touchStart, setTouchStart] = React.useState(null);
  const [touchEnd, setTouchEnd] = React.useState(null);
  const minSwipeDistance = 50; // Minimum distance to consider it a "swipe"

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX); // Record where the touch started
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX); // Update where the finger is moving
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // If swiped right near the left edge, open the sidebar.
    if (isRightSwipe && !isSidebarOpen && touchStart < 100) {
      setIsSidebarOpen(true);
    }
    // If swiped left while sidebar is open, close it.
    if (isLeftSwipe && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div
      // Main container: takes full screen height, hides overflow to prevent double scrolling.
      className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Header Area */}
      <TopNav />

      <div className="flex flex-1 overflow-hidden relative">
        {/* 2. Sidebar Area */}
        <Sidebar collapsed={isSidebarCollapsed} setCollapsed={setIsSidebarCollapsed} />

        {/* Mobile Sidebar Reveal Trigger: A small button on the left to help users find the sidebar */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden fixed left-0 top-[20%] w-3 h-20 bg-blue-600 rounded-r-2xl z-40 shadow-[4px_0_15px_-5px_rgba(37,99,235,0.4)] flex items-center justify-center transition-all active:w-6 active:bg-blue-700"
            aria-label="Toggle Sidebar"
          >
            <div className="w-1 h-8 bg-white/50 rounded-full" />
          </button>
        )}

        {/* 3. Main Content Area: This is where pages like LessonPage are displayed ({children}) */}
        <main className={clsx(
          "flex-1 overflow-y-auto w-full transition-all duration-500 bg-slate-50",
          "pl-0",
          // Adjust padding based on whether the sidebar is collapsed or not.
          isSidebarCollapsed ? "md:pl-16" : "md:pl-64",
          "md:pr-[260px]" // Permanently reserve space for the TeachingPanel
        )}>
          {children}
        </main>

        {/* 4. Teaching Panel: The AI character panel on the right side. */}
        <TeachingPanel />

        {/* Mobile FAB (Floating Action Button): 
            Only shows on lesson pages. Helps start the AI teaching on small screens. */}
        {activeLesson && location.pathname.startsWith('/lessons/') && (
          <button
            onClick={(!isActive && !isEnglish) ? () => startTeaching(activeLesson) : undefined}
            className={clsx(
              "md:hidden fixed bottom-6 right-6 rounded-full px-5 py-2.5 shadow-2xl z-40 flex items-center gap-2 font-bold text-[11px] tracking-wider uppercase border-b-2 transition-all active:scale-95",
              isActive 
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-default" 
                : isEnglish
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-80"
                  : "bg-blue-600 text-white border-blue-800 animate-pulse"
            )}
            title={isEnglish ? "Guided teaching is not available in English mode" : ""}
          >
            {isEnglish ? (
              <>
                <Ban size={14} />
                Unavailable
              </>
            ) : (
              <>
                <Play fill="currentColor" size={14} className={clsx(isActive ? "text-slate-300" : "text-white")} />
                {isActive ? "Active" : "Teach"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
