'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TraceResult, TraceStep } from '../../types/workspace';

interface StepTracerProps {
  trace: TraceResult;
}

const HIGHLIGHT_COLORS: Record<string, { bg: string; border: string; dot: string; badge: string }> = {
  normal:       { bg: 'bg-blue-500/8',    border: 'border-blue-500/20',   dot: 'bg-blue-400',    badge: 'bg-blue-500/15 text-blue-300' },
  branch_true:  { bg: 'bg-emerald-500/8', border: 'border-emerald-500/20', dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300' },
  branch_false: { bg: 'bg-amber-500/8',   border: 'border-amber-500/20',  dot: 'bg-amber-400',   badge: 'bg-amber-500/15 text-amber-300' },
  swap:         { bg: 'bg-purple-500/8',  border: 'border-purple-500/20', dot: 'bg-purple-400',  badge: 'bg-purple-500/15 text-purple-300' },
  return:       { bg: 'bg-rose-500/8',    border: 'border-rose-500/20',   dot: 'bg-rose-400',    badge: 'bg-rose-500/15 text-rose-300' },
  call:         { bg: 'bg-cyan-500/8',    border: 'border-cyan-500/20',   dot: 'bg-cyan-400',    badge: 'bg-cyan-500/15 text-cyan-300' },
};

const HIGHLIGHT_LABELS: Record<string, string> = {
  normal: 'exec',
  branch_true: 'true ✓',
  branch_false: 'false ✗',
  swap: '⇄ swap',
  return: '↩ return',
  call: '→ call',
};

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'True' : 'False';
  if (Array.isArray(val)) return `[${val.join(', ')}]`;
  return String(val);
}

function getBarWidth(val: unknown, varName: string): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'boolean') return val ? 75 : 20;
  if (typeof val === 'number') {
    // Clamp to 10–100%
    const pct = Math.min(Math.abs(val) * 12, 100);
    return Math.max(pct, 8);
  }
  if (Array.isArray(val)) return Math.min((val.length / 10) * 100, 100);
  return 50;
}

