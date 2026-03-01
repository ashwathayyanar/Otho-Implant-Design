import React from 'react';
import { Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MATERIAL_PROPERTIES, Material } from '../../App';

interface Props {
  results: any;
  material: Material;
}

export function ResultsPanel({ results, material }: Props) {
  if (!results) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center gap-4">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h3 className="text-zinc-300 font-medium mb-1">No Results Available</h3>
          <p className="text-sm text-zinc-500">Run a simulation or optimization to view results.</p>
        </div>
      </div>
    );
  }

  const yieldStrength = MATERIAL_PROPERTIES[material].yield;
  const safetyFactor = yieldStrength / results.maxStress;
  const isSafe = safetyFactor >= 1.5;

  const chartData = results.isOptimized ? [
    { name: 'Original', stress: results.originalStress, fill: '#ef4444' },
    { name: 'Optimized', stress: results.maxStress, fill: '#22c55e' }
  ] : [
    { name: 'Current Design', stress: results.maxStress, fill: isSafe ? '#22c55e' : '#ef4444' }
  ];

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium text-zinc-100 mb-1">Simulation Results</h2>
        <p className="text-sm text-zinc-400">Analysis complete. Review key metrics below.</p>
      </div>

      <div className={`p-4 rounded-xl border flex items-start gap-3 ${isSafe ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        {isSafe ? <CheckCircle2 className="text-emerald-500 mt-0.5" size={20} /> : <AlertTriangle className="text-red-500 mt-0.5" size={20} />}
        <div>
          <h4 className={`font-medium ${isSafe ? 'text-emerald-400' : 'text-red-400'}`}>
            {isSafe ? 'Design is Safe' : 'Design Risk Detected'}
          </h4>
          <p className="text-xs text-zinc-400 mt-1">
            Minimum safety factor is {safetyFactor.toFixed(2)}. {isSafe ? 'Meets standard criteria (≥1.5).' : 'Below recommended threshold. Try Auto-Optimization.'}
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl h-48">
        <div className="text-xs font-mono text-zinc-500 uppercase mb-2">Stress Comparison (MPa)</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{fill: '#27272a'}}
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
            />
            <ReferenceLine y={yieldStrength / 1.5} stroke="#eab308" strokeDasharray="3 3" label={{ position: 'top', value: 'Allowable', fill: '#eab308', fontSize: 10 }} />
            <Bar dataKey="stress" radius={[4, 4, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="text-xs font-mono text-zinc-500 uppercase mb-1">Max Stress</div>
          <div className={`text-xl font-medium ${isSafe ? 'text-zinc-100' : 'text-red-400'}`}>
            {results.maxStress.toFixed(1)} <span className="text-sm text-zinc-500">MPa</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="text-xs font-mono text-zinc-500 uppercase mb-1">Max Deformation</div>
          <div className="text-xl font-medium text-zinc-100">
            {results.maxDeformation.toFixed(3)} <span className="text-sm text-zinc-500">mm</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="text-xs font-mono text-zinc-500 uppercase mb-1">Est. Fatigue Life</div>
          <div className="text-xl font-medium text-zinc-100">
            {(results.fatigueLife / 1000000).toFixed(2)}M <span className="text-sm text-zinc-500">cycles</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="text-xs font-mono text-zinc-500 uppercase mb-1">Implant Weight</div>
          <div className="text-xl font-medium text-zinc-100">
            {results.weight.toFixed(1)} <span className="text-sm text-zinc-500">g</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 space-y-3">
        <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <Download size={18} />
          Export Report (PDF)
        </button>
      </div>
    </div>
  );
}
