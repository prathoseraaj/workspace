import React from 'react';
import { Composition } from 'remotion';
import { CodeAnimation } from './CodeAnimation';
import { AnalyzeResponse } from '../../types/workspace';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CodeTimeline"
        component={CodeAnimation}
        durationInFrames={300} // Dynamic duration ideally
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          data: null as AnalyzeResponse | null,
        }}
      />
    </>
  );
};
