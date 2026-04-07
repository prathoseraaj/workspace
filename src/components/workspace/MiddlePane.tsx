import React, { forwardRef, RefObject } from 'react';
import { AnalyzeResponse } from '../../types/workspace';

interface MiddlePaneProps {
  result: AnalyzeResponse | null;
  resultsRef: RefObject<HTMLDivElement | null>;
  activeStep: number | null;
  setActiveStep: (step: number | null) => void;
  isGeneratingVideo: boolean;
  videoUri: string | null;
  onGenerateVideo: () => void;
}

export const MiddlePane = forwardRef<HTMLElement, MiddlePaneProps>((props, ref) => {
  const { result, resultsRef, activeStep, setActiveStep, isGeneratingVideo, videoUri, onGenerateVideo } = props;

  return (
    <section
      ref={ref}
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

          {/* Video placeholder ribbon / Generation Action */}
          <div data-animate className="shrink-0 rounded-xl bg-zinc-800/40 border border-white/10 p-4 flex flex-col gap-4">
            {videoUri ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                  <p className="text-sm font-semibold text-zinc-200">Cinematic Background Generated</p>
                </div>
                <div className="w-full rounded-xl overflow-hidden aspect-video relative border border-white/10 shadow-2xl">
                  {/* We apply a slow zoom effect to make the image feel like a static video/b-roll */}
                  <img 
                    src={videoUri} 
                    alt="Generated Code Visualization"
                    className="w-full h-full object-cover animate-[pulse_10s_ease-in-out_infinite] scale-105 transition-transform duration-[20s] hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  {isGeneratingVideo ? (
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-2xl">image</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-zinc-300">
                    {isGeneratingVideo ? 'Generating cinematic background...' : 'Free Visual Background Available'}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {isGeneratingVideo 
                      ? "Creating an AI generated scene for your code..."
                      : "Create a free AI-generated cinematic image background."}
                  </p>
                </div>
                {!isGeneratingVideo && (
                  <button 
                    onClick={onGenerateVideo}
                    className="ml-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold transition-colors shrink-0"
                  >
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
    </section>
  );
});
MiddlePane.displayName = 'MiddlePane';
