import React, { forwardRef } from 'react';

export const WorkspaceNav = forwardRef<HTMLElement>((props, ref) => {
  return (
    <nav
      ref={ref}
      className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/70 backdrop-blur-3xl shadow-2xl shadow-black/50 flex justify-between items-center px-8 h-14"
      style={{ opacity: 0 }}
    >
      <div className="text-lg font-bold tracking-tighter text-zinc-100">CodeKino</div>
      <div className="hidden md:flex gap-8 items-center">
        <a className="font-inter tracking-tight text-sm font-medium text-blue-400 font-semibold hover:text-white transition-colors duration-200" href="#">Platform</a>
        <a className="font-inter tracking-tight text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200" href="#">Features</a>
        <a className="font-inter tracking-tight text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200" href="#">Complexity</a>
        <a className="font-inter tracking-tight text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200" href="#">Transcript</a>
      </div>
      <div className="flex items-center gap-4">
        <button className="px-4 py-1.5 bg-primary text-on-primary rounded-full text-sm font-medium scale-95 active:opacity-80 transition-all">Get Started</button>
      </div>
    </nav>
  );
});
WorkspaceNav.displayName = 'WorkspaceNav';
