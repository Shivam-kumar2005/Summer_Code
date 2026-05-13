/**
 * ==========================================
 * NAVIGATION SIDEBAR - Sidebar.jsx
 * ==========================================
 * This component handles the list of lessons on the left side of the screen.
 * It's dynamic—it changes its list based on which course you are currently studying.
 */

import React, { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom'; // Tools for links and URL reading
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import clsx from 'clsx';
import { useTeachingState } from '../contexts/TeachingContext'; // AI State for mobile toggle
import { API_URL } from '../config';

export default function Sidebar({ collapsed, setCollapsed }) {
  // Pulling 'isSidebarOpen' to handle mobile "drawer" behavior
  const { isSidebarOpen, setIsSidebarOpen } = useTeachingState();
  const [lessons, setLessons] = useState([]); // All lessons from DB
  const [topics, setTopics] = useState([]);   // All course topics (e.g., HTML, Python)
  const { slug } = useParams(); // Current lesson ID from URL

  // 1. FETCH DATA: Get the list of all lessons and courses when sidebar loads
  useEffect(() => {
    fetch(`${API_URL}/api/lessons`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLessons(data);
      });

    fetch(`${API_URL}/api/topics`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTopics(data);
      });
  }, [slug]);

  /**
   * COURSE DETECTION LOGIC
   * We look at the current lesson (from the URL slug) to figure out which 
   * course (HTML, JS, etc.) we should show in the sidebar.
   */
  const currentLesson = lessons.find(l => l.slug === slug);
  const currentCourse = currentLesson?.course || (lessons.length > 0 ? lessons[0].course : 'HTML');

  // Filter lessons to only show the ones belonging to the current course
  const filteredLessons = lessons
    .filter(l => l.course === currentCourse)
    .sort((a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0));

  return (
    <>
      {/* MOBILE BACKDROP: Dim the screen when the sidebar is open on phones */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)} // Close when clicking outside
        />
      )}

      <aside className={clsx(
        "bg-white border-r border-slate-200 flex flex-col fixed left-0 top-16 z-50 transition-all duration-300 ease-in-out h-[calc(100vh-64px)] overflow-y-auto",
        // RESPONSIVE BEHAVIOR:
        // Mobile: Moves in/out based on 'isSidebarOpen'
        // Desktop: Stays visible but can be 'collapsed' to a thin bar
        isSidebarOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full md:translate-x-0",
        collapsed ? "md:w-16" : "md:w-64"
      )}>

        {/* 1. Header: Shows course name and the collapse toggle button */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          {(!collapsed || isSidebarOpen) && (
            <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-[0.1em] text-[13px]">
              {currentCourse}
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-slate-400 bg-slate-50 rounded hidden md:block"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* 2. Lesson List: Using NavLink for automatic "active" styling */}
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          {filteredLessons.map((lesson, idx) => (
            <NavLink
              to={`/lessons/${lesson.slug}`}
              key={lesson.slug}
              title={collapsed ? lesson.title : ''}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                (collapsed && !isSidebarOpen) ? "justify-center" : "",
                // If this link matches the current URL, highlight it
                isActive
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {({ isActive }) => (
                <>
                  {/* Step Number Badge */}
                  <span className={clsx(
                    "w-6 h-6 flex items-center justify-center flex-shrink-0 rounded-full text-[10px] font-medium",
                    isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {idx + 1}
                  </span>

                  {/* Lesson Title (Hidden if collapsed) */}
                  {(!collapsed || isSidebarOpen) && <span className="truncate">{lesson.title}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
