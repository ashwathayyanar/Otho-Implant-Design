import React from 'react';
import { Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MATERIAL_PROPERTIES, Material, PatientData, GeometryData, ImplantType, LoadCase } from '../../App';
import { jsPDF } from 'jspdf';

interface Props {
  results: any;
  material: Material;
  patient: PatientData;
  geometry: GeometryData;
  implantType: ImplantType;
  loadCase: LoadCase;
}

export function ResultsPanel({ results, material, patient, geometry, implantType, loadCase }: Props) {
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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.text('Ortho FEA Simulation Report', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 28);
    
    // 1. Configuration Details
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('1. Configuration Details', 20, 45);
    
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`Implant Type: ${implantType.replace('_', ' ').toUpperCase()}`, 25, 55);
    doc.text(`Material: ${MATERIAL_PROPERTIES[material].name} (${material})`, 25, 63);
    doc.text(`Load Case: ${loadCase.toUpperCase()}`, 25, 71);
    
    doc.text(`Patient Age: ${patient.age} years`, 120, 55);
    doc.text(`Patient Weight: ${patient.weight} kg`, 120, 63);
    
    doc.text(`Geometry: ${geometry.length.toFixed(1)}L x ${geometry.width.toFixed(1)}W x ${geometry.thickness.toFixed(1)}T mm`, 25, 79);
    
    // 2. Simulation Results
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('2. Simulation Results', 20, 95);
    
    doc.setFontSize(11);
    if (isSafe) {
      doc.setTextColor(16, 185, 129); // Green
      doc.text('Status: SAFE (Meets standard criteria)', 25, 105);
    } else {
      doc.setTextColor(239, 68, 68); // Red
      doc.text('Status: RISK DETECTED (Below recommended threshold)', 25, 105);
    }
    
    doc.setTextColor(50, 50, 50);
    doc.text(`Safety Factor: ${safetyFactor.toFixed(2)} (Target: >= 1.5)`, 25, 115);
    
    doc.text(`Maximum Stress: ${results.maxStress.toFixed(1)} MPa`, 25, 125);
    doc.text(`Allowable Yield Stress: ${yieldStrength} MPa`, 25, 133);
    doc.text(`Maximum Deformation: ${results.maxDeformation.toFixed(3)} mm`, 25, 141);
    doc.text(`Estimated Fatigue Life: ${(results.fatigueLife / 1000000).toFixed(2)} Million cycles`, 25, 149);
    doc.text(`Implant Weight: ${results.weight.toFixed(1)} g`, 25, 157);
    
    if (results.isOptimized) {
      doc.setTextColor(16, 185, 129);
      if (results.originalStress > results.maxStress) {
        doc.text(`Optimization Note: Reduced stress from ${results.originalStress.toFixed(1)} MPa to ${results.maxStress.toFixed(1)} MPa`, 25, 169);
      } else {
        doc.text(`Optimization Note: Design was already optimal or reached geometric constraints.`, 25, 169);
      }
    }
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Ortho FEA Simulation Suite - Not for clinical diagnostic use.', 20, 280);
    
    doc.save(`Ortho_FEA_Report_${implantType}_${new Date().getTime()}.pdf`);
  };

  const chartData = results.isOptimized && results.originalStress > results.maxStress ? [
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
        <button 
          onClick={handleExportPDF}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Download size={18} />
          Export Report (PDF)
        </button>
      </div>
    </div>
  );
}
