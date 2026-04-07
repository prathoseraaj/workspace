import React from 'react';

export function WorkspaceFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-4 flex flex-col items-center gap-2 border-t border-white/5 bg-zinc-950/80 backdrop-blur-md z-50">
      <div className="flex gap-6">
        <a className="text-xs text-zinc-600 hover:text-blue-400 transition-opacity duration-300" href="#">Privacy</a>
        <a className="text-xs text-zinc-600 hover:text-blue-400 transition-opacity duration-300" href="#">Terms</a>
        <a className="text-xs text-zinc-600 hover:text-blue-400 transition-opacity duration-300" href="#">Security</a>
        <a className="text-xs text-zinc-600 hover:text-blue-400 transition-opacity duration-300" href="#">Status</a>
      </div>
      <p className="font-inter text-[10px] text-zinc-500 uppercase tracking-widest">© 2024 CodeKino. Designed for macOS.</p>
    </footer>
  );
}
