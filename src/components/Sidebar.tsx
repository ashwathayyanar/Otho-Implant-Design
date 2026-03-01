import React from 'react';
import { cn } from '../lib/utils';
import { Tab } from '../App';
import { Box, Layers, Activity, Zap, BarChart3 } from 'lucide-react';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: 'design', icon: Box, label: 'Design' },
    { id: 'material', icon: Layers, label: 'Material' },
    { id: 'fea', icon: Activity, label: 'FEA Setup' },
    { id: 'optimization', icon: Zap, label: 'Optimize' },
    { id: 'results', icon: BarChart3, label: 'Results' },
  ] as const;

  return (
    <div className="w-16 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-4 gap-4">
      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-4">
        <Activity size={24} />
      </div>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative group",
            activeTab === tab.id 
              ? "bg-zinc-800 text-zinc-100" 
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
          )}
        >
          <tab.icon size={20} />
          <div className="absolute left-14 bg-zinc-800 text-zinc-100 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
            {tab.label}
          </div>
        </button>
      ))}
    </div>
  );
}
