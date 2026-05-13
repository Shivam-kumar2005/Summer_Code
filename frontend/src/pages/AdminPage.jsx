import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Code2, Plus, Trash2, Edit3, GripVertical,
  BookOpen, LayoutDashboard, LogOut, Eye, ChevronRight,
  Sparkles, AlertCircle, CheckCircle2, Loader2, Music,
  Layers, Cpu, MousePointer2, X, Settings, HelpCircle
} from 'lucide-react';
import clsx from 'clsx';
import { API_URL } from '../config';
const API = API_URL;

export default function AdminPage() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState('All');
  const [dragIdx, setDragIdx] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [courses, setCourses] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [editingTopic, setEditingTopic] = useState(null);
  const [credits, setCredits] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Fetch Lessons
    setLoading(true);
    fetch(`${API}/api/lessons`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLessons(data);
        } else {
          setLessons([]);
          if (data.error) showToast(data.error, 'error');
        }
        setLoading(false);
      })
      .catch(() => { showToast('Could not connect to server', 'error'); setLoading(false); });

    // Fetch Topics
    fetch(`${API}/api/topics`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllTopics(data);
          setCourses(data.map(t => t.name));
        } else {
          setAllTopics([]);
          setCourses([]);
        }
      })
      .catch(console.error);

    // Fetch Credits
    fetch(`${API}/api/admin/elevenlabs-credits`)
      .then(r => r.json())
      .then(data => {
        if (data.remaining !== undefined) {
          setCredits(data);
        } else if (data.error && data.error.includes('permissions')) {
          setCredits({ error: 'No Permission' });
        }
      })
      .catch(console.error);
  }, []);

  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  const handleAddTopic = async (e) => {
    e.preventDefault();
    const name = newTopicName.trim();
    if (!name) return;
    if (courses.includes(name)) {
      showToast(`Course "${name}" already exists!`, 'error');
      return;
    }

    const newTopic = {
      id: name,
      name: name,
      subtitle: 'New Course',
      description: 'Landing page description for this course.',
      status: 'Coming Soon',
      icon: 'Code2'
    };

    try {
      const res = await fetch(`${API_URL}/api/admin/save-topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTopic)
      });
      const data = await res.json();
      if (data.success) {
        setAllTopics(prev => [...prev, newTopic]);
        setCourses(prev => [...prev, name]);
        showToast(`Course "${name}" saved permanently`);
        setNewTopicName('');
        setIsAddingTopic(false);
      }
    } catch {
      showToast('Failed to save course', 'error');
    }
  };

  const handleDeleteTopic = async (topicName) => {
    if (!window.confirm(`Delete the "${topicName}" course and all its landing page metadata?`)) return;

    try {
      const res = await fetch(`${API}/api/admin/delete-topic/${topicName}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCourses(prev => prev.filter(c => c !== topicName));
        setAllTopics(prev => prev.filter(t => t.id !== topicName));
        if (activeCourse === topicName) setActiveCourse('All');
        showToast(`Course "${topicName}" deleted safely`);
      }
    } catch {
      showToast('Failed to delete course', 'error');
    }
  };

  const filteredLessons = activeCourse === 'All'
    ? lessons
    : lessons.filter(l => l.course === activeCourse);

  const handleDelete = async (slug) => {
    if (!window.confirm('Delete this lesson? This cannot be undone.')) return;
    setDeleting(slug);
    try {
      const res = await fetch(`${API}/api/admin/delete-lesson/${slug}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setLessons(prev => prev.filter(l => l.slug !== slug));
        showToast('Lesson deleted');
      } else {
        showToast('Failed to delete', 'error');
      }
    } catch (e) {
      showToast('Error deleting lesson', 'error');
    }
    setDeleting(null);
  };

  const stats = {
    totalChapters: Array.isArray(lessons) ? lessons.length : 0,
    totalBlocks: Array.isArray(lessons) ? lessons.reduce((acc, l) => acc + (l.blocks?.length || 0), 0) : 0,
    activeCourses: Array.isArray(allTopics) ? allTopics.length : 0,
    audioClips: Array.isArray(lessons) ? lessons.reduce((acc, l) => {
      const audioCount = (l.blocks || []).filter(b => b.teachingScript?.audioUrl).length;
      return acc + audioCount;
    }, 0) : 0
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans selection:bg-blue-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed top-0 left-0 h-screen z-40 shadow-sm">
        <div className="p-6 border-b border-slate-100 mb-2">
          <Link to="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-[14px] bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <Code2 className="text-slate-700" size={22} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 tracking-tighter uppercase leading-none mb-1">SUMMERCODE</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Admin Studio</p>
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">DASHBOARD</p>
          <SideItem icon={<LayoutDashboard size={18} />} label="Overview" active={activeCourse === 'All'} onClick={() => setActiveCourse('All')} />
          <SideItem 
            icon={<HelpCircle size={18} />} 
            label="Practice Questions" 
            active={false} 
            onClick={() => navigate('/admin/practice')} 
          />

          <div className="h-px bg-slate-100 my-4 mx-3" />

          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">FILTER BY COURSE</p>
            <button
              onClick={() => setIsAddingTopic(!isAddingTopic)}
              className={clsx(
                "p-1 rounded-md transition-all",
                isAddingTopic ? "bg-slate-100 text-red-500 hover:text-red-700" : "text-slate-400 hover:text-blue-600 hover:bg-slate-50"
              )}
              title={isAddingTopic ? "Cancel" : "Add New Course"}
            >
              {isAddingTopic ? <X size={14} /> : <Plus size={14} />}
            </button>
          </div>

          {isAddingTopic && (
            <form onSubmit={handleAddTopic} className="px-3 mb-4 animate-in slide-in-from-top-2 duration-300">
              <div className="relative group">
                <input
                  autoFocus
                  type="text"
                  placeholder="Course name..."
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-all shadow-sm"
                />
                <button type="submit" className="absolute right-1 top-1 p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-col gap-1">
            {courses.map(c => (
              <SideItem
                key={c}
                icon={<BookOpen size={16} />}
                label={c}
                active={activeCourse === c}
                onClick={() => setActiveCourse(c)}
                onDelete={null} // Removed from here
              />
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-slate-500 hover:text-blue-600 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <Eye size={16} /> Preview Site
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('adminToken');
              navigate('/login');
            }}
            className="w-full flex items-center gap-2.5 text-slate-500 hover:text-red-500 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all mt-1"
          >
            <LogOut size={16} /> Exit Admin
          </button>

        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              {activeCourse === 'All' ? 'Platform Overview' : `${activeCourse} Content`}
              {activeCourse !== 'All' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const t = allTopics.find(x => x.name === activeCourse);
                      setEditingTopic(t || { id: activeCourse, name: activeCourse, subtitle: '', description: '', status: 'Active', icon: 'Code2' });
                    }}
                    className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm"
                    title="Course Settings"
                  >
                    <Settings size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTopic(activeCourse)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 transition-all border border-slate-100 shadow-sm"
                    title={`Delete ${activeCourse}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium tracking-tight whitespace-nowrap">Manage your courses, edit content and teaching scripts ⚡</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/lesson/new', { state: { topic: activeCourse === 'All' ? '' : activeCourse } })}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-100 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={18} /> New Lesson
            </button>
          </div>
        </header>

        <main className="p-10 flex-1">
          {activeCourse === 'All' ? (
            <div className="flex flex-col gap-10 animate-entrance">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard label="Active Courses" value={stats.activeCourses} icon={<Layers size={20} />} color="violet" />
                {credits && (
                  <StatCard 
                    label="11 Lab Audio Generation Credit" 
                    value={credits.error ? 'Permission Required' : `${credits.remaining?.toLocaleString() ?? '0'} / ${credits.total?.toLocaleString() ?? '0'}`} 
                    icon={<Music size={20} />} 
                    color={credits.error ? 'orange' : 'emerald'} 
                    subtext={credits.resetDate ? `Renews on: ${new Date(credits.resetDate * 1000).toLocaleDateString()}` : null}
                  />
                )}
              </div>
            </div>
          ) : (
            <LessonGrid
              lessons={filteredLessons}
              deleting={deleting}
              handleDelete={handleDelete}
              loading={loading}
              navigate={navigate}
              activeCourse={activeCourse}
            />
          )}
        </main>

      </div>

      {/* Modern Toast Notification */}
      {toast && (
        <div className={`fixed bottom-10 right-10 z-[100] flex items-center gap-3 px-6 py-4 rounded-[2rem] text-sm font-bold shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500 border-2 ${toast.type === 'error' ? 'bg-white border-red-100 text-red-600' : 'bg-white border-blue-100 text-blue-600'
          }`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          {toast.msg}
        </div>
      )}
      {/* Topic Settings Modal */}
      {editingTopic && (
        <TopicSettingsModal
          topic={editingTopic}
          onClose={() => setEditingTopic(null)}
          onSave={(updated) => {
            fetch(`${API}/api/admin/save-topic`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updated)
            }).then(() => {
              setAllTopics(prev => prev.map(t => t.id === updated.id ? updated : t));
              setCourses(prev => prev.map(c => c === editingTopic.name ? updated.name : c));
              showToast('Course settings updated');
              setEditingTopic(null);
            }).catch(() => showToast('Failed to save settings', 'error'));
          }}
        />
      )}
    </div>
  );
}

function SideItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm transition-all duration-300",
        active
          ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 translate-x-1"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold"
      )}
    >
      <span className={clsx("transition-transform duration-300", active ? "scale-110" : "")}>{icon}</span>
      {label}
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
    </button>
  );
}

function TopicSettingsModal({ topic, onClose, onSave }) {
  const [data, setData] = useState(topic);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden border border-slate-100 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">Course Settings</h3>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none">Displayed on landing page in course overview</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 no-scrollbar">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Display Name</label>
            <input
              value={data.name}
              onChange={e => setData({ ...data, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subtitle</label>
            <input
              value={data.subtitle}
              placeholder="e.g. Modern Basics"
              onChange={e => setData({ ...data, subtitle: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
            <select
              value={data.status}
              onChange={e => setData({ ...data, status: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="Active">Active</option>
              <option value="Coming Soon">Coming Soon</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
            <textarea
              value={data.description}
              rows={4}
              onChange={e => setData({ ...data, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Icon Type</label>
            <select
              value={data.icon}
              onChange={e => setData({ ...data, icon: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="Code2">Code (HTML)</option>
              <option value="Layers">Layers (CSS)</option>
              <option value="Cpu">CPU (JS/Logic)</option>
              <option value="MousePointer2">Pointer (DOM)</option>
              <option value="Sparkles">Sparkles (Git/Data)</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => onSave(data)}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl text-sm font-black transition-all shadow-xl shadow-blue-100"
        >
          Save Topic Settings
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, subtext }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };
  return (
    <div className="bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col gap-4 transition-all hover:border-slate-200 group">
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900 leading-tight tracking-tighter">{value}</p>
        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{label}</p>
        {subtext && (
          <p className="text-[10px] font-bold text-blue-500 mt-2 bg-blue-50/50 px-3 py-1 rounded-full inline-block">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

function LessonGrid({ lessons, loading, deleting, handleDelete, navigate, activeCourse }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-sm font-bold uppercase tracking-widest">Loading Catalog...</p>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center border-2 border-dashed border-slate-200 rounded-[4rem] bg-white animate-entrance">
        <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center mb-6">
          <Sparkles size={40} className="text-blue-600 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Pehla Lesson Create Karein</h3>
        <p className="text-slate-500 max-w-sm mb-10 font-medium leading-relaxed">
          Is course mein abhi tak koi chapters add nahi hue hain. Abhi shuru karein!
        </p>
        <button
          onClick={() => navigate('/admin/lesson/new', { state: { topic: activeCourse } })}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[2rem] text-sm font-black transition-all shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-95 uppercase tracking-widest"
        >
          <Plus size={20} /> Create New Lesson
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-entrance">
      {lessons.map((lesson, idx) => (
        <div
          key={lesson.slug}
          className="group bg-white border border-slate-200 rounded-[2.5rem] p-7 flex items-center gap-6 hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/5 relative overflow-hidden"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter leading-none mb-1">CH.</span>
            <span className="text-blue-600 font-black text-xl leading-none">{lesson.chapterOrder || idx + 1}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md uppercase tracking-wider">{lesson.course || 'HTML'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lesson.blocks?.length || 0} BLOCKS</span>
            </div>
            <h2 className="font-extrabold text-slate-900 text-xl truncate tracking-tight">{lesson.title}</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium truncate italic">/{lesson.slug}</p>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
            <Link
              to={`/lessons/${lesson.slug}`}
              target="_blank"
              className="p-3 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-100"
              title="Live Preview"
            >
              <Eye size={18} />
            </Link>
            <button
              onClick={() => navigate(`/admin/lesson/${lesson.slug}`)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Edit3 size={15} /> EDIT
            </button>
            <button
              onClick={() => handleDelete(lesson.slug)}
              disabled={deleting === lesson.slug}
              className="p-3 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50 border border-slate-100"
              title="Delete"
            >
              {deleting === lesson.slug
                ? <Loader2 size={18} className="animate-spin" />
                : <Trash2 size={18} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
