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
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- HEADER ---
    // Dark top banner
    doc.setFillColor(24, 24, 27); // Zinc 900
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.text('Ortho FEA Simulation Report', 15, 22);

    // Subtitle / Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(161, 161, 170); // Zinc 400
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 30);

    // --- SECTION 1: CONFIGURATION ---
    let startY = 55;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(24, 24, 27);
    doc.text('1. Configuration Details', 15, startY);

    // Underline
    startY += 4;
    doc.setDrawColor(228, 228, 231); // Zinc 200
    doc.line(15, startY, pageWidth - 15, startY);

    // Config Content
    startY += 10;
    doc.setFontSize(11);
    const col1X = 15;
    const col2X = 110;
    const valOffsetX = 40;

    // Helper function for crisp key-value rows
    const printRow = (label: string, value: string, y: number, x = col1X, offset = valOffsetX) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(113, 113, 122); // Zinc 500
      doc.text(label, x, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(39, 39, 42); // Zinc 800
      doc.text(value, x + offset, y);
    };

    printRow('Implant Type:', implantType.replace('_', ' ').toUpperCase(), startY);
    printRow('Patient Age:', `${patient.age} years`, startY, col2X, 35);
    startY += 8;
    printRow('Material:', `${MATERIAL_PROPERTIES[material].name} (${material})`, startY);
    printRow('Patient Weight:', `${patient.weight} kg`, startY, col2X, 35);
    startY += 8;
    printRow('Load Case:', loadCase.toUpperCase(), startY);
    startY += 8;
    printRow('Geometry:', `${geometry.length.toFixed(1)}L x ${geometry.width.toFixed(1)}W x ${geometry.thickness.toFixed(1)}T mm`, startY);

    // --- SECTION 2: SIMULATION RESULTS ---
    startY += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(24, 24, 27);
    doc.text('2. Simulation Results', 15, startY);

    // Underline
    startY += 4;
    doc.setDrawColor(228, 228, 231);
    doc.line(15, startY, pageWidth - 15, startY);

    // Dynamic Status Banner
    startY += 8;
    if (isSafe) {
      doc.setFillColor(209, 250, 229); // emerald-100
      doc.rect(15, startY, pageWidth - 30, 14, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text('Status: SAFE (Meets standard criteria)', 20, startY + 9);
    } else {
      doc.setFillColor(254, 226, 226); // red-100
      doc.rect(15, startY, pageWidth - 30, 14, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // red-600
      doc.text('Status: RISK DETECTED (Below recommended threshold)', 20, startY + 9);
    }

    // Results Content
    startY += 24;
    printRow('Safety Factor:', `${safetyFactor.toFixed(2)} (Target: >= 1.5)`, startY);
    startY += 8;
    printRow('Max Stress:', `${results.maxStress.toFixed(1)} MPa`, startY);
    printRow('Yield Stress:', `${yieldStrength} MPa`, startY, col2X, 35);
    startY += 8;
    printRow('Deformation:', `${results.maxDeformation.toFixed(3)} mm`, startY);
    printRow('Weight:', `${results.weight.toFixed(1)} g`, startY, col2X, 35);
    startY += 8;
    printRow('Fatigue Life:', `${(results.fatigueLife / 1000000).toFixed(2)} Million cycles`, startY);

    // Optimization Note Panel
    if (results.isOptimized) {
      startY += 15;
      doc.setFillColor(244, 244, 245); // zinc-100
      doc.rect(15, startY, pageWidth - 30, 12, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(5, 150, 105); // emerald-600
      
      if (results.originalStress > results.maxStress) {
        doc.text(`Optimization Note: Reduced stress from ${results.originalStress.toFixed(1)} MPa to ${results.maxStress.toFixed(1)} MPa`, 20, startY + 8);
      } else {
        doc.text(`Optimization Note: Design was already optimal or reached geometric constraints.`, 20, startY + 8);
      }
    }

    // --- FOOTER ---
    doc.setDrawColor(228, 228, 231);
    doc.line(15, 280, pageWidth - 15, 280);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(161, 161, 170); // zinc-400
    doc.text('Ortho FEA Simulation Suite - Not for clinical diagnostic use.', 15, 287);
    
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
