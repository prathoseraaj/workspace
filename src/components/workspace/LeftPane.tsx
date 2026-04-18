import React, { DragEvent, ChangeEvent, RefObject, forwardRef, useMemo } from 'react';
import { AnalyzeResponse, SupportedLanguage } from '../../types/workspace';
import Editor from '@monaco-editor/react';

const MATERIAL_ICONS: Record<string, string> = {
  python: 'terminal',
  javascript: 'data_object',
  typescript: 'data_object',
  java: 'local_cafe',
  c: 'memory',
  cpp: 'memory',
  go: 'speed',
  rust: 'settings',
  kotlin: 'integration_instructions',
  swift: 'phone_iphone',
  ruby: 'diamond',
};

const getIcon = (lang: string) => MATERIAL_ICONS[lang] || 'code';

interface LeftPaneProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  languages: SupportedLanguage[];
  placeholder: string;
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
    code, setCode, language, setLanguage, languages, placeholder,
    fileName, isDragging, isLoading, progress, result, error, statusLabel,
    fileInputRef, handleDragOver, handleDragLeave, handleDrop, handleFileChange, analyze
  } = props;

  const currentLang = languages.find((l) => l.key === language);
  const acceptedExts = languages.map((l) => l.ext).join(',');

  return (
    <section
      ref={ref}
      // Increased width to give Monaco editor breathing room (w-96 = 384px, or w-[420px])
      className="w-[420px] shrink-0 p-5 flex flex-col gap-4 bg-surface-container-lowest border-r border-white/5 overflow-hidden"
      style={{ opacity: 0 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Header row with Title & Upload ─────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white leading-tight">Input Source</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Code to analyse</p>
        </div>
        
        {/* Compact Upload button instead of huge dropzone */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${
            isDragging 
              ? 'border-blue-400 bg-blue-500/20 text-blue-300 shadow-[0_0_15px_rgba(96,165,250,0.3)]' 
              : 'border-white/10 bg-surface-container hover:bg-surface-container-high text-zinc-300'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">upload_file</span>
          <span>{fileName ? fileName : 'Upload file'}</span>
        </button>
        <input
          ref={fileInputRef}
          id="file-input"
          type="file"
          accept={acceptedExts}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Language selector ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col gap-1.5">
        <label htmlFor="language-select" className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 flex items-center justify-between">
          <span>Language Settings</span>
          <div className="flex items-center gap-1">
            {language === 'python' && (
              <span className="text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                Real Tracer ✓
              </span>
            )}
            {language !== 'python' && (
              <span className="text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
                LLM Simulated
              </span>
            )}
          </div>
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3 pointer-events-none flex items-center justify-center">
            <span className="material-symbols-outlined text-zinc-400 text-[18px]">
              {getIcon(language)}
            </span>
          </div>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full appearance-none rounded-lg bg-zinc-900/80 border border-white/10 text-sm font-semibold text-zinc-200 py-2 pl-10 pr-8 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer"
          >
            {languages.map((lang) => (
              <option key={lang.key} value={lang.key}>
                {lang.label} ({lang.ext})
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 text-zinc-500 text-sm material-symbols-outlined">
            expand_more
          </span>
        </div>
      </div>

      {/* ── Code Editor (Monaco flex-1) ────────────────────────────────────── */}
      <div className="flex-1 min-h-[250px] flex flex-col shrink rounded-xl overflow-hidden border border-white/5 bg-[#1e1e1e] relative shadow-lg">
        {/* Editor overlay for drag states */}
        {isDragging && (
          <div className="absolute inset-0 z-10 bg-blue-500/10 backdrop-blur-sm border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center">
             <div className="text-center">
               <span className="material-symbols-outlined text-4xl text-blue-400 mb-2">description</span>
               <p className="text-sm font-bold text-blue-300">Drop code here</p>
             </div>
          </div>
        )}
        <div className="bg-zinc-900/90 py-1.5 px-3 border-b border-white/5 flex items-center justify-between shrink-0">
           <span className="text-[10px] font-mono text-zinc-400">Editor</span>
        </div>
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : language === 'rust' ? 'rust' : language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 },
              lineNumbersMinChars: 3,
              renderLineHighlight: 'all',
              automaticLayout: true,
              formatOnPaste: true,
              formatOnType: true,
              autoIndent: 'full',
            }}
          />
          {!code && (
            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col">
              <span className="text-xs font-mono text-zinc-600 opacity-70 ml-8 mt-2 line-clamp-1">{placeholder}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <SyntaxErrorPanel error={error} code={code} language={language} />}

      {/* Analyse button */}
      <button
        id="analyze-btn"
        onClick={analyze}
        disabled={isLoading}
        className="shrink-0 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analysing…
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            Analyse Code
          </>
        )}
      </button>

      {/* Processing status bar */}
      <div className="shrink-0 rounded-lg bg-surface-container-high/40 p-3 border border-white/5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">Processing Status</span>
          <span className={`text-[9px] font-mono font-bold ${isLoading ? 'text-blue-400 animate-pulse' : result ? 'text-emerald-400' : 'text-zinc-600'}`}>
            {statusLabel}
          </span>
        </div>
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(170,199,255,0.4)]"
            style={{ width: isLoading ? `${progress}%` : result ? '100%' : '0%' }}
          />
        </div>
        <div className="flex gap-4 text-[10px] font-mono text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">ƒx</span>
            <span className="font-bold text-zinc-300">{result ? result.functions.length : '-'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">↻</span>
            <span className="font-bold text-zinc-300">{result ? result.loops : '-'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">☰</span>
            <span className="font-bold text-zinc-300">{result ? result.timeline_steps : '-'}</span>
          </div>
        </div>
      </div>
    </section>
  );
});
LeftPane.displayName = 'LeftPane';

// ── Smart error panel ─────────────────────────────────────────────────────────

interface SyntaxErrorPanelProps {
  error: string;
  code: string;
  language: string;
}

function SyntaxErrorPanel({ error, code, language }: SyntaxErrorPanelProps) {
  const lineMatch = error.match(/\bline\s+(\d+)/i);
  const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : null;

  const badLine = useMemo(() => {
    if (!lineNumber) return null;
    const lines = code.split('\n');
    return lines[lineNumber - 1] ?? null;
  }, [lineNumber, code]);

  const isSyntaxError = /syntax error/i.test(error);
  const langLabel = language.charAt(0).toUpperCase() + language.slice(1);

  return (
    <div className="shrink-0 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs space-y-2 max-h-40 overflow-y-auto no-scrollbar">
      <div className="flex items-center gap-1.5 text-red-400 font-bold text-[11px] uppercase tracking-wider">
        <span className="material-symbols-outlined text-[14px]">error</span>
        {isSyntaxError ? `${langLabel} Syntax Error` : 'Backend Error'}
      </div>

      <p className="text-red-300/80 font-mono leading-snug text-[10px]">{error}</p>

      {lineNumber !== null && (
        <div className="rounded-md bg-zinc-950 border border-red-500/10 overflow-hidden">
          <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 border-b border-red-500/10">
            <span className="material-symbols-outlined text-[10px] text-red-400">code</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">
              Line {lineNumber}
            </span>
          </div>
          {badLine !== null ? (
            <pre className="px-2 py-1.5 text-[10px] font-mono text-zinc-300 whitespace-pre-wrap break-all">
              <span className="text-zinc-600 select-none mr-2">{lineNumber}│</span>
              <span className="text-red-300">{badLine}</span>
            </pre>
          ) : (
            <p className="px-2 py-1.5 text-[9px] text-zinc-500 italic">Could not extract line.</p>
          )}
        </div>
      )}
    </div>
  );
}
