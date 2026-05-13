import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, BookOpen, Clock, Award, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config';
import clsx from 'clsx';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const studentData = JSON.parse(localStorage.getItem('studentData'));
    if (!studentData) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [profileRes, lessonsRes] = await Promise.all([
          fetch(`${API_URL}/api/student/profile/${studentData.email}`),
          fetch(`${API_URL}/api/lessons`)
        ]);

        const profileData = await profileRes.json();
        const lessonsData = await lessonsRes.json();

        if (profileData.success) {
          setUser(profileData.user);
        }
        setLessons(lessonsData);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentData');
    navigate('/');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] dark:bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const completedLessonsData = lessons.filter(l => user?.completedLessons?.includes(l.slug));
  const progressPercentage = lessons.length > 0 ? Math.round((completedLessonsData.length / lessons.length) * 100) : 0;

  // Course colors map
  const courseColors = {
    'HTML': 'emerald',
    'CSS': 'indigo',
    'Javascript': 'amber',
    'DOM': 'rose',
    'Other': 'slate'
  };

  const getColors = (course) => {
    const c = courseColors[course] || courseColors.Other;
    const maps = {
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', bar: 'bg-emerald-500', glow: 'shadow-emerald-100' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', bar: 'bg-indigo-500', glow: 'shadow-indigo-100' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', bar: 'bg-amber-500', glow: 'shadow-amber-100' },
      rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', bar: 'bg-rose-500', glow: 'shadow-rose-100' },
      slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', bar: 'bg-slate-500', glow: 'shadow-slate-100' },
    };
    return maps[c];
  };

  // Calculate course-wise progress
  const coursesProgress = lessons.reduce((acc, lesson) => {
    const courseName = lesson.course || 'Other';
    if (!acc[courseName]) {
      acc[courseName] = { total: 0, completed: 0 };
    }
    acc[courseName].total += 1;
    if (user?.completedLessons?.includes(lesson.slug)) {
      acc[courseName].completed += 1;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#fafaf9] relative overflow-hidden font-sans selection:bg-blue-100 pb-20">
      {/* Background Decorative Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 pt-24 space-y-16 relative z-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 pb-12">
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="w-28 h-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 p-1">
              <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-[2.2rem] flex items-center justify-center">
                <User size={48} strokeWidth={1.5} />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
                {user?.name || 'Student Name'}
              </h1>
              <div className="flex flex-col md:flex-row items-center gap-3">
                <p className="text-slate-500 font-bold text-lg tracking-tight">
                  {user?.email || 'email@example.com'}
                </p>
                <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  Pro Learner
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-all bg-white border border-slate-200 px-6 py-3 rounded-2xl hover:border-red-100 hover:bg-red-50 hover:shadow-lg hover:shadow-red-50"
          >
            <LogOut size={14} />
            Logout session
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group hover:border-blue-200 transition-all">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <Award size={24} />
            </div>
            <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{progressPercentage}%</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Global Progress</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group hover:border-emerald-200 transition-all">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{completedLessonsData.length}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Chapters Mastery</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group hover:border-amber-200 transition-all hidden lg:block">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <BookOpen size={24} />
            </div>
            <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{Object.keys(coursesProgress).length}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Courses</p>
          </div>
        </div>

        {/* Course Progress Dashboard */}
        <div className="space-y-12">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase whitespace-nowrap">Learning Paths</h2>
            <div className="h-px bg-slate-200/60 w-full" />
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {Object.entries(coursesProgress).map(([course, data]) => {
              const perc = Math.round((data.completed / data.total) * 100);
              const colors = getColors(course);
              
              const courseLessons = lessons
                .filter(l => l.course === course)
                .sort((a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0));
              
              const nextLesson = courseLessons.find(l => !user?.completedLessons?.includes(l.slug)) || courseLessons[0];

              return (
                <div key={course} className="group bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-10 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                  <div className="flex-1 w-full space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className={clsx("w-2 h-2 rounded-full", colors.bar)} />
                          <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{course}</h3>
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-5">
                          {data.completed} of {data.total} units mastered
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={clsx("text-4xl font-black tracking-tighter", colors.text)}>{perc}%</span>
                      </div>
                    </div>
                    
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className={clsx("h-full transition-all duration-1000 group-hover:opacity-80", colors.bar)} 
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/lessons/${nextLesson?.slug}`)}
                    className={clsx(
                      "shrink-0 w-full md:w-auto text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3",
                      perc === 100 ? "bg-slate-900 hover:bg-black" : `${colors.bar} ${colors.glow} hover:brightness-110`
                    )}
                  >
                    {perc === 100 ? 'Review Mastered' : 'Continue Path'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