function MemoryBar({ varName, val, prevVal }: { varName: string; val: unknown; prevVal: unknown }) {
  const changed = JSON.stringify(val) !== JSON.stringify(prevVal) && prevVal !== undefined;
  const width = getBarWidth(val, varName);
  const isNull = val === null || val === undefined;

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${changed ? 'bg-white/5' : ''}`}>
      <span className="text-[11px] font-mono text-zinc-400 min-w-[52px] text-right shrink-0">{varName}</span>
      <div className="flex-1 h-6 bg-zinc-800/80 rounded-md overflow-hidden relative border border-white/5">
        <div
          className={`h-full rounded-md transition-all duration-500 ease-out ${
            changed ? 'bg-blue-500/60' : 'bg-blue-500/25'
          }`}
          style={{ width: isNull ? '0%' : `${width}%` }}
        />
        {changed && (
          <div className="absolute inset-0 bg-blue-400/10 animate-pulse rounded-md pointer-events-none" />
        )}
        <span
          className={`absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-mono font-medium transition-all duration-300 ${
            changed ? 'text-blue-300' : 'text-zinc-400'
          }`}
        >
          {formatValue(val)}
        </span>
      </div>
      {changed && (
        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest shrink-0 animate-pulse">
          ↑
        </span>
      )}
    </div>
  );
}

function CodeLineView({
  line,
  lineNumber,
  isActive,
  isVisited,
}: {
  line: string;
  lineNumber: number;
  isActive: boolean;
  isVisited: boolean;
}) {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && lineRef.current) {
      lineRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isActive]);

  return (
    <div
      ref={lineRef}
      className={`flex items-center gap-2 px-3 py-[3px] rounded-md transition-all duration-200 font-mono text-[12px] ${
        isActive
          ? 'bg-blue-500/15 border border-blue-500/30 translate-x-1 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
          : isVisited
          ? 'opacity-40'
          : 'opacity-70'
      }`}
    >
      {/* Active pulse dot */}
      <div
        className={`w-[6px] h-[6px] rounded-full shrink-0 transition-all duration-200 ${
          isActive ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]' : 'bg-transparent'
        }`}
      />
      {/* Line number */}
      <span className={`text-[10px] min-w-[22px] text-right select-none shrink-0 ${isActive ? 'text-blue-400' : 'text-zinc-600'}`}>
        {lineNumber}
      </span>
      {/* Code text */}
      <span className={`whitespace-pre ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`}>
        {line || ' '}
      </span>
    </div>
  );
}

export function StepTracer({ trace }: StepTracerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = trace.steps[currentIdx];
  const prevStep = currentIdx > 0 ? trace.steps[currentIdx - 1] : undefined;
  const colors = HIGHLIGHT_COLORS[step?.highlight_type ?? 'normal'] ?? HIGHLIGHT_COLORS.normal;

  // Autoplay
  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setCurrentIdx((i) => {
          if (i >= trace.steps.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, 1400);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, trace.steps.length]);

  const goNext = useCallback(() => {
    setCurrentIdx((i) => Math.min(i + 1, trace.steps.length - 1));
  }, [trace.steps.length]);

  const goPrev = useCallback(() => {
    setCurrentIdx((i) => Math.max(i - 1, 0));
  }, []);

  const togglePlay = useCallback(() => {
    if (currentIdx >= trace.steps.length - 1) setCurrentIdx(0);
    setPlaying((p) => !p);
  }, [currentIdx, trace.steps.length]);

  if (!step) return null;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
          <span className="text-xs font-semibold text-zinc-200">{trace.title}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
          {HIGHLIGHT_LABELS[step.highlight_type] ?? step.highlight_type}
        </span>
      </div>

      {/* Main 2-col grid */}
      <div className="flex gap-3 flex-1 min-h-0 overflow-hidden">

        {/* LEFT — Source code pane */}
        <div className="flex-1 min-w-0 flex flex-col bg-zinc-900/70 rounded-xl border border-white/5 overflow-hidden">
          <div className="px-3 py-2 border-b border-white/5 shrink-0">
            <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">
              Source — {trace.language}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-1">
            {trace.source_lines.map((line, i) => {
              const lineNum = i + 1;
              const isActive = lineNum === step.line_number;
              const isVisited = lineNum < step.line_number;
              return (
                <CodeLineView
                  key={i}
                  line={line}
                  lineNumber={lineNum}
                  isActive={isActive}
                  isVisited={isVisited}
                />
              );
            })}
          </div>
        </div>

        {/* RIGHT — Memory state pane */}
        <div className="w-52 shrink-0 flex flex-col bg-zinc-900/70 rounded-xl border border-white/5 overflow-hidden">
          <div className="px-3 py-2 border-b border-white/5 shrink-0">
            <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">
              Memory State
            </span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar py-2 flex flex-col gap-1">
            {trace.tracked_variables.map((varName) => {
              const val = step.memory.variables[varName];
              const prevVal = prevStep?.memory?.variables?.[varName];
              return (
                <MemoryBar key={varName} varName={varName} val={val} prevVal={prevVal} />
              );
            })}
          </div>
          {/* Loop label */}
          {step.is_loop_iteration && step.loop_label && (
            <div className="px-3 py-2 border-t border-white/5 shrink-0">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {step.loop_label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description banner */}
      <div className={`shrink-0 rounded-xl border px-4 py-2.5 ${colors.bg} ${colors.border} transition-all duration-300`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
          <span className="text-[11px] font-sans text-zinc-200 leading-snug">
            <span className="font-bold text-zinc-400 mr-2 font-mono text-[10px]">step {step.step_number}</span>
            {step.description}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 flex items-center gap-3">
        {/* Prev */}
        <button
          id="tracer-prev"
          onClick={goPrev}
          disabled={currentIdx === 0}
          className="w-8 h-8 rounded-full border border-white/10 bg-zinc-800/60 flex items-center justify-center text-zinc-300 hover:bg-zinc-700/60 disabled:opacity-30 transition-all"
        >
          <span className="material-symbols-outlined text-base">chevron_left</span>
        </button>

        {/* Play/Pause */}
        <button
          id="tracer-play"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full border border-blue-500/40 bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-all"
        >
          <span className="material-symbols-outlined text-base">
            {playing ? 'pause' : 'play_arrow'}
          </span>
        </button>

        {/* Next */}
        <button
          id="tracer-next"
          onClick={goNext}
          disabled={currentIdx === trace.steps.length - 1}
          className="w-8 h-8 rounded-full border border-white/10 bg-zinc-800/60 flex items-center justify-center text-zinc-300 hover:bg-zinc-700/60 disabled:opacity-30 transition-all"
        >
          <span className="material-symbols-outlined text-base">chevron_right</span>
        </button>

        {/* Step dots scrubber */}
        <div className="flex-1 flex gap-[3px] items-center h-3">
          {trace.steps.map((_, i) => (
            <button
              key={i}
              id={`tracer-dot-${i}`}
              onClick={() => { setCurrentIdx(i); setPlaying(false); }}
              className={`flex-1 h-[4px] rounded-full transition-all duration-200 ${
                i < currentIdx
                  ? 'bg-blue-500/50'
                  : i === currentIdx
                  ? 'bg-blue-400 h-[6px]'
                  : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Step counter */}
        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
          {currentIdx + 1} / {trace.steps.length}
        </span>
      </div>
    </div>
  );
}
