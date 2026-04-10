'use client';

import React, { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from 'react';
import { gsap } from 'gsap';
import { AnalyzeResponse } from '../types/workspace';
import { WorkspaceNav } from '../components/workspace/WorkspaceNav';
import { WorkspaceFooter } from '../components/workspace/WorkspaceFooter';
import { LeftPane } from '../components/workspace/LeftPane';
import { MiddlePane } from '../components/workspace/MiddlePane';
import { RightPane } from '../components/workspace/RightPane';

export default function WorkspacePage() {
  const [code, setCode] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
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

      tl.fromTo(
        navRef.current,
        { y: -64, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 }
      );

      tl.fromTo(
        macWindowRef.current,
        { y: 40, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 0.75, ease: 'expo.out' },
        '-=0.3'
      );

      tl.fromTo(
        leftPaneRef.current,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6 },
        '-=0.55'
      );

      tl.fromTo(
        middlePaneRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        '-=0.45'
      );

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
    setVideoUri(null);
    setIsLoading(true);
    setProgress(10);

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
      setIsLoading(false);
      setProgress(0);
    }
  }, [code]);

  // ── Video Generation ────────────────────────────────────────────────────────
  
  const generateVideo = useCallback(async () => {
    if (!result) return;
    setIsGeneratingVideo(true);
    try {
      // Keep narration concise to avoid breaking URL parameters
      const narration = result.narration_script.join(' ').substring(0, 150);
      const res = await fetch('http://localhost:8000/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: narration }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.status === 'success') {
        setVideoUri(data.video_uri);
      } else {
        throw new Error(data.message || "Failed to generate video");
      }
    } catch (err: any) {
      console.error(err);
      alert("Veo Error: " + err.message);
    } finally {
      setIsGeneratingVideo(false);
    }
  }, [result]);

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
      <WorkspaceNav ref={navRef} />

      <div className="min-h-screen pt-14 pb-20 flex items-center justify-center px-4 bg-zinc-950">
        <main
          ref={macWindowRef}
          className="w-full max-w-6xl bg-surface-container-low rounded-xl mac-shadow overflow-hidden flex flex-col"
          style={{ minHeight: '600px', height: 'calc(100vh - 14rem)', opacity: 0 }}
        >
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
            <LeftPane
              ref={leftPaneRef}
              code={code}
              setCode={setCode}
              fileName={fileName}
              isDragging={isDragging}
              isLoading={isLoading}
              progress={progress}
              result={result}
              error={error}
              statusLabel={statusLabel}
              fileInputRef={fileInputRef}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleFileChange={handleFileChange}
              analyze={analyze}
            />

            <MiddlePane
              ref={middlePaneRef}
              result={result}
              resultsRef={resultsRef}
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              isGeneratingVideo={isGeneratingVideo}
              videoUri={videoUri}
              onGenerateVideo={generateVideo}
            />

            <RightPane
              ref={rightPaneRef}
              result={result}
            />
          </div>
        </main>
      </div>

      <WorkspaceFooter />
    </>
  );
}
