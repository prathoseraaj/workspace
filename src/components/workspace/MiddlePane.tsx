'use client';

import React, { forwardRef, RefObject, useState, useCallback } from 'react';
import { AnalyzeResponse, TraceResult } from '../../types/workspace';
import { Player } from '@remotion/player';
import { CodeAnimation } from '../video/CodeAnimation';
import { StepTracer } from './StepTracer';

interface MiddlePaneProps {
  result: AnalyzeResponse | null;
  resultsRef: RefObject<HTMLDivElement | null>;
  activeStep: number | null;
  setActiveStep: (step: number | null) => void;
  isGeneratingVideo: boolean;
  videoUri: string | null;
  onGenerateVideo: () => void;
  /** Called with the LLM-corrected source when /trace auto-fixes indentation */
  onCodeFixed?: (fixedCode: string) => void;
}

type Tab = 'analysis' | 'tracer';

export const MiddlePane = forwardRef<HTMLElement, MiddlePaneProps>((props, ref) => {
  const { result, resultsRef, activeStep, setActiveStep, isGeneratingVideo, videoUri, onGenerateVideo, onCodeFixed } = props;

  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const [trace, setTrace] = useState<TraceResult | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);

  const runTrace = useCallback(async () => {
    if (!result) return;
    setIsTracing(true);
    setTraceError(null);
    try {
      // We need the original code — fetch from the analyze result context isn't available here,
      // so we re-use the code stored via the narration script as a proxy check.
      // The trace endpoint needs the code — we pass it from the parent via a separate channel.
      // For now we POST to /trace with the narration as a source hint; the real code must come from parent.
      // Since MiddlePane doesn't hold the code, we store it in a hidden data attribute set by WorkspacePage.
      const codeEl = document.getElementById('__codekino_code__') as HTMLTextAreaElement | null;
      const code = codeEl?.value ?? '';
      if (!code) {
        setTraceError('Could not read source code. Please re-analyze first.');
        return;
      }
      const res = await fetch('http://localhost:8000/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: TraceResult = await res.json();
      if (data.error) throw new Error(data.error);
      // If the tracer also auto-fixed indentation, bubble it up
      if (data.fixed_code && onCodeFixed) {
        onCodeFixed(data.fixed_code);
      }
      setTrace(data);
      setActiveTab('tracer');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setTraceError(message);
    } finally {
      setIsTracing(false);
    }
  }, [result]);

  return (
    <section
      ref={ref}
      className="flex-1 bg-surface border-r border-white/5 flex flex-col relative overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-0 shrink-0 border-b border-white/5">
        <button
          id="tab-analysis"
          onClick={() => setActiveTab('analysis')}
          className={`px-3 py-1.5 rounded-t-lg text-[11px] font-semibold transition-all ${
            activeTab === 'analysis'
              ? 'bg-surface-container-high/60 text-zinc-200 border-x border-t border-white/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Analysis
        </button>
        <button
          id="tab-tracer"
          onClick={() => (trace ? setActiveTab('tracer') : runTrace())}
          className={`px-3 py-1.5 rounded-t-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'tracer'
              ? 'bg-surface-container-high/60 text-purple-300 border-x border-t border-purple-500/20'
              : result
              ? 'text-zinc-500 hover:text-purple-300'
              : 'text-zinc-700 cursor-not-allowed'
          }`}
          disabled={!result && !isTracing}
        >
          {isTracing ? (
            <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-purple-400 text-[12px]">◈</span>
          )}
          Live Step Tracer
          {!trace && result && !isTracing && (
            <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
          )}
        </button>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-4 min-h-0">

        {/* === ANALYSIS TAB === */}
        {activeTab === 'analysis' && (
          <>
            <div className="flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${result ? 'bg-emerald-400' : 'bg-secondary'}`} />
                <h2 className="text-sm font-semibold text-zinc-300">
                  {result ? 'Analysis Results' : 'Live Preview'}
                </h2>
              </div>
            </div>

            {/* Empty state */}
            {!result && (
              <div className="flex-1 rounded-xl overflow-hidden bg-zinc-900/60 border border-white/5 flex flex-col items-center justify-center gap-5 min-h-48">
                <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <span className="material-symbols-outlined text-5xl">movie</span>
                </div>
                <div className="text-center space-y-1 px-6">
                  <p className="text-base font-semibold text-zinc-200">Veo Video Generation Ready</p>
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                    Upload a Python file and run analysis to unlock Veo-powered cinematic backgrounds based on your code logic.
                  </p>
                </div>
                <div className="px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/5 text-[10px] uppercase tracking-widest font-bold text-blue-400">
                  Veo Enabled
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div ref={resultsRef} className="flex flex-col gap-4">
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
                        <span key={fn.name} className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-300">
                          {fn.name}({fn.args.join(', ')})
                          <span className="ml-1.5 text-zinc-500 text-[10px]">L{fn.line_start}–{fn.line_end}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step Tracer promo card */}
                <div data-animate className="shrink-0 rounded-xl bg-gradient-to-br from-purple-900/30 to-blue-900/20 border border-purple-500/20 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                    <span className="text-purple-400 text-xl">◈</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-200">Live Step Tracer — New!</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Watch variables flow through your code, cinematic & animated.
                    </p>
                    {traceError && <p className="text-[10px] text-red-400 mt-1">{traceError}</p>}
                  </div>
                  <button
                    id="launch-tracer"
                    onClick={runTrace}
                    disabled={isTracing}
                    className="ml-auto px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[10px] uppercase font-bold transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    {isTracing ? (
                      <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Tracing…</>
                    ) : (
                      trace ? 'Re-trace' : 'Trace It'
                    )}
                  </button>
                </div>

                {/* Video section */}
                <div data-animate className="shrink-0 rounded-xl bg-zinc-800/40 border border-white/10 p-4 flex flex-col gap-4">
                  {videoUri ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                        <p className="text-sm font-semibold text-zinc-200">Cinematic Background Video Applied</p>
                      </div>
                      <div className="w-full rounded-xl overflow-hidden aspect-video relative border border-white/10 shadow-2xl">
                        {videoUri === 'remotion-video-ready' ? (
                          <Player
                            component={CodeAnimation}
                            inputProps={{ data: result }}
                            durationInFrames={result.logic_timeline.length > 0 ? result.logic_timeline.length * 90 : 300}
                            fps={30}
                            compositionWidth={1920}
                            compositionHeight={1080}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            controls autoPlay loop
                          />
                        ) : videoUri.endsWith('.mp4') ? (
                          <video src={videoUri} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={videoUri} alt="AI Generated Background" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                        {isGeneratingVideo ? (
                          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-2xl">movie</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-zinc-300">
                          {isGeneratingVideo ? 'Generating cinematic video...' : 'Video Background Available'}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {isGeneratingVideo ? 'Applying an abstract AI coding sequence...' : 'Add a free, cinematic video loop for your code animation.'}
                        </p>
                      </div>
                      {!isGeneratingVideo && (
                        <button onClick={onGenerateVideo} className="ml-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold transition-colors shrink-0">
                          Generate
                        </button>
                      )}
                    </div>
                  )}
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
          </>
        )}

        {/* === TRACER TAB === */}
        {activeTab === 'tracer' && (
          <>
            {isTracing && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
                <p className="text-sm font-semibold text-zinc-300">Generating execution trace…</p>
                <p className="text-xs text-zinc-500">Gemini is tracing your code step-by-step</p>
              </div>
            )}
            {!isTracing && traceError && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-4xl text-red-400">error</span>
                <p className="text-sm font-semibold text-zinc-300">Trace Failed</p>
                <p className="text-xs text-zinc-500 max-w-xs text-center">{traceError}</p>
                <button onClick={runTrace} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors mt-2">
                  Retry
                </button>
              </div>
            )}
            {!isTracing && !traceError && trace && (
              <div className="flex-1 min-h-0 flex flex-col">
                <StepTracer trace={trace} />
              </div>
            )}
            {!isTracing && !traceError && !trace && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <span className="text-4xl">◈</span>
                </div>
                <p className="text-sm font-semibold text-zinc-300">No trace yet</p>
                <button onClick={runTrace} disabled={!result} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white text-xs font-bold transition-colors">
                  Run Trace
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
});
MiddlePane.displayName = 'MiddlePane';
