import React, { DragEvent, ChangeEvent, RefObject, forwardRef } from 'react';
import { AnalyzeResponse } from '../../types/workspace';

interface LeftPaneProps {
  code: string;
  setCode: (code: string) => void;
  fileName: string | null;
  isDragging: boolean;
  isLoading: boolean;
  progress: number;
  result: AnalyzeResponse | null;
  error: string | null;
  statusLabel: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleDragOver: (e: DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  analyze: () => void;
}

export const LeftPane = forwardRef<HTMLElement, LeftPaneProps>((props, ref) => {
  const {
    code, setCode, fileName, isDragging, isLoading, progress, result, error, statusLabel,
    fileInputRef, handleDragOver, handleDragLeave, handleDrop, handleFileChange, analyze
  } = props;

  return (
    <section
      ref={ref}
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
  );
});
LeftPane.displayName = 'LeftPane';
