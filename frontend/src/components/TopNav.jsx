import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Code2, Sparkles, Moon, Sun, ArrowRight, User, Ban, LogOut, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTeachingState } from '../contexts/TeachingContext';
import clsx from 'clsx';
import { API_URL } from '../config';

function NavLink({ to, label }) {
  return (
    <Link
      to={to}
      className="px-4 py-2 rounded-full text-[13px] font-bold text-slate-600 hover:text-black hover:bg-slate-100 transition-all duration-300 whitespace-nowrap"
    >
      {label}
    </Link>
  );
}

export default function TopNav() {
  const { isActive, startTeaching, activeLesson, continueTeaching, isEnglish } = useTeachingState();
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/topics`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTopics(data);
        else setTopics([]);
      })
      .catch(err => console.error('Error fetching topics:', err));

    fetch(`${API_URL}/api/lessons`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLessons(data);
        else setLessons([]);
      })
      .catch(err => console.error('Error fetching lessons:', err));
  }, [location.pathname]);

  const getFirstLessonSlug = (courseName) => {
    const courseLessons = lessons.filter(l => l.course === courseName);
    if (courseLessons.length > 0) {
      return courseLessons.sort((a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0))[0].slug;
    }
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentData');
    window.location.href = '/';
  };

  return (
    <nav className="sticky top-0 h-16 bg-white border-b border-slate-200 z-[100] flex items-center px-4 md:px-10 justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">

      <div className="flex items-center shrink-0">
        <Link to="/" className="flex items-center gap-3 group mr-4 shrink-0 flex-shrink-0">
          <div className="w-10 h-10 rounded-[14px] bg-blue-50/50 border border-blue-100 flex items-center justify-center p-2.5 group-hover:bg-blue-50 transition-colors">
            <Code2 className="text-blue-600" size={22} />
          </div>
          <span className="text-base sm:text-lg font-outfit font-black text-slate-900 tracking-tighter uppercase tracking-[0.08em]">SUMMERCODE</span>
        </Link>
        
        {/* Slidable Topics Container - Loading from DB */}
        <div className="hidden md:flex items-center max-w-[500px] ml-4 relative group">
          <div className="bg-white border border-slate-200 rounded-full p-1 w-full flex items-center relative overflow-hidden shadow-sm">
            <div className="absolute left-1 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft size={14} className="text-slate-400" />
            </div>
            
            <div 
              className="flex items-center gap-1 overflow-x-auto no-scrollbar px-6 py-0.5 scroll-smooth flex-1"
              style={{
                maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
              }}
            >
              {topics.map((topic) => {
                const slug = getFirstLessonSlug(topic.name);
                const isNavigable = topic.status === 'Active' && slug;

                return (
                  <Link
                    key={topic.id}
                    to={isNavigable ? `/lessons/${slug}` : '#'}
                    onClick={(e) => !isNavigable && e.preventDefault()}
                    className={clsx(
                      "px-4 py-1 rounded-full text-[12px] font-bold transition-all duration-300 whitespace-nowrap",
                      isNavigable
                        ? "text-slate-600 hover:text-black hover:bg-slate-50"
                        : "text-slate-400 cursor-not-allowed opacity-60"
                    )}
                  >
                    {topic.name}
                  </Link>
                );
              })}
            </div>

            <div className="absolute right-1 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight size={14} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Links - Centered */}
      <div className="hidden lg:flex items-center gap-1 mx-auto">
        <NavLink to="/" label="Home" />
        <NavLink to="/courses" label="Courses" />
        <NavLink to="/practice" label="Practice" />
        <NavLink to="/certificates" label="Certificates" />
      </div>

      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
        {(activeLesson && location.pathname.startsWith('/lessons/')) && (() => {
          // We allow starting teaching even if some audio is missing (it will fallback to timer)
          // but we only show the button if there is a lesson and we are on a lesson page.

          return (
            <button
              onClick={!isActive ? () => startTeaching(activeLesson) : undefined}
              className={clsx(
                "hidden md:flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 shadow-sm",
                isActive 
                  ? "bg-slate-100 text-slate-400 cursor-default border border-slate-200" 
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              )}
            >
              <Sparkles size={16} className={clsx(isActive ? "text-slate-300" : "text-yellow-400")} />
              <span className="hidden lg:inline">{isActive ? "Teaching Active" : "Start Guided Teaching"}</span>
              <span className="lg:hidden">{isActive ? "Active" : "Start Teaching"}</span>
            </button>
          );
        })()}
        {localStorage.getItem('adminToken') || localStorage.getItem('studentToken') ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={clsx(
                "w-10 h-10 rounded-full border transition-all duration-300 flex items-center justify-center p-0",
                isUserMenuOpen 
                  ? "bg-slate-50 border-blue-200 shadow-md ring-2 ring-blue-100" 
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-[#edf2f7] flex items-center justify-center">
                <User size={18} className="text-[#2563eb]" />
              </div>
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 animate-entrance overflow-hidden">

                  <Link 
                    to="/profile" 
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-wider hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <User size={14} className="text-blue-500" />
                      <span>My Profile</span>
                    </div>
                    <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                  <div className="h-[1px] bg-slate-100 my-1 mx-2" />
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-slate-500 hover:text-red-600 uppercase tracking-wider hover:bg-red-50 transition-all"
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link to="/login" className="text-slate-600 hover:text-slate-900 px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all active:scale-95 flex items-center group">
            Login
            {location.pathname === '/' && <ArrowRight size={14} className="ml-1.5 transition-transform group-hover:translate-x-0.5" />}
          </Link>
        )}
      </div>
    </nav>
  );
}
