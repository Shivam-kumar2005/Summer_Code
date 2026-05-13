import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical,
  Type, AlignLeft, FileCode2, ChevronDown, ChevronUp,
  Eye, Loader2, CheckCircle2, AlertCircle, Sparkles, X, Music,
  BookOpen, Layers, Play, Pause
} from 'lucide-react';
import clsx from 'clsx';
import { API_URL } from '../config';

const API = API_URL;

const BLOCK_TYPES = [
  { type: 'heading', label: 'Heading', icon: <Type size={16} />, color: 'blue' },
  { type: 'highlightable_text', label: 'Description Text', icon: <AlignLeft size={16} />, color: 'violet' },
  { type: 'code', label: 'Interactive Code Block', icon: <FileCode2 size={16} />, color: 'emerald' },
];

const DEFAULT_COURSES = [];
const LANG_OPTIONS = ['html', 'css', 'javascript', 'python', 'c', 'c++', 'java', 'jsx', 'typescript'];

function makeBlock(type) {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    visibleText: '',
    englishText: '',
    ...(type === 'code' ? { language: 'html' } : {}),
    teachingScript: {
      step: 0,
      transcript: '',
      action: 'speak',
      duration: 3500,
    },
    englishTeachingScript: {
      step: 0,
      transcript: '',
      action: 'speak',
      duration: 3500,
    },
  };
}

const BLOCK_STYLE = {
  heading: { accent: 'bg-blue-600', ring: 'ring-blue-100', bg: 'bg-blue-50/10' },
  highlightable_text: { accent: 'bg-violet-600', ring: 'ring-violet-100', bg: 'bg-violet-50/10' },
  code: { accent: 'bg-emerald-600', ring: 'ring-emerald-100', bg: 'bg-emerald-50/10' },
};

