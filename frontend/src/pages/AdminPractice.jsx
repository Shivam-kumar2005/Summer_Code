import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, ChevronRight,
  HelpCircle, Code, Bug, Terminal, Loader2, Save, X
} from 'lucide-react';
import { API_URL } from '../config';
import clsx from 'clsx';

export default function AdminPractice() {
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    topicId: '',
    type: 'mcq',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'easy',
    starterCode: '',
    testCases: [{ input: '', expectedOutput: '' }]
  });

  useEffect(() => {
    fetchTopics();
    fetchQuestions();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/topics`);
      const data = await res.json();
      setTopics(data);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const url = selectedTopic
        ? `${API_URL}/api/admin/practice?topicId=${selectedTopic}`
        : `${API_URL}/api/admin/practice`;
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedTopic]);

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingQuestion
      ? `${API_URL}/api/admin/practice/${editingQuestion._id}`
      : `${API_URL}/api/admin/practice`;
    const method = editingQuestion ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setEditingQuestion(null);
        fetchQuestions();
      }
    } catch (err) {
      console.error('Error saving question:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await fetch(`${API_URL}/api/admin/practice/${id}`, { method: 'DELETE' });
      fetchQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  const openEdit = (q) => {
    setEditingQuestion(q);
    setFormData(q);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      topicId: selectedTopic || '',
      type: 'mcq',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      difficulty: 'easy',
      starterCode: '',
      testCases: [{ input: '', expectedOutput: '' }]
    });
    setEditingQuestion(null);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Practice Management</h1>
            <p className="text-slate-500 font-medium">Create and manage topic-based practice questions</p>
          </div>
          <button
            onClick={resetForm}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-3"
          >
            <Plus size={18} /> Add New Question
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              <option value="">All Topics</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest px-4">
            {questions.length} Questions Found
          </div>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
          ) : questions.map(q => (
            <div key={q._id} className="bg-white border border-slate-200 rounded-[2rem] p-8 flex items-center justify-between group hover:border-blue-200 transition-all">
              <div className="flex items-center gap-6">
                <div className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  q.type === 'mcq' && "bg-blue-50 text-blue-600",
                  q.type === 'output' && "bg-amber-50 text-amber-600",
                  q.type === 'debug' && "bg-rose-50 text-rose-600",
                  q.type === 'coding' && "bg-emerald-50 text-emerald-600"
                )}>
                  {q.type === 'mcq' && <HelpCircle size={24} />}
                  {q.type === 'output' && <Terminal size={24} />}
                  {q.type === 'debug' && <Bug size={24} />}
                  {q.type === 'coding' && <Code size={24} />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-slate-900 truncate max-w-md">{q.question}</h3>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{q.difficulty}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{q.topicId} • {q.type}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => openEdit(q)} className="p-3 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(q._id)} className="p-3 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-10 relative z-10 shadow-2xl space-y-8 animate-pop-in">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Topic</label>
                  <select
                    required
                    value={formData.topicId}
                    onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Topic</option>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Question Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mcq">MCQ</option>
                    <option value="output">Output Based</option>
                    <option value="debug">Debugging</option>
                    <option value="coding">Coding</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Question Text</label>
                <textarea
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 h-24"
                />
              </div>

              {(formData.type === 'mcq' || formData.type === 'output') && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Options</label>
                  <div className="grid grid-cols-2 gap-4">
                    {formData.options.map((opt, i) => (
                      <input
                        key={i}
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...formData.options];
                          newOpts[i] = e.target.value;
                          setFormData({ ...formData, options: newOpts });
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Correct Answer</label>
                  <input
                    required
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                    placeholder="Exact text match"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {(formData.type === 'coding' || formData.type === 'debug') && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Starter Code</label>
                  <textarea
                    value={formData.starterCode}
                    onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                    className="w-full bg-slate-900 text-emerald-400 font-mono p-6 rounded-2xl outline-none h-40"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Explanation</label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 h-24"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3"
                >
                  <Save size={18} /> {editingQuestion ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
