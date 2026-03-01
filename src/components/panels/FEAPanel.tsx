import React from 'react';
import { LoadCase } from '../../App';
import { cn } from '../../lib/utils';
import { Play } from 'lucide-react';

interface Props {
  loadCase: LoadCase;
  setLoadCase: (lc: LoadCase) => void;
  onSimulate: () => void;
  isSimulating: boolean;
  elementSize: number;
  setElementSize: (size: number) => void;
  adaptiveRefinement: boolean;
  setAdaptiveRefinement: (val: boolean) => void;
}

export function FEAPanel({ 
  loadCase, setLoadCase, onSimulate, isSimulating,
  elementSize, setElementSize, adaptiveRefinement, setAdaptiveRefinement
}: Props) {
  const loadCases: { id: LoadCase; label: string; desc: string }[] = [
    { id: 'walking', label: 'Walking Gait', desc: 'Dynamic load profile for normal walking' },
    { id: 'stair', label: 'Stair Climbing', desc: 'High torsion and bending moments' },
    { id: 'jump', label: 'Jump Impact', desc: 'Peak impact loading (3x body weight)' },
    { id: 'iso', label: 'ISO Standard', desc: 'ISO 7206-4 fatigue testing conditions' },
  ];

  return (
    <div className="p-6 flex flex-col gap-6 h-full">
      <div>
        <h2 className="text-lg font-medium text-zinc-100 mb-1">FEA Setup</h2>
        <p className="text-sm text-zinc-400">Configure boundary conditions and run solver.</p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Load Case</h3>
        <div className="grid gap-2">
          {loadCases.map((lc) => (
            <button
              key={lc.id}
              onClick={() => setLoadCase(lc.id)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all",
                loadCase === lc.id
                  ? "bg-emerald-500/10 border-emerald-500/50"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
              )}
            >
              <div className="font-medium text-zinc-100 text-sm mb-1">{lc.label}</div>
              <div className="text-xs text-zinc-500">{lc.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800">
        <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Mesh Settings</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Global Element Size</span>
              <span className="text-zinc-100 font-mono">{elementSize.toFixed(1)} mm</span>
            </div>
            <input 
              type="range" 
              className="w-full accent-emerald-500" 
              value={elementSize} 
              min={0.5} 
              max={5} 
              step={0.1} 
              onChange={(e) => setElementSize(parseFloat(e.target.value))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input 
              type="checkbox" 
              checked={adaptiveRefinement}
              onChange={(e) => setAdaptiveRefinement(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500" 
            />
            Adaptive refinement near holes
          </label>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={onSimulate}
          disabled={isSimulating}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSimulating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Solving...
            </>
          ) : (
            <>
              <Play size={18} />
              Run Simulation
            </>
          )}
        </button>
      </div>
    </div>
  );
}
