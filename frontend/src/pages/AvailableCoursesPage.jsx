import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, ArrowRight, Layers } from 'lucide-react';
import { API_URL } from '../config';

export default function AvailableCoursesPage() {
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/topics`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setTopics(data);
        else setTopics([]);
      })
      .catch(console.error);

    fetch(`${API_URL}/api/lessons`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setLessons(data);
        else setLessons([]);
      })
      .catch(console.error);
  }, []);

  const getFirstLessonSlug = (courseName) => {
    const courseLessons = lessons.filter(l => l.course === courseName);
    if (courseLessons.length > 0) {
      return courseLessons.sort((a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0))[0].slug;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f4ecea] flex flex-col font-sans">

      {/* Hero Header */}
      <header className="pt-32 pb-20 px-6 text-left max-w-7xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Explore Our Courses
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl font-medium">
          Coding ab Hinglish mein! Hamare expert-led courses ke saath apni programming journey aaj hi shuru karein.
        </p>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-6 pb-32 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {topics.map((course) => {
            const firstSlug = getFirstLessonSlug(course.name);
            const isActive = course.status === 'Active' && firstSlug;
            const description = course.name === 'HTML' 
              ? "Web ki basic foundation aur architecture seekhein hamare interactive mode ke saath." 
              : (course.description || `Master the essentials of ${course.name} from scratch with hands-on practice.`);
            
            return (
              <div key={course.id || course.name} className={`h-full ${!isActive ? 'opacity-75' : ''}`}>
                <Link 
                  to={isActive ? `/lessons/${firstSlug}` : '#'}
                  onClick={(e) => !isActive && e.preventDefault()}
                  className={`group relative h-full flex flex-col bg-slate-50 rounded-[3rem] p-12 border border-slate-200/50 transition-all duration-500 overflow-hidden ${isActive ? 'hover:border-slate-900/20 hover:shadow-[0_30px_60px_-15px_rgba(15,23,42,0.1)]' : 'cursor-not-allowed'}`}
                >
                  {/* Decorative background element */}
                  <div className="absolute -right-8 -top-8 w-40 h-40 bg-slate-900/[0.03] rounded-full blur-3xl group-hover:bg-slate-900/[0.05] transition-all duration-500" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-10">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 transition-all duration-300 ${isActive ? 'bg-white group-hover:bg-slate-900 group-hover:text-white group-hover:scale-110' : 'bg-slate-100 text-slate-400'}`}>
                        <Layers size={28} />
                      </div>
                      
                      {isActive ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 bg-slate-200 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-300">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <h3 className={`text-3xl font-black mb-6 transition-colors ${isActive ? 'text-slate-800 group-hover:text-slate-900' : 'text-slate-400'}`}>{course.name}</h3>
                      <p className={`font-medium leading-relaxed mb-10 ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                        {description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-10 border-t border-slate-200/50">
                      <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-slate-400' : 'text-slate-300'}`}>
                        {lessons.filter(l => l.course === course.name).length} Chapters
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform shadow-lg ${isActive ? 'bg-slate-900 text-white group-hover:translate-x-2' : 'bg-slate-200 text-slate-400'}`}>
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </main>

      {/* Simple Compact Footer */}
      <footer className="bg-[#282a36] text-white py-12 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:items-start items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Code2 className="text-white" size={24} />
              </div>
              <span className="text-lg font-black tracking-widest uppercase font-outfit">SUMMERCODE</span>
            </Link>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              &copy; 2026 SummerCode. Built in India.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {[
              { label: "Courses", href: "/courses" },
              { label: "Admin", href: "/admin" },
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" }
            ].map(item => (
              <Link key={item.label} to={item.href} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
