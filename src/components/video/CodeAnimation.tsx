import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring } from 'remotion';
import { AnalyzeResponse, StepLog } from '../../types/workspace';

interface CodeAnimationProps {
  data: AnalyzeResponse | null;
}

export const CodeAnimation: React.FC<CodeAnimationProps> = ({ data }) => {
  const frame = useCurrentFrame();

  if (!data || data.logic_timeline.length === 0) {
    return (
      <AbsoluteFill className="bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 font-mono text-xl">Waiting for analysis data...</div>
      </AbsoluteFill>
    );
  }

  // Calculate timelines. Assume each step takes about 60 frames (2 seconds at 30fps)
  const steps = data.logic_timeline;
  const framesPerStep = 90; // 3 seconds per logic step

  return (
    <AbsoluteFill className="bg-zinc-950/80 backdrop-blur-xl">
      {/* Background decoration representing the "Veo" layer underneath ideally */}
      <AbsoluteFill>
        <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-emerald-900/10 mix-blend-screen" />
      </AbsoluteFill>

      {steps.map((step, index) => {
        return (
          <Sequence
            key={step.step_number}
            from={index * framesPerStep}
            durationInFrames={framesPerStep}
          >
            <CodeStepSlide step={step} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const CodeStepSlide: React.FC<{ step: StepLog }> = ({ step }) => {
  const frame = useCurrentFrame();
  
  // Animate the opacity and position for a smooth slide-in
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const yOffset = spring({ frame, fps: 30, config: { damping: 200 } });

  const slideY = interpolate(yOffset, [0, 1], [50, 0]);

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center p-10">
      <div 
        className="w-full max-w-4xl flex flex-col gap-8 bg-zinc-900/60 p-8 rounded-2xl border border-white/10 shadow-2xl"
        style={{ opacity, transform: `translateY(${slideY}px)` }}
      >
        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xl">
            {step.step_number}
          </div>
          <h2 className="text-2xl font-semibold text-zinc-100">{step.description}</h2>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Code Execution</h3>
            <pre className="bg-zinc-950 p-6 rounded-xl border border-white/5 font-mono text-sm text-blue-300 overflow-hidden">
              {step.code_snippet}
            </pre>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Memory State</h3>
            {step.variable_changes.length > 0 ? (
              <div className="flex flex-col gap-3">
                {step.variable_changes.map((vc, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-xl border border-emerald-500/20">
                    <span className="font-mono text-emerald-400 font-bold">{vc.variable_name}</span>
                    <span className="text-zinc-500 material-symbols-outlined text-sm">arrow_forward</span>
                    <span className="font-mono text-white text-lg">{vc.new_value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-zinc-900/30 rounded-xl border border-dashed border-white/10 p-6">
                <span className="text-zinc-600 text-sm">No variables mutated</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