/* ─── Single block editor ─── */
function BlockEditor({ block, idx, total, onChange, onDelete, onMove }) {
  const [open, setOpen] = useState(true);
  const style = BLOCK_STYLE[block.type] || BLOCK_STYLE.heading;

  const set = (key, val) => onChange({ ...block, [key]: val });

  return (
    <div className={clsx(
      "bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 shadow-sm",
      open ? "border-slate-300 ring-4 " + style.ring : "border-slate-200 hover:border-slate-300"
    )}>
      {/* Block Header */}
      <div
        className="flex items-center gap-4 px-6 py-4 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <GripVertical size={18} className="text-slate-300 cursor-grab active:text-slate-600" />
        <div className={clsx("w-3 h-3 rounded-full", style.accent)} />
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          {idx + 1}. {BLOCK_TYPES.find(b => b.type === block.type)?.label ?? block.type}
        </span>

        <div className="flex items-center gap-2 ml-auto">
          <IconBtn disabled={idx === 0} onClick={(e) => { e.stopPropagation(); onMove(idx, idx - 1); }}>
            <ChevronUp size={16} />
          </IconBtn>
          <IconBtn disabled={idx === total - 1} onClick={(e) => { e.stopPropagation(); onMove(idx, idx + 1); }}>
            <ChevronDown size={16} />
          </IconBtn>
          <IconBtn danger onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}>
            <Trash2 size={16} />
          </IconBtn>
          <div className="w-px h-4 bg-slate-100 mx-2" />
          <span className="text-slate-400 transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
            <ChevronDown size={18} />
          </span>
        </div>
      </div>

      {/* Block body */}
      {open && (
        <div className="px-8 pb-8 pt-6 border-t border-slate-100 bg-slate-50/20 space-y-8">
          
          {/* 1. Hinglish Content */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
              <Label>1. Student View (Hinglish Content)</Label>
            </div>
            {block.type === 'code' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editor Language:</span>
                  <select
                    value={block.language || 'html'}
                    onChange={e => set('language', e.target.value)}
                    className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {LANG_OPTIONS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                  </select>
                </div>
                <textarea
                  value={block.visibleText}
                  onChange={e => set('visibleText', e.target.value)}
                  rows={8}
                  className="w-full bg-[#0f172a] border border-white/10 rounded-3xl px-6 py-5 text-sm text-emerald-400 font-mono outline-none focus:ring-4 focus:ring-emerald-500/10 resize-none shadow-2xl"
                />
                {!['html', 'css', 'javascript', 'jsx', 'typescript'].includes(block.language || 'html') && (
                  <div className="pt-4 border-t border-slate-200/50">
                    <Label>Optional: Pre-fill Standard Input (stdin)</Label>
                    <textarea
                      value={block.defaultStdin || ''}
                      onChange={e => set('defaultStdin', e.target.value)}
                      rows={2}
                      placeholder="Enter inputs here (separated by newlines)..."
                      className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm text-slate-700 font-mono outline-none focus:ring-4 focus:ring-blue-500/10 resize-none shadow-sm mt-2"
                    />
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={block.visibleText}
                onChange={e => set('visibleText', e.target.value)}
                rows={block.type === 'heading' ? 2 : 4}
                className="w-full bg-white border border-slate-200 rounded-3xl px-6 py-5 text-base text-slate-800 font-semibold outline-none focus:ring-4 focus:ring-blue-500/5 resize-none shadow-sm transition-all focus:border-blue-400"
              />
            )}
          </div>

          {/* 2. AI Narration */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" />
                <Label>2. Narration Script (Hinglish AI)</Label>
              </div>
              <button
                type="button"
                onClick={async (e) => {
                  const currentBtn = e.currentTarget;
                  if (!block?.teachingScript?.transcript) {
                    alert('Pehle transcript likhein!');
                    return;
                  }
                  try {
                    currentBtn.disabled = true;
                    currentBtn.innerText = 'GENERATING...';
                    
                    const res = await fetch(`${API}/api/admin/generate-audio`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: block.teachingScript.transcript })
                    });
                    const data = await res.json();
                    if (data.success) {
                      set('teachingScript', { 
                        ...block.teachingScript, 
                        audioUrl: data.audioUrl,
                        fileName: data.filename 
                      });
                      if (data.credits) alert(`Success! Credits left: ${data.credits.remaining}`);
                    } else {
                      alert(data.error || 'Failed');
                    }
                  } catch (err) {
                    alert('Server Error');
                  } finally {
                    if (currentBtn) {
                      currentBtn.disabled = false;
                      currentBtn.innerText = 'AI GENERATE';
                    }
                  }
                }}
                className="shrink-0 flex items-center gap-2 text-[10px] font-black bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-all uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50"
              >
                <Sparkles size={14} className="text-blue-400" /> AI GENERATE
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <textarea
                value={block.teachingScript?.transcript || ''}
                onChange={e => {
                  const newScript = { ...block.teachingScript, transcript: e.target.value };
                  set('teachingScript', newScript);
                }}
                placeholder="Write what the AI should speak..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 resize-none italic"
              />
              <div className="flex flex-col justify-center">
                <AudioUploader
                  label="Generated/Uploaded Audio"
                  script={block.teachingScript}
                  onScriptChange={(newScript) => set('teachingScript', newScript)}
                />
              </div>
            </div>
          </div>

          {/* 3. English Content */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
              <Label>3. Student View (English Content)</Label>
            </div>
            <textarea
              value={block.englishText || ''}
              onChange={e => set('englishText', e.target.value)}
              placeholder="English version of this block..."
              rows={block.type === 'heading' ? 2 : 4}
              className="w-full bg-white border border-slate-200 rounded-3xl px-6 py-5 text-base text-slate-800 font-semibold outline-none focus:ring-4 focus:ring-emerald-500/5 resize-none shadow-sm transition-all focus:border-emerald-400"
            />
          </div>

          {/* 4. English AI Narration */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-200" />
                <Label>4. Narration Script (English AI)</Label>
              </div>
              <button
                type="button"
                onClick={async (e) => {
                  const currentBtn = e.currentTarget;
                  if (!block?.englishTeachingScript?.transcript) {
                    alert('Please write a transcript first!');
                    return;
                  }
                  try {
                    currentBtn.disabled = true;
                    currentBtn.innerText = 'GENERATING...';
                    
                    const res = await fetch(`${API}/api/admin/generate-audio`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: block.englishTeachingScript.transcript })
                    });
                    const data = await res.json();
                    if (data.success) {
                      set('englishTeachingScript', { 
                        ...block.englishTeachingScript, 
                        audioUrl: data.audioUrl,
                        fileName: data.filename 
                      });
                      if (data.credits) alert(`Success! Credits left: ${data.credits.remaining}`);
                    } else {
                      alert(data.error || 'Failed');
                    }
                  } catch (err) {
                    alert('Server Error');
                  } finally {
                    if (currentBtn) {
                      currentBtn.disabled = false;
                      currentBtn.innerText = 'AI GENERATE';
                    }
                  }
                }}
                className="shrink-0 flex items-center gap-2 text-[10px] font-black bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-600 transition-all uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50"
              >
                <Sparkles size={14} className="text-emerald-400" /> AI GENERATE
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <textarea
                value={block.englishTeachingScript?.transcript || ''}
                onChange={e => {
                  const newScript = { ...block.englishTeachingScript, transcript: e.target.value };
                  set('englishTeachingScript', newScript);
                }}
                placeholder="Write what the English AI should speak..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/5 resize-none italic"
              />
              <div className="flex flex-col justify-center">
                <AudioUploader
                  label="Generated/Uploaded English Audio"
                  script={block.englishTeachingScript}
                  onScriptChange={(newScript) => set('englishTeachingScript', newScript)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Editor ─── */
export default function AdminLessonEditor() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = slug === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [allLessons, setAllLessons] = useState([]);

  const [lesson, setLesson] = useState({
    id: '',
    slug: '',
    title: '',
    course: location.state?.topic || 'HTML',
    description: '',
    chapterOrder: 1,
    blocks: [],
  });

  const [courseList, setCourseList] = useState(DEFAULT_COURSES);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch(`${API}/api/topics`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCourseList(data.map(t => t.name));
      })
      .catch(console.error);

    fetch(`${API}/api/lessons`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllLessons(data);
          if (!isNew) {
            const l = data.find(l => l.slug === slug);
            if (l) setLesson(l);
          } else {
            // Reset for new lesson
            const course = location.state?.topic || 'HTML';
            const courseLessons = data.filter(l => l.course === course);
            const nextOrder = courseLessons.length > 0 
              ? Math.max(...courseLessons.map(l => l.chapterOrder || 0)) + 1 
              : 1;
              
            setLesson({
              id: '',
              slug: '',
              title: '',
              course: course,
              description: '',
              chapterOrder: nextOrder,
              blocks: [],
            });
          }
        }
        setLoading(false);
      })
      .catch(() => { showToast('Failed to load lessons', 'error'); setLoading(false); });
  }, [slug, isNew, location.state]);

  const setField = (key, val) => setLesson(l => ({ ...l, [key]: val }));

  const handleTitleChange = (val) => {
    setField('title', val);
    if (isNew) {
      const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setField('slug', autoSlug);
      setField('id', autoSlug);
    }
  };

  const addBlock = (type) => {
    const b = makeBlock(type);
    setLesson(l => ({ ...l, blocks: [...l.blocks, b] }));
    setShowAddMenu(false);
  };

  const updateBlock = (updated) =>
    setLesson(l => ({ ...l, blocks: l.blocks.map(b => b.id === updated.id ? updated : b) }));

  const deleteBlock = (id) =>
    setLesson(l => ({ ...l, blocks: l.blocks.filter(b => b.id !== id) }));

  const moveBlock = (from, to) => {
    setLesson(l => {
      const blocks = [...l.blocks];
      const [moved] = blocks.splice(from, 1);
      blocks.splice(to, 0, moved);
      return { ...l, blocks };
    });
  };

  const handleSave = async () => {
    if (!lesson.title.trim()) { showToast('Title is required', 'error'); return; }
    if (!lesson.slug.trim()) { showToast('Slug is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/save-lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lesson),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Lesson saved securely!');
        if (isNew) navigate(`/admin/lesson/${lesson.slug}`, { replace: true });
      } else {
        showToast('Save failed', 'error');
      }
    } catch {
      showToast('Server connection error', 'error');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 size={48} className="animate-spin text-blue-600" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Editor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-blue-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-4 flex items-center gap-6 shadow-sm">
        <button
          onClick={() => navigate('/admin')}
          className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-all shadow-sm active:scale-95 group"
        >
          <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md leading-none">Lesson Editor</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-extrabold text-slate-900 leading-none truncate max-w-sm">
              {isNew ? 'New Content' : lesson.title}
            </span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          {!isNew && (
            <Link
              to={`/lessons/${lesson.slug}`}
              target="_blank"
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm font-bold px-5 py-3 rounded-2xl hover:bg-white transition-all border border-transparent hover:border-slate-200"
            >
              <Eye size={18} /> Preview
            </Link>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-8 py-3.5 rounded-2xl text-sm font-black transition-all hover:shadow-xl hover:shadow-blue-200 active:scale-95 tracking-wide"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'SAVING…' : 'SAVE CONTENT'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-8 py-10 gap-10">
        <aside className="w-80 shrink-0 space-y-6">
          <Section title="Lesson Metadata" icon={<Layers size={14} />}>
            <Field label="Target Course">
              <select
                value={lesson.course || 'HTML'}
                onChange={e => setField('course', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {courseList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Display Title">
              <input
                value={lesson.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="e.g. Intro to Box Model"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:slate-300"
              />
            </Field>

            <Field label="Slug URL Identifier">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 group-focus-within:ring-2 group-focus-within:ring-blue-500/30">
                <span className="text-slate-400 text-xs font-bold mr-1">/lessons/</span>
                <input
                  value={lesson.slug}
                  onChange={e => setField('slug', e.target.value)}
                  className="bg-transparent flex-1 outline-none text-sm font-bold text-blue-600"
                />
              </div>
            </Field>

          </Section>

          <Section title="Course Chapters" icon={<BookOpen size={14} />}>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 no-scrollbar">
              {allLessons
                .filter(l => l.course === lesson.course)
                .sort((a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0))
                .map((l, idx) => (
                  <button
                    key={l.slug}
                    onClick={() => {
                      if (l.slug === lesson.slug) return;
                      if (window.confirm('Save changes before leaving?')) {
                        handleSave().then(() => navigate(`/admin/lesson/${l.slug}`));
                      } else {
                        navigate(`/admin/lesson/${l.slug}`);
                      }
                    }}
                    className={clsx(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left group",
                      l.slug === lesson.slug
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                        : "bg-slate-50 text-slate-500 hover:bg-white hover:text-blue-600 border border-transparent hover:border-slate-200"
                    )}
                  >
                    <span className={clsx(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[9px] shrink-0",
                      l.slug === lesson.slug ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                    )}>
                      {l.chapterOrder || idx + 1}
                    </span>
                    <span className="truncate">{l.title}</span>
                  </button>
                ))}
              <button
                onClick={() => navigate('/admin/lesson/new', { state: { topic: lesson.course } })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black text-blue-600 hover:bg-blue-50 transition-all border border-dashed border-blue-200 mt-2 uppercase tracking-widest"
              >
                <Plus size={14} /> Add New Chapter
              </button>
            </div>
          </Section>

          <Section title="Lesson Abstract" icon={<AlignLeft size={14} />}>
            <textarea
              value={lesson.description}
              onChange={e => setField('description', e.target.value)}
              rows={4}
              placeholder="Brief summary..."
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
            />
          </Section>
        </aside>

        <main className="flex-1 space-y-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Teaching Blocks
            <span className="text-xs font-bold bg-slate-200/50 text-slate-500 px-3 py-1 rounded-full">{lesson.blocks.length}</span>
          </h2>

          <div className="space-y-6">
            {lesson.blocks.map((block, idx) => (
              <BlockEditor
                key={block.id}
                block={block}
                idx={idx}
                total={lesson.blocks.length}
                onChange={updateBlock}
                onDelete={deleteBlock}
                onMove={moveBlock}
              />
            ))}

            <button
              onClick={() => setShowAddMenu(true)}
              className="w-full py-10 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-[3rem] text-slate-400 hover:text-blue-600 text-sm font-black transition-all flex flex-col items-center justify-center gap-4 hover:bg-blue-50/20 group pb-12"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors shadow-sm">
                <Plus size={32} />
              </div>
              <span className="uppercase tracking-widest text-[11px]">TUTORIAL MEIN AGAL BLOCK ADD KAREIN</span>
            </button>
          </div>
        </main>
      </div>

      {showAddMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddMenu(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Add Content</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select block type</p>
              </div>
              <button onClick={() => setShowAddMenu(false)} className="p-2 text-slate-400 hover:text-red-500 transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BLOCK_TYPES.map(type => (
                <button
                  key={type.type}
                  onClick={() => addBlock(type.type)}
                  className="flex flex-col items-center gap-3 p-5 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-blue-500 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                    {React.cloneElement(type.icon, { size: 18, className: "text-blue-500" })}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-10 right-10 z-[100] flex items-center gap-3 px-8 py-5 rounded-[2.5rem] text-sm font-bold shadow-2xl border-2 bg-white ${toast.type === 'error' ? 'border-red-100 text-red-600' : 'border-blue-100 text-blue-600'}`}>
          {toast.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function AudioUploader({ label, script, onScriptChange }) {
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const inputRef = useRef(null);
  const audioUrl = script?.audioUrl;

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioRef.current) {
      const fullUrl = audioUrl.startsWith('http') ? audioUrl : `${API_URL}${audioUrl}`;
      audioRef.current = new Audio(fullUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('audio', file);
      const res = await fetch(`${API_URL}/api/admin/upload-audio`, { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        onScriptChange({ ...script, audioUrl: data.audioUrl, fileName: file.name });
      }
    } catch (e) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className={clsx("relative border-2 border-dashed rounded-[1.5rem] p-6 flex flex-col items-center justify-center gap-2", audioUrl ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 hover:border-blue-500")}>
        <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        {uploading ? <Loader2 size={32} className="animate-spin text-blue-600" /> : audioUrl ? (
          <div className="flex flex-col items-center gap-2">
            <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">{playing ? <Pause size={20} /> : <Play size={20} />}</button>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{script?.fileName || 'Audio Saved'}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => inputRef.current.click()}>
            <Music size={32} className="text-slate-200" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UPLOAD AUDIO</span>
          </div>
        )}
      </div>

      {audioUrl && (
        <button
          type="button"
          onClick={() => onScriptChange({ ...script, audioUrl: null, fileName: null })}
          className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-[10px] font-black text-red-400 hover:text-red-600 hover:bg-red-50 transition-all uppercase tracking-widest border border-transparent hover:border-red-100"
        >
          <Trash2 size={14} /> Remove Audio
        </button>
      )}
    </div>
  );
}

function Label({ children }) { return <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{children}</p>; }
function Field({ label, children }) { return <div className="flex flex-col">{children}<p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-60">{label}</p></div>; }
function Section({ title, icon, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-7 flex flex-col gap-5 shadow-sm">
      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><span className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center">{icon}</span>{title}</p>
      {children}
    </div>
  );
}
function IconBtn({ children, onClick, disabled, danger }) {
  return (
    <button onClick={onClick} disabled={disabled} className={clsx("p-2 rounded-xl transition-all", danger ? "text-slate-300 hover:text-red-500" : "text-slate-300 hover:text-slate-900")}>
      {children}
    </button>
  );
}
