import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { API_URL } from '../config';
import clsx from 'clsx';

export default function PracticeHub() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/topics`)
      .then(res => res.json())
      .then(data => {
        setTopics(data.filter(t => t.status === 'Active'));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafaf9] p-8 md:p-24 font-sans">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="text-center space-y-4">

          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">Practice Hub</h1>
          <p className="text-slate-500 font-medium max-w-lg mx-auto">Select a topic to test your knowledge with interactive challenges and coding tasks.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topics.map(topic => (
            <Link 
              key={topic.id}
              to={`/practice/Course/${topic.id}`}
              className="group bg-white border border-slate-200 rounded-[2.5rem] p-8 flex items-center justify-between hover:border-black hover:shadow-2xl hover:shadow-slate-200/50 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-black group-hover:text-white">
                   <BookOpen size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{topic.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{topic.subtitle}</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-black group-hover:text-white transition-all -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100">
                <ChevronRight size={20} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
