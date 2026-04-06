import WorkspacePage from './WorkspacePage';

export const metadata = {
  title: 'CodeKino — Python Code Analyser',
  description: 'Paste or upload a Python script and get instant AST analysis, complexity breakdowns, and a narration script powered by Gemini.',
};

export default function Page() {
  return <WorkspacePage />;
}