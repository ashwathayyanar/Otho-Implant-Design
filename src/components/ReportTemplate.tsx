import React from 'react';
import { MATERIAL_PROPERTIES, Material, PatientData, GeometryData, ImplantType, LoadCase } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';

interface Props {
  results: any;
  material: Material;
  patient: PatientData;
  geometry: GeometryData;
  implantType: ImplantType;
  loadCase: LoadCase;
  history: any[] | null;
  reportRef: React.RefObject<HTMLDivElement | null>;
}

export function ReportTemplate({ results, material, patient, geometry, implantType, loadCase, history, reportRef }: Props) {
  if (!results) return null;

  const yieldStrength = MATERIAL_PROPERTIES[material].yield;
  const safetyFactor = yieldStrength / results.maxStress;
  const isSafe = safetyFactor >= 1.5;

  const stressData = results.isOptimized ? [
    { name: 'Original', value: results.originalStress, fill: '#94a3b8' },
    { name: 'Optimized', value: results.maxStress, fill: '#10b981' }
  ] : [
    { name: 'Current', value: results.maxStress, fill: isSafe ? '#10b981' : '#ef4444' }
  ];

  const weightData = results.isOptimized ? [
    { name: 'Original', value: results.originalWeight, fill: '#94a3b8' },
    { name: 'Optimized', value: results.weight, fill: '#3b82f6' }
  ] : [
    { name: 'Current', value: results.weight, fill: '#3b82f6' }
  ];

  const safetyData = results.isOptimized ? [
    { name: 'Original', value: yieldStrength / results.originalStress, fill: '#94a3b8' },
    { name: 'Optimized', value: yieldStrength / results.maxStress, fill: '#f59e0b' }
  ] : [
    { name: 'Current', value: safetyFactor, fill: '#f59e0b' }
  ];

  // Convergence data for line chart
  const convergenceData = history ? history.map((h, i) => ({
    iteration: i,
    stress: h.stress,
    target: yieldStrength / 1.5
  })) : [];

  return (
    <div 
      ref={reportRef}
      className="bg-white text-slate-900 p-12 w-[850px] absolute -left-[9999px] top-0"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
            FEA
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Biomechanical Analysis</h1>
            <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Structural Engineering Report • Ortho FEA Suite</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Report Reference</p>
          <p className="text-xl font-mono font-bold text-slate-900">REF-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <div className="border-l-4 border-slate-900 pl-4 py-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Implant Type</p>
          <p className="font-bold text-slate-900 capitalize">{implantType.replace('_', ' ')}</p>
        </div>
        <div className="border-l-4 border-slate-900 pl-4 py-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Material</p>
          <p className="font-bold text-slate-900">{MATERIAL_PROPERTIES[material].name}</p>
        </div>
        <div className="border-l-4 border-slate-900 pl-4 py-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Patient Weight</p>
          <p className="font-bold text-slate-900">{patient.weight} kg</p>
        </div>
        <div className="border-l-4 border-slate-900 pl-4 py-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Safety Factor</p>
          <p className={`font-bold ${isSafe ? 'text-emerald-600' : 'text-red-600'}`}>{safetyFactor.toFixed(2)}</p>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-12 gap-10 mb-10">
        {/* Left Column: Metrics & Material */}
        <div className="col-span-4 space-y-8">
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-1">Material Properties</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Elastic Modulus:</span>
                <span className="font-bold">{MATERIAL_PROPERTIES[material].e}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Yield Strength:</span>
                <span className="font-bold">{MATERIAL_PROPERTIES[material].yield} MPa</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Poisson's Ratio:</span>
                <span className="font-bold">{MATERIAL_PROPERTIES[material].v}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Density:</span>
                <span className="font-bold">{MATERIAL_PROPERTIES[material].density} g/cm³</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-1">Patient Context</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Age:</span>
                <span className="font-bold">{patient.age} Yrs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Load Case:</span>
                <span className="font-bold capitalize">{loadCase}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Activity Multiplier:</span>
                <span className="font-bold">x{(results.maxStress / (patient.weight * 9.81 / 100)).toFixed(1)}</span>
              </div>
            </div>
          </section>

          <div className={`p-4 rounded-xl border-2 ${isSafe ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-[10px] font-black uppercase mb-1 tracking-widest">Status</p>
            <p className={`text-lg font-black ${isSafe ? 'text-emerald-700' : 'text-red-700'}`}>
              {isSafe ? 'CERTIFIED SAFE' : 'CRITICAL RISK'}
            </p>
          </div>
        </div>

        {/* Right Column: Graphs */}
        <div className="col-span-8 space-y-10">
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-1">Performance Benchmarks</h3>
            <div className="grid grid-cols-3 gap-4 h-48">
              <div className="flex flex-col">
                <p className="text-[9px] font-bold text-center text-slate-400 mb-2 uppercase">Stress (MPa)</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stressData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis fontSize={9} axisLine={false} tickLine={false} />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                      {stressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col">
                <p className="text-[9px] font-bold text-center text-slate-400 mb-2 uppercase">Mass (g)</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis fontSize={9} axisLine={false} tickLine={false} />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                      {weightData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col">
                <p className="text-[9px] font-bold text-center text-slate-400 mb-2 uppercase">Safety</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safetyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis fontSize={9} axisLine={false} tickLine={false} />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                      {safetyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {history && history.length > 1 && (
            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-1">Optimization Convergence</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={convergenceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="iteration" fontSize={9} axisLine={false} tickLine={false} label={{ value: 'Iterations', position: 'bottom', fontSize: 9 }} />
                    <YAxis fontSize={9} axisLine={false} tickLine={false} label={{ value: 'Stress (MPa)', angle: -90, position: 'insideLeft', fontSize: 9 }} />
                    <Line type="monotone" dataKey="stress" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="step" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Detailed Data Table */}
      <section className="mb-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-1">Simulation Data Matrix</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="py-2 text-[10px] font-black text-slate-900 uppercase">Parameter</th>
              <th className="py-2 text-[10px] font-black text-slate-900 uppercase">Current Value</th>
              <th className="py-2 text-[10px] font-black text-slate-900 uppercase">Unit</th>
              <th className="py-2 text-[10px] font-black text-slate-900 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-3 text-xs font-bold">Peak Von-Mises Stress</td>
              <td className="py-3 text-xs font-mono font-black">{results.maxStress.toFixed(2)}</td>
              <td className="py-3 text-xs text-slate-500">MPa</td>
              <td className="py-3 text-xs">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${results.maxStress < yieldStrength ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {results.maxStress < yieldStrength ? 'BELOW YIELD' : 'YIELD EXCEEDED'}
                </span>
              </td>
            </tr>
            <tr>
              <td className="py-3 text-xs font-bold">Maximum Displacement</td>
              <td className="py-3 text-xs font-mono font-black">{results.maxDeformation.toFixed(4)}</td>
              <td className="py-3 text-xs text-slate-500">mm</td>
              <td className="py-3 text-xs"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black">NOMINAL</span></td>
            </tr>
            <tr>
              <td className="py-3 text-xs font-bold">Fatigue Life (N)</td>
              <td className="py-3 text-xs font-mono font-black">{(results.fatigueLife / 1e6).toFixed(2)}M</td>
              <td className="py-3 text-xs text-slate-500">Cycles</td>
              <td className="py-3 text-xs"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black">CALCULATED</span></td>
            </tr>
            <tr>
              <td className="py-3 text-xs font-bold">Final Implant Mass</td>
              <td className="py-3 text-xs font-mono font-black">{results.weight.toFixed(2)}</td>
              <td className="py-3 text-xs text-slate-500">Grams</td>
              <td className="py-3 text-xs"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black">OPTIMIZED</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Legal & Footer */}
      <div className="flex justify-between items-end pt-8 border-t border-slate-200">
        <div className="max-w-md">
          <p className="text-[8px] text-slate-400 uppercase tracking-widest leading-relaxed font-medium">
            Disclaimer: This report is generated by an automated Finite Element Analysis (FEA) solver. 
            Results are based on mathematical models and should be validated by a certified biomechanical engineer 
            prior to clinical implementation. Ortho FEA Suite v2.5.
          </p>
        </div>
        <div className="text-right">
          <div className="inline-block border-2 border-slate-900 px-3 py-1 mb-2">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Validated</p>
          </div>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Page 01 of 01</p>
        </div>
      </div>
    </div>
  );
}

