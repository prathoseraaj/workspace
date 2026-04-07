import React, { forwardRef } from 'react';
import { AnalyzeResponse } from '../../types/workspace';

interface RightPaneProps {
  result: AnalyzeResponse | null;
}

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

export const RightPane = forwardRef<HTMLElement, RightPaneProps>((props, ref) => {
  const { result } = props;

  return (
    <aside
      ref={ref}
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
  );
});
RightPane.displayName = 'RightPane';
