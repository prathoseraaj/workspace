'use client';

import React, { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from 'react';
import { gsap } from 'gsap';

// ─── Types matching the FastAPI /analyze response ────────────────────────────

interface FunctionInfo {
  name: string;
  args: string[];
  line_start: number;
  line_end: number;
}

interface VariableChange {
  variable_name: string;
  new_value: string;
}

interface StepLog {
  step_number: number;
  description: string;
  code_snippet: string;
  variable_changes: VariableChange[];
}

interface AnalyzeResponse {
  functions: FunctionInfo[];
  loops: number;
  time_complexity: string | null;
  space_complexity: string | null;
  narration_script: string[];
  logic_timeline: StepLog[];
  timeline_steps: number;
  error?: string;
}

// ─── Complexity → bar-width mapping ──────────────────────────────────────────

function parseComplexityWidth(complexity: string | null): string {
  if (!complexity) return '20%';
  const c = complexity.toLowerCase();
  if (c.includes('1)') || c === 'o(1)') return '10%';
  if (c.includes('log')) return '25%';
  if (c.includes('n²') || c.includes('n^2') || c.includes('n2')) return '85%';
  if (c.includes('n!') || c.includes('2^n')) return '100%';
  if (c.includes('n log') || c.includes('nlogn')) return '55%';
  if (c.includes('n)') || c === 'o(n)') return '40%';
  return '35%';
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const [code, setCode] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── GSAP refs ───────────────────────────────────────────────────────────────
  const navRef = useRef<HTMLElement>(null);
  const macWindowRef = useRef<HTMLElement>(null);
  const leftPaneRef = useRef<HTMLElement>(null);
  const middlePaneRef = useRef<HTMLElement>(null);
  const rightPaneRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Entrance animations on mount ────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Nav slides down
      tl.fromTo(
        navRef.current,
        { y: -64, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 }
      );

      // Mac window scales up from slightly below
      tl.fromTo(
        macWindowRef.current,
        { y: 40, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 0.75, ease: 'expo.out' },
        '-=0.3'
      );

      // Left pane slides in from left
      tl.fromTo(
        leftPaneRef.current,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6 },
        '-=0.55'
      );

      // Middle pane fades in
      tl.fromTo(
        middlePaneRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        '-=0.45'
      );

      // Right pane slides in from right
      tl.fromTo(
        rightPaneRef.current,
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6 },
        '-=0.45'
      );
    });

    return () => ctx.revert();
  }, []);

  // ── Animate results in when they arrive ─────────────────────────────────────
  useEffect(() => {
    if (!result || !resultsRef.current) return;

    const items = resultsRef.current.querySelectorAll('[data-animate]');
    gsap.fromTo(
      items,
      { y: 18, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
      }
    );
  }, [result]);

  // ── Drag-and-drop handlers ──────────────────────────────────────────────────

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const readFile = useCallback((file: File) => {
    if (!file.name.endsWith('.py')) {
      setError('Please upload a .py Python file.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setCode((ev.target?.result as string) ?? '');
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  // ── Analyze ─────────────────────────────────────────────────────────────────

  const analyze = useCallback(async () => {
    if (!code.trim()) {
      setError('Please provide Python code before analyzing.');
      return;
    }
    setError(null);
    setResult(null);
    setActiveStep(null);
    setIsLoading(true);
    setProgress(10);

    // Fake progress animation while waiting
    const ticker = setInterval(() => {
      setProgress((p) => (p < 85 ? p + Math.random() * 8 : p));
    }, 400);

    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      clearInterval(ticker);
      setProgress(95);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      const data: AnalyzeResponse = await res.json();

      if (data.error) throw new Error(data.error);

      setProgress(100);
      setTimeout(() => {
        setResult(data);
        setIsLoading(false);
        setProgress(0);
      }, 400);
    } catch (err: unknown) {
      clearInterval(ticker);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setIsLoading(false);
      setProgress(0);
    }
  }, [code]);

  // ── Status label ─────────────────────────────────────────────────────────────

  const statusLabel = isLoading
    ? progress < 30
      ? 'Connecting to API...'
      : progress < 60
        ? 'Parsing AST logic...'
        : progress < 85
          ? 'Extracting LLM insights...'
          : 'Finalising results...'
    : result
      ? 'Analysis complete ✓'
      : 'Ready';

  return (
    <>
      {/* ── Nav ── */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/70 backdrop-blur-3xl shadow-2xl shadow-black/50 flex justify-between items-center px-8 h-14"
        style={{ opacity: 0 }}
      >
        <div className="text-lg font-bold tracking-tighter text-zinc-100">CodeKino</div>
        <div className="hidden md:flex gap-8 items-center">
          <a className="font-inter tracking-tight text-sm font-medium text-blue-400 font-semibold hover:text-white transition-colors duration-200" href="#">Platform</a>
          <a className="font-inter tracking-tight text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200" href="#">Features</a>
          <a className="font-inter tracking-tight text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200" href="#">Complexity</a>
          <a className="font-inter tracking-tight text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200" href="#">Transcript</a>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-1.5 bg-primary text-on-primary rounded-full text-sm font-medium scale-95 active:opacity-80 transition-all">Get Started</button>
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="min-h-screen pt-14 pb-20 flex items-center justify-center px-4 bg-zinc-950">

        {/* ── macOS Window ── */}
        <main
          ref={macWindowRef}
          className="w-full max-w-6xl bg-surface-container-low rounded-xl mac-shadow overflow-hidden flex flex-col"
          style={{ minHeight: '600px', height: 'calc(100vh - 14rem)', opacity: 0 }}
        >

          {/* Title bar */}
          <div className="h-10 shrink-0 flex items-center px-4 bg-surface-container-high/30 border-b border-white/5 backdrop-blur-md">
            <div className="flex gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F57] shadow-inner" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#FEBC2E] shadow-inner" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#28C840] shadow-inner" />
            </div>
            <div className="flex-1 text-center text-xs font-medium text-zinc-500 tracking-wide select-none">
              dashboard.codekino — python-analyzer
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden min-h-0">

            {/* ──────────────────────────────────────────────────────────────────
                LEFT PANE — Input
            ─────────────────────────────────────────────────────────────────── */}
            <section
              ref={leftPaneRef}
              className="w-80 shrink-0 p-6 flex flex-col gap-3 bg-surface-container-lowest border-r border-white/5 overflow-y-auto no-scrollbar"
              style={{ opacity: 0, minWidth: '320px' }}
            >
              {/* Section header */}
              <div className="shrink-0">
                <h1 className="text-xl font-semibold tracking-tight text-white leading-tight">Input Source</h1>
                <p className="text-xs text-zinc-500 mt-0.5">Provide the Python script to analyse.</p>
              </div>

              {/* Drop zone */}
              <div
                id="code-dropzone"
                className={`shrink-0 rounded-xl border border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 backdrop-blur-sm py-4 ${
                  isDragging
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-outline-variant/30 bg-surface-container-highest/20 hover:bg-surface-container-highest/40'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={`w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
                  <span className="material-symbols-outlined text-3xl">description</span>
                </div>
                <div className="text-center px-4">
                  {fileName ? (
                    <p className="text-sm font-medium text-blue-400">{fileName} loaded ✓</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-zinc-200">Drag your .py script here.</p>
                      <p className="text-xs text-zinc-500 mt-1">Or click to browse files</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  id="file-input"
                  type="file"
                  accept=".py"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Code textarea */}
              <div className="flex flex-col gap-2 shrink-0">
                <label htmlFor="code-textarea" className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                  Or paste code directly
                </label>
                <textarea
                  id="code-textarea"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="# paste Python code here..."
                  className="w-full h-36 rounded-lg bg-zinc-900/70 border border-white/5 text-xs font-mono text-zinc-300 placeholder-zinc-700 resize-none p-4 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all no-scrollbar"
                  spellCheck={false}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="shrink-0 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 font-mono">
                  <span className="material-symbols-outlined text-sm align-middle mr-1">error</span>
                  {error}
                </div>
              )}

              {/* Analyse button */}
              <button
                id="analyze-btn"
                onClick={analyze}
                disabled={isLoading}
                className="shrink-0 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analysing…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    Analyse Code
                  </>
                )}
              </button>

              {/* Processing status bar */}
              <div className="shrink-0 rounded-lg bg-surface-container-high/40 p-4 border border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Processing Status</span>
                  <span className={`text-[10px] font-mono ${isLoading ? 'text-blue-400 animate-pulse' : result ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(170,199,255,0.4)]"
                    style={{ width: isLoading ? `${progress}%` : result ? '100%' : '0%' }}
                  />
                </div>
                <div className="mt-4 flex gap-4 text-[11px] font-mono text-zinc-500">
                  <div className="flex flex-col">
                    <span className="text-zinc-400">Functions</span>
                    <span>{result ? result.functions.length : '–'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-400">Loops</span>
                    <span>{result ? result.loops : '–'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-400">Steps</span>
                    <span>{result ? result.timeline_steps : '–'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ──────────────────────────────────────────────────────────────────
                MIDDLE PANE — Results / Video coming soon
            ─────────────────────────────────────────────────────────────────── */}
            <section
              ref={middlePaneRef}
              className="flex-1 bg-surface border-r border-white/5 p-6 flex flex-col gap-4 relative overflow-y-auto no-scrollbar"
              style={{ opacity: 0 }}
            >
              <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${result ? 'bg-emerald-400' : 'bg-secondary'}`} />
                  <h2 className="text-sm font-semibold text-zinc-300">
                    {result ? 'Analysis Results' : 'Live Preview'}
                  </h2>
                </div>
              </div>

              {/* ── Video stub / waiting state ── */}
              {!result && (
                <div className="flex-1 rounded-xl overflow-hidden bg-zinc-900/60 border border-white/5 flex flex-col items-center justify-center gap-5 min-h-48">
                  <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <span className="material-symbols-outlined text-5xl">movie</span>
                  </div>
                  <div className="text-center space-y-1 px-6">
                    <p className="text-base font-semibold text-zinc-200">Video Generation Coming Soon</p>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                      The animated video export is under development. Run an analysis above to explore the code insights right now.
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/5 text-[10px] uppercase tracking-widest font-bold text-blue-400">
                    In Development
                  </div>
                </div>
              )}

              {/* ── Real results ── */}
              {result && (
                <div ref={resultsRef} className="flex flex-col gap-4 flex-1">

                  {/* Complexity badges */}
                  <div data-animate className="grid grid-cols-2 gap-3 shrink-0">
                    <div className="bg-surface-container-high/50 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Time Complexity</span>
                      <span className="text-xl font-mono font-bold text-white">{result.time_complexity ?? 'N/A'}</span>
                    </div>
                    <div className="bg-surface-container-high/50 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Space Complexity</span>
                      <span className="text-xl font-mono font-bold text-white">{result.space_complexity ?? 'N/A'}</span>
                    </div>
                  </div>

                  {/* Functions found */}
                  {result.functions.length > 0 && (
                    <div data-animate className="shrink-0 rounded-xl bg-zinc-900/60 border border-white/5 p-4">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-3">Functions Detected</span>
                      <div className="flex flex-wrap gap-2">
                        {result.functions.map((fn) => (
                          <span
                            key={fn.name}
                            className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-300"
                          >
                            {fn.name}({fn.args.join(', ')})
                            <span className="ml-1.5 text-zinc-500 text-[10px]">L{fn.line_start}–{fn.line_end}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video placeholder ribbon */}
                  <div data-animate className="shrink-0 rounded-xl bg-zinc-800/40 border border-dashed border-white/10 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                      <span className="material-symbols-outlined text-2xl">movie</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-300">Video generation coming soon</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        The animated video export is being built. Analysis results are live above.
                      </p>
                    </div>
                    <span className="ml-auto px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] uppercase tracking-widest font-bold text-amber-400 shrink-0">Soon</span>
                  </div>

                  {/* Logic Timeline */}
                  {result.logic_timeline.length > 0 && (
                    <div data-animate className="flex-1 flex flex-col min-h-0">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-3 shrink-0">
                        Logic Timeline — {result.timeline_steps} steps
                      </span>
                      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
                        {result.logic_timeline.map((step) => (
                          <button
                            key={step.step_number}
                            id={`step-${step.step_number}`}
                            onClick={() => setActiveStep(activeStep === step.step_number ? null : step.step_number)}
                            className={`text-left rounded-xl border p-3 transition-all duration-200 ${
                              activeStep === step.step_number
                                ? 'border-blue-500/40 bg-blue-500/10'
                                : 'border-white/5 bg-surface-container-high/30 hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                                {step.step_number}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-zinc-300 leading-relaxed">{step.description}</p>
                                {activeStep === step.step_number && (
                                  <div className="mt-2 space-y-2">
                                    <pre className="text-[10px] font-mono text-blue-300 bg-zinc-900/60 px-3 py-2 rounded-md overflow-x-auto no-scrollbar whitespace-pre-wrap">
                                      {step.code_snippet}
                                    </pre>
                                    {step.variable_changes.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5">
                                        {step.variable_changes.map((vc, i) => (
                                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                            {vc.variable_name} = {vc.new_value}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <span className="material-symbols-outlined text-sm text-zinc-600 shrink-0">
                                {activeStep === step.step_number ? 'expand_less' : 'expand_more'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ──────────────────────────────────────────────────────────────────
                RIGHT SIDEBAR — Complexity + Transcript
            ─────────────────────────────────────────────────────────────────── */}
            <aside
              ref={rightPaneRef}
              className="w-72 shrink-0 bg-zinc-900/50 backdrop-blur-2xl border-l border-white/5 flex flex-col overflow-hidden"
              style={{ opacity: 0 }}
            >
              <div className="p-6 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[1px] shrink-0">
                    <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-blue-400">
                      <span className="material-symbols-outlined text-base">code</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-widest">CodeKino Pro</p>
                    <p className="text-[10px] text-blue-400/80 font-medium">Analysis Engine</p>
                  </div>
                </div>

                {/* Complexity widgets */}
                <div className="space-y-4">
                  <div className="bg-surface-container-highest/30 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-tighter">Time Complexity</span>
                      <span className="material-symbols-outlined text-blue-400 text-xs">schedule</span>
                    </div>
                    <p className="text-lg font-mono font-bold text-white">
                      {result?.time_complexity ?? '—'}
                    </p>
                    <div className="mt-2 h-1 w-full bg-zinc-800 rounded-full">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all duration-700"
                        style={{ width: result ? parseComplexityWidth(result.time_complexity) : '0%' }}
                      />
                    </div>
                  </div>

                  <div className="bg-surface-container-highest/30 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-tighter">Space Complexity</span>
                      <span className="material-symbols-outlined text-secondary text-xs">memory</span>
                    </div>
                    <p className="text-lg font-mono font-bold text-white">
                      {result?.space_complexity ?? '—'}
                    </p>
                    <div className="mt-2 h-1 w-full bg-zinc-800 rounded-full">
                      <div
                        className="h-full bg-secondary rounded-full transition-all duration-700"
                        style={{ width: result ? parseComplexityWidth(result.space_complexity) : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Narration Transcript */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="w-full p-4 shrink-0 flex items-center justify-between text-zinc-300 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">record_voice_over</span>
                    <span className="text-xs font-bold uppercase tracking-widest">Narration Script</span>
                  </div>
                  {result && (
                    <span className="text-[10px] text-emerald-400 font-mono">{result.narration_script.length} lines</span>
                  )}
                </div>

                <div className="flex-1 px-4 pb-4 overflow-y-auto no-scrollbar space-y-3 pt-4">
                  {!result ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
                      <span className="material-symbols-outlined text-4xl text-zinc-700">mic_off</span>
                      <p className="text-[11px] text-zinc-600 leading-relaxed">
                        Narration will appear here once you run an analysis.
                      </p>
                    </div>
                  ) : result.narration_script.length === 0 ? (
                    <p className="text-[11px] text-zinc-600 italic">No narration script returned.</p>
                  ) : (
                    result.narration_script.map((line, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-surface-container-low border border-white/5"
                        style={{ opacity: 1 - idx * (0.15 / result.narration_script.length) }}
                      >
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          <span className="text-primary-fixed-dim font-mono mr-1">[{String(idx + 1).padStart(2, '0')}]</span>
                          {line}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-4 shrink-0 bg-surface-container-high/20 border-t border-white/5 flex flex-col gap-2">
                <button className="w-full py-2 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all">
                  Upgrade Plan
                </button>
                <div className="flex justify-between items-center px-2 py-2">
                  <button className="text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-1 uppercase tracking-widest font-bold">
                    <span className="material-symbols-outlined text-sm">help</span>
                    Support
                  </button>
                  <button className="text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-1 uppercase tracking-widest font-bold">
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 flex flex-col items-center gap-2 border-t border-white/5 bg-zinc-950/80 backdrop-blur-md z-50">
        <div className="flex gap-6">
          <a className="text-xs text-zinc-600 hover:text-blue-400 transition-opacity duration-300" href="#">Privacy</a>
          <a className="text-xs text-zinc-600 hover:text-blue-400 transition-opacity duration-300" href="#">Terms</a>
          <a className="text-xs text-zinc-600 hover:text-blue-400 transition-opacity duration-300" href="#">Security</a>
          <a className="text-xs text-zinc-600 hover:text-blue-400 transition-opacity duration-300" href="#">Status</a>
        </div>
        <p className="font-inter text-[10px] text-zinc-500 uppercase tracking-widest">© 2024 CodeKino. Designed for macOS.</p>
      </footer>
    </>
  );
}
