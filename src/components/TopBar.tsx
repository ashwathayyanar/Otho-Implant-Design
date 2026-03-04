import React from 'react';
import { Settings, Download, Share2 } from 'lucide-react';

export function TopBar() {
  return (
    <div className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="font-semibold text-zinc-100 tracking-tight">OrthoFEA <span className="text-emerald-500">Simulation</span></h1>
        <div className="h-4 w-px bg-zinc-800" />
        <span className="text-xs font-mono text-zinc-500">Model</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="text-zinc-400 hover:text-zinc-100 transition-colors p-2">
          <Share2 size={18} />
        </button>
        <button className="text-zinc-400 hover:text-zinc-100 transition-colors p-2">
          <Download size={18} />
        </button>
        <button className="text-zinc-400 hover:text-zinc-100 transition-colors p-2">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
