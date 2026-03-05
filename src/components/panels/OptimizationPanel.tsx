import React from 'react';
import { Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Material, MATERIAL_PROPERTIES } from '../../App';

interface Props {
  onOptimize: () => void;
  isSimulating: boolean;
  history: any[] | null;
  material: Material;
}

export function OptimizationPanel({ onOptimize, isSimulating, history, material }: Props) {
  const yieldStrength = MATERIAL_PROPERTIES[material].yield;

  return (
    <div className="p-6 flex flex-col gap-6 h-full">
      <div>
        <h2 className="text-lg font-medium text-zinc-100 mb-1">Auto-Optimization</h2>
        <p className="text-sm text-zinc-400">Iteratively adjust geometry to minimize weight while keeping stress safe.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Objective & Constraints</h3>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Target Safety Factor</span>
              <span className="text-zinc-100 font-mono">1.5</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Allowable Stress</span>
              <span className="text-emerald-400 font-mono">{(yieldStrength / 1.5).toFixed(0)} MPa</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Objective</span>
              <span className="text-zinc-100">Minimize Weight</span>
            </div>
          </div>
        </div>

        {history && history.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Optimization Results</h3>
            
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 mt-0.5" size={20} />
              <div>
                <h4 className="font-medium text-emerald-400">Optimization Complete</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Converged in {history.length - 1} iterations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Original</div>
                <div className="text-sm font-mono text-zinc-300">{history[0].stress.toFixed(0)} MPa</div>
              </div>
              <div className="flex items-center justify-center text-zinc-600">
                <ArrowRight size={16} />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                <div className="text-[10px] text-emerald-500 uppercase mb-1">Optimized</div>
                <div className="text-sm font-mono text-emerald-400">{history[history.length - 1].stress.toFixed(0)} MPa</div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
              <div className="text-xs font-medium text-zinc-300 mb-2">Geometry Changes</div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Thickness</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-zinc-400">{history[0].geom.thickness.toFixed(1)}</span>
                  <ArrowRight size={12} className="text-zinc-600" />
                  <span className="text-emerald-400">{history[history.length - 1].geom.thickness.toFixed(1)} mm</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Width</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-zinc-400">{history[0].geom.width.toFixed(1)}</span>
                  <ArrowRight size={12} className="text-zinc-600" />
                  <span className="text-emerald-400">{history[history.length - 1].geom.width.toFixed(1)} mm</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Length</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-zinc-400">{history[0].geom.length.toFixed(1)}</span>
                  <ArrowRight size={12} className="text-zinc-600" />
                  <span className="text-emerald-400">{history[history.length - 1].geom.length.toFixed(1)} mm</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-zinc-800">
                <span className="text-zinc-500">Weight</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-zinc-400">{history[0].weight.toFixed(1)}</span>
                  <ArrowRight size={12} className="text-zinc-600" />
                  <span className="text-zinc-100">{history[history.length - 1].weight.toFixed(1)} g</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={onOptimize}
          disabled={isSimulating}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSimulating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Zap size={18} />
              Run Auto-Optimization
            </>
          )}
        </button>
      </div>
    </div>
  );
}
