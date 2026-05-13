import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, ArrowRight, Lock, ShieldAlert, Loader2 } from 'lucide-react';
import { API_URL } from '../config';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        navigate('/admin');
      } else {
        setError(data.error || 'Invalid admin password');
      }
    } catch (err) {
      setError('Connection failed. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans selection:bg-blue-500/30">
      
      <div className="w-full max-w-md relative">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Code2 className="text-blue-500" size={40} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-2">SummerCode</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Management Studio</p>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] px-1 ml-1">Master Access Key</label>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-white/5 text-white px-6 py-4 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-800"
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-950/30 border border-red-500/20 text-red-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                <ShieldAlert size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-500/10 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Unlock Studio"}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center">
            <button 
                onClick={() => navigate('/')}
                className="text-slate-600 hover:text-slate-400 transition-colors text-[9px] font-black uppercase tracking-[0.5em]"
            >
                EXIT SESSION
            </button>
        </div>
      </div>
    </div>
  );
}
