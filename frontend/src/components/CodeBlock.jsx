import React, { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-core';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-twilight.css'; 
import { RotateCcw, Play, Loader2 } from 'lucide-react';
import { useTeachingState } from '../contexts/TeachingContext';
import { API_URL } from '../config';
import clsx from 'clsx';

export default function CodeBlock({ visibleText, language, stepIndex, audioDuration, defaultStdin }) {
  const [code, setCode] = useState(visibleText || '');
  const [hasRun, setHasRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [execResult, setExecResult] = useState('');
  const [execError, setExecError] = useState(false);
  const [stdin, setStdin] = useState(defaultStdin || '');
  
  // Interactive Terminal States
  const [terminalStep, setTerminalStep] = useState('READY'); // READY, PROMPTING, EXECUTING, DONE
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const [terminalLines, setTerminalLines] = useState([]);

  const isBrowserLang = ['html', 'css', 'javascript', 'js'].includes((language || '').toLowerCase());
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  const {
    isActive, mode, currentStep, showContinueButton, setShowContinueButton,
    userHasRun, setUserHasRun, setMode, isPaused
  } = useTeachingState();

  // Scroll to bottom of terminal when lines change
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines, terminalStep]);

  // Sync state if prop changes
  useEffect(() => {
    setCode(visibleText || '');
    setStdin(defaultStdin || '');
    setTerminalStep('READY');
    setTerminalLines([]);
    setHasRun(false);
  }, [visibleText, defaultStdin]);

  const isCurrentBlock = isActive && currentStep === stepIndex;
  const isReadOnly = (isCurrentBlock && (mode === 'BOT_CODING' || mode === 'EXPLAINING' || mode === 'EXPLAINING_CODE')) || (!isCurrentBlock && isActive);

  const typingState = useRef({ index: 0, text: '' });

  // Reset typing state when entering a new code block explanation
  useEffect(() => {
    if (isCurrentBlock && mode === 'EXPLAINING_CODE') {
      typingState.current = { index: 0, text: '' };
      setCode('');
    }
  }, [isCurrentBlock, mode]);

  // Handle Bot Typing Simulation
  useEffect(() => {
    let timeoutId;
    let isTypingActive = true;

    if (isCurrentBlock && mode === 'EXPLAINING_CODE' && !isPaused) {
      const sourceText = visibleText || '';
      const chars = sourceText.split('');

      let msPerChar = 30;
      if (audioDuration && chars.length > 0) {
        const targetMs = Math.max(500, audioDuration - 500);
        msPerChar = Math.max(5, Math.floor(targetMs / chars.length));
      }

      const typeNextChar = () => {
        if (!isTypingActive) return;
        const state = typingState.current;
        if (state.index < chars.length) {
          state.text += chars[state.index] || '';
          setCode(state.text);
          state.index++;
          timeoutId = setTimeout(typeNextChar, msPerChar);
        }
      };
      timeoutId = setTimeout(typeNextChar, typingState.current.index === 0 ? 500 : msPerChar);
    }

    return () => {
      isTypingActive = false;
      clearTimeout(timeoutId);
    };
  }, [isCurrentBlock, mode, visibleText, isPaused, audioDuration]);

  /**
   * INTERACTIVE PROMPT EXTRACTION
   * Scans the code for strings inside printf/cout/input() 
   * that appear before an input command.
   */
  const detectPrompt = (sourceCode, lang) => {
    const l = (lang || '').toLowerCase();
    let prompt = null;

    if (l === 'c' || l === 'cpp') {
      const inputMatch = sourceCode.search(/(scanf|cin|gets|fgets)/);
      if (inputMatch !== -1) {
        const preInput = sourceCode.substring(0, inputMatch);
        const match = preInput.match(/"([^"]*)"/);
        if (match) prompt = match[1];
      }
    } else if (l === 'python') {
      const match = sourceCode.match(/input\s*\(\s*"([^"]*)"\s*\)/);
      if (match) prompt = match[1];
    }
    return prompt;
  };

  const handleRun = async () => {
    setHasRun(true);
    setTerminalLines([]);
    setExecError(false);
    setCurrentInput(''); 
    setCurrentPrompt('');

    if (isCurrentBlock && mode === 'AT_CODE_BLOCK') {
      setMode('USER_TRYING');
      setUserHasRun(true);
    }

    if (isBrowserLang) {
      setTerminalStep('EXECUTING');
      setTerminalLines([{ type: 'output', text: 'Rendering preview...' }]);
      return;
    }

    const prompt = detectPrompt(code, language);
    if (prompt) {
      setTerminalStep('PROMPTING');
      setCurrentPrompt(prompt);
      setTerminalLines([{ type: 'prompt', text: prompt }]);
      return;
    }

    await performExecution(stdin);
  };

  const handleInputSubmit = async (e) => {
    if (e.key !== 'Enter') return;
    const val = currentInput;
    setTerminalLines(prev => [...prev, { type: 'input', text: val }]);
    setTerminalStep('EXECUTING');
    await performExecution(val);
  };

  const performExecution = async (inputVal) => {
    setIsRunning(true);
    setTerminalStep('EXECUTING');
    try {
      const res = await fetch(`${API_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, stdin: inputVal })
      });
      const data = await res.json();
      
      const rawOutput = data.output || 'No output generated.';
      let cleanOutput = rawOutput;
      if (currentPrompt && rawOutput.startsWith(currentPrompt)) {
        cleanOutput = rawOutput.substring(currentPrompt.length).trim();
      }

      const lines = cleanOutput.split('\n');
      for (const line of lines) {
         setTerminalLines(prev => [...prev, { type: 'output', text: line }]);
      }
      setExecError(data.error || !res.ok);
    } catch (err) {
      setTerminalLines(prev => [...prev, { type: 'error', text: 'Execution failed. Please try again.' }]);
      setExecError(true);
    } finally {
      setIsRunning(false);
      setTerminalStep('DONE');
    }
  };

  const handleReset = () => {
    setCode(visibleText);
    setTerminalStep('READY');
    setTerminalLines([]);
    setHasRun(false);
  };

  const highlightWithPrism = (codeStr) => {
    const lg = Prism.languages[language] || Prism.languages.markup;
    return Prism.highlight(codeStr, lg, language);
  };

  const handleTerminalClick = () => {
    if (terminalStep === 'PROMPTING' && inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-0 rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none my-6 w-full transition-shadow duration-500">
      <div className="bg-[#0f172a] flex flex-col min-w-0 border-r border-slate-800">
        <div className="h-12 bg-[#0f172a] flex items-center px-4 justify-between border-b border-slate-800">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">EDITOR.{language}</span>
          <button onClick={handleReset} title="Reset Code" className="text-slate-500 hover:text-white transition-colors">
            <RotateCcw size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 text-sm font-mono relative group text-blue-300 min-h-[300px]">
          {isReadOnly && <div className="absolute inset-0 z-10 cursor-not-allowed"></div>}
          {React.createElement(Editor.default || Editor, {
            value: code,
            onValueChange: c => {
              setCode(c);
              if (isCurrentBlock && mode === 'AT_CODE_BLOCK') setMode('USER_TRYING');
            },
            highlight: highlightWithPrism,
            padding: 0,
            textareaClassName: "focus:outline-none",
            style: { fontFamily: '"JetBrains Mono", monospace', lineHeight: 1.6 },
            readOnly: isReadOnly,
            className: "text-blue-300 w-full h-full"
          })}
        </div>
      </div>

      <div className="bg-white flex flex-col min-w-0 transition-colors duration-500">
        <div className="h-12 bg-white flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Terminal Preview
            </div>
          </div>
          <button
            onClick={handleRun}
            disabled={terminalStep === 'EXECUTING' || terminalStep === 'PROMPTING'}
            className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-500 px-5 py-1.5 rounded-full text-[10px] font-black transition-all disabled:opacity-50 uppercase tracking-widest"
          >
            <Play size={12} fill="currentColor" /> RUN CODE
          </button>
        </div>
        
        <div 
          ref={terminalRef} 
          onClick={handleTerminalClick}
          className={clsx(
            "flex-1 p-6 relative bg-white overflow-auto",
            terminalStep === 'PROMPTING' && "cursor-text"
          )}
        >
          {!hasRun ? (
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              Waiting for execution...
            </div>
          ) : isBrowserLang ? (
             <iframe
               srcDoc={`<html><body style="margin:0;padding:0;color:#0f172a;font-family:monospace;background:white;">
                 <div id="root"></div><script>try{${language === 'javascript' ? code : `document.getElementById('root').innerHTML = \`${code}\``}}catch(e){document.body.innerHTML='<span style="color:#ef4444">'+e.message+'</span>'}</script>
               </body></html>`}
               title="preview" className="w-full h-full border-0"
             />
          ) : (
            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {terminalLines.map((line, i) => {
                const isLatestPrompt = i === terminalLines.length - 1 && line.type === 'prompt' && terminalStep === 'PROMPTING';
                
                return (
                  <span key={i} className={clsx(
                    line.type === 'prompt' ? "text-slate-800" :
                    line.type === 'input' ? "text-blue-600 font-bold ml-1" :
                    line.type === 'error' ? "text-red-600 block" : "text-slate-800 block"
                  )}>
                    {line.text}
                    {isLatestPrompt && (
                      <input
                        ref={inputRef}
                        autoFocus
                        type="text"
                        value={currentInput}
                        onChange={e => setCurrentInput(e.target.value)}
                        onKeyDown={handleInputSubmit}
                        className="bg-transparent border-none outline-none text-blue-600 font-bold inline-block ml-1 caret-blue-600 min-w-[20px]"
                        style={{ width: `${Math.max(2, currentInput.length)}ch` }}
                      />
                    )}
                    {(line.type === 'output' || line.type === 'error' || (line.type === 'input')) && <br />}
                  </span>
                );
              })}

              {terminalStep === 'EXECUTING' && (
                <div className="flex items-center gap-2 text-blue-500 animate-pulse text-xs mt-1">
                  <Loader2 className="animate-spin" size={14} /> Executing...
                </div>
              )}
              <div className="h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
