/**
 * ==========================================
 * AUTHENTICATION CENTER - LoginPage.jsx
 * ==========================================
 * This page handles everything related to user access:
 * 1. Standard Login (Email/Password)
 * 2. Signup (Creating new accounts)
 * 3. Password Recovery (Forgot/Reset)
 * 4. Google One-Tap Login
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, ArrowRight, Lock, ShieldAlert, Loader2, User, Mail, Sparkles, KeyRound } from 'lucide-react';
import { API_URL } from '../config'; // Backend URL
import clsx from 'clsx';
import { GoogleLogin } from '@react-oauth/google'; // Google Auth Component

export default function LoginPage() {
  // --- STATE MANAGEMENT ---
  // 'mode' determines what the form looks like (login, signup, forgot, or reset)
  const [mode, setMode] = useState('login'); 
  const [formData, setFormData] = useState({ name: '', email: '', password: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // Stores error messages from backend
  const [success, setSuccess] = useState(''); // Stores success messages
  const navigate = useNavigate(); // Helper to redirect users to other pages

  /**
   * GOOGLE LOGIN HANDLER
   * Runs when the user successfully signs in with Google.
   */
  /**
   * TERMINOLOGY: async (Asynchronous)
   * This keyword tells Javascript that the function will take some time 
   * to finish (like waiting for a response from the server).
   */
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      /**
       * TERMINOLOGY: await
       * Used inside 'async' functions. It tells the code to "WAIT" here until
       * the fetch request is finished before moving to the next line.
       */
      const res = await fetch(`${API_URL}/api/auth/google`, {
        /**
         * TERMINOLOGY: HTTP POST
         * We use POST when we are SENDING data to the server (like a login token).
         * 'GET' is usually for just receiving data.
         */
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        /**
         * TERMINOLOGY: JSON.stringify()
         * Computers send data as text strings. This function converts a 
         * Javascript Object into a Text String so it can travel over the internet.
         */
        body: JSON.stringify({ credential: credentialResponse.credential })
      });

      /**
       * TERMINOLOGY: res.json()
       * This converts the Text String we received back from the server
       * into a Javascript Object so we can read data like 'data.success'.
       */
      const data = await res.json();

      if (data.success) {
        // SAVE SESSION: Store the tokens and user info in the browser's memory (localStorage)
        localStorage.setItem('studentToken', data.token);
        localStorage.setItem('studentData', JSON.stringify(data.user));
        
        // If the user is an admin, store the admin token too
        if (data.adminToken) {
          localStorage.setItem('adminToken', data.adminToken);
        }
        
        // Go to Home Page
        navigate('/');
      } else {
        setError(data.error || 'Google Login Failed');
      }
    } catch (err) {
      setError('Connection failed during Google Login');
    } finally {
      setLoading(false);
    }
  };

  /**
   * MAIN FORM ACTION
   * Handles Login, Signup, Forgot, and Reset requests.
   */
  const handleAction = async (e) => {
    e.preventDefault(); // Prevent page reload
    setLoading(true);
    setError('');
    setSuccess('');

    let endpoint = '';
    let body = {};

    // Determine which API endpoint to call based on the current mode
    switch(mode) {
      case 'login':
        endpoint = '/api/auth/login';
        body = { email: formData.email, password: formData.password };
        break;
      case 'signup':
        endpoint = '/api/auth/signup';
        body = formData;
        break;
      case 'forgot':
        endpoint = '/api/auth/forgot-password';
        body = { email: formData.email };
        break;
      case 'reset':
        endpoint = '/api/auth/reset-password';
        body = { email: formData.email, newPassword: formData.newPassword };
        break;
      default: break;
    }
    
    try {
      /**
       * TERMINOLOGY: Error Handling (try...catch)
       * 'try' block contains the code that might fail (like if the server is offline).
       * 'catch' block runs ONLY if an error happens, preventing the whole app from crashing.
       */
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        // Handle success based on mode
        if (mode === 'login') {
          localStorage.setItem('studentToken', data.token);
          localStorage.setItem('studentData', JSON.stringify(data.user));
          if (data.adminToken) localStorage.setItem('adminToken', data.adminToken);
          navigate('/');
        } else if (mode === 'signup') {
          setSuccess('Account created! Please login now.');
          setMode('login'); // Switch to login screen
        } else if (mode === 'forgot') {
          setSuccess('Reset simulation: You can now enter a new password.');
          setMode('reset'); // Switch to reset screen
        } else if (mode === 'reset') {
          setSuccess('Password updated! Please login.');
          setMode('login');
        }
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection failed. Check if backend is running.');
    } finally {
      /**
       * TERMINOLOGY: finally
       * This code runs NO MATTER WHAT (success or fail).
       * We use it here to stop the 'Loading' spinner.
       */
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      
      {/* 1. Page Content Wrapper */}
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {mode === 'forgot' || mode === 'reset' ? 'Account Recovery' : 'Student Portal'}
          </h1>
          <p className="text-slate-500 font-medium">
             {mode === 'forgot' ? 'Recover your account' : 'Start learning in Hinglish'}
          </p>
        </div>

        {/* 2. Main Auth Card */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          
          <form onSubmit={handleAction} className="space-y-6">
            
            {/* Conditional Input: Name (Only for Signup) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-2xl font-semibold outline-none focus:border-blue-500 transition-all"
                />
              </div>
            )}

            {/* Email Input (Common for all modes) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
              <input
                type="email" required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-2xl font-semibold outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* Password Input (Login/Signup) */}
            {(mode === 'login' || mode === 'signup') && (
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('forgot')} className="text-xs font-bold text-blue-600">Forgot?</button>
                  )}
                </div>
                <input
                  type="password" required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-2xl font-semibold outline-none focus:border-blue-500 transition-all"
                />
              </div>
            )}

            {/* New Password Input (Reset Mode) */}
            {mode === 'reset' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">New Password</label>
                <input
                  type="password" required
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-2xl font-semibold outline-none focus:border-blue-500 transition-all"
                />
              </div>
            )}

            {/* Error/Success Feedback */}
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[13px] font-medium border border-red-100">{error}</div>}
            {success && <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[13px] font-medium border border-emerald-100">{success}</div>}

            {/* Submit Button */}
            <button
              disabled={loading}
              className="w-full bg-slate-950 text-white py-4 rounded-2xl font-bold transition-all hover:bg-slate-900 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Verify Email' : mode === 'reset' ? 'Reset Password' : 'Start Learning'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            {/* Google Login Option */}
            {(mode === 'login' || mode === 'signup') && (
              <>
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google Login Failed')}
                    theme="filled_blue"
                    shape="pill"
                    width="100%"
                  />
                </div>
              </>
            )}

            {/* Switch between Login and Signup */}
            <p className="text-center text-[13px] font-medium text-slate-500 pt-2">
              {mode === 'login' ? (
                <>Don't have an account? <button type="button" onClick={() => setMode('signup')} className="text-blue-600 font-bold">Sign up</button></>
              ) : mode === 'signup' ? (
                <>Already have an account? <button type="button" onClick={() => setMode('login')} className="text-blue-600 font-bold">Login</button></>
              ) : (
                <button type="button" onClick={() => setMode('login')} className="text-blue-600 font-bold">Back to Login</button>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
