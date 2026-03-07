import React, { useRef } from 'react';
import { Download, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line, Legend, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { MATERIAL_PROPERTIES, Material, PatientData, GeometryData, ImplantType, LoadCase } from '../../App';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import autoTable from 'jspdf-autotable';

interface Props {
  results: any;
  material: Material;
  patient: PatientData;
  geometry: GeometryData;
  implantType: ImplantType;
  loadCase: LoadCase;
  history?: any[];
}

export function ResultsPanel({ results, material, patient, geometry, implantType, loadCase, history }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const weightChartRef = useRef<HTMLDivElement>(null);

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

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- HELPER: DRAW SECTION HEADER ---
    const drawSectionHeader = (title: string, y: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(24, 24, 27); // Zinc 900
      doc.text(title.toUpperCase(), 15, y);
      
      doc.setDrawColor(228, 228, 231); // Zinc 200
      doc.setLineWidth(0.5);
      doc.line(15, y + 2, pageWidth - 15, y + 2);
      return y + 12;
    };

    // --- HEADER ---
    // Dark top banner
    doc.setFillColor(24, 24, 27); // Zinc 900
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Branding / Logo Placeholder
    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.rect(15, 12, 8, 8, 'F');
    
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('ORTHO-FEA', 28, 19);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(161, 161, 170); // Zinc 400
    doc.text('CLINICAL ENGINEERING SIMULATION REPORT', 28, 24);

    // Report Info (Right Aligned)
    doc.setFontSize(9);
    doc.text(`REPORT ID: #${Math.random().toString(36).substr(2, 9).toUpperCase()}`, pageWidth - 15, 18, { align: 'right' });
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, pageWidth - 15, 23, { align: 'right' });
    doc.text(`TIME: ${new Date().toLocaleTimeString()}`, pageWidth - 15, 28, { align: 'right' });

    // --- STATUS BANNER ---
    let startY = 60;
    if (isSafe) {
      doc.setFillColor(209, 250, 229); // emerald-100
      doc.rect(15, startY - 8, pageWidth - 30, 16, 'F');
      doc.setDrawColor(16, 185, 129); // emerald-500
      doc.setLineWidth(0.5);
      doc.line(15, startY - 8, 15, startY + 8); // Left accent line
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text('DESIGN STATUS: CLINICALLY SAFE', 22, startY + 2);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Safety Factor: ${safetyFactor.toFixed(2)} (Threshold: 1.50)`, pageWidth - 22, startY + 2, { align: 'right' });
    } else {
      doc.setFillColor(254, 226, 226); // red-100
      doc.rect(15, startY - 8, pageWidth - 30, 16, 'F');
      doc.setDrawColor(220, 38, 38); // red-600
      doc.setLineWidth(0.5);
      doc.line(15, startY - 8, 15, startY + 8); // Left accent line
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(185, 28, 28); // red-700
      doc.text('DESIGN STATUS: RISK DETECTED', 22, startY + 2);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Safety Factor: ${safetyFactor.toFixed(2)} (Threshold: 1.50)`, pageWidth - 22, startY + 2, { align: 'right' });
    }

    // --- SECTION 1: PATIENT & CASE PROFILE ---
    startY = drawSectionHeader('1. Patient & Case Profile', startY + 20);
    
    const printGridRow = (label1: string, val1: string, label2: string, val2: string, y: number) => {
      // Col 1
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 122); // Zinc 500
      doc.text(label1, 15, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(39, 39, 42); // Zinc 800
      doc.text(val1, 50, y);
      
      // Col 2
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(113, 113, 122);
      doc.text(label2, 110, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(39, 39, 42);
      doc.text(val2, 145, y);
    };

    printGridRow('Patient Age:', `${patient.age} Years`, 'Patient Weight:', `${patient.weight} kg`, startY);
    startY += 8;
    printGridRow('Bone Density:', `${patient.boneDensity.toFixed(2)} g/cm³`, 'Material:', MATERIAL_PROPERTIES[material].name, startY);
    startY += 8;
    printGridRow('Implant Type:', implantType.replace('_', ' ').toUpperCase(), 'Simulation Mode:', results.isOptimized ? 'AUTO-OPTIMIZED' : 'STANDARD', startY);
    startY += 8;
    printGridRow('Load Case:', loadCase.toUpperCase(), 'Yield Strength:', `${yieldStrength} MPa`, startY);
    startY += 8;
    printGridRow('Geometry (L/W/T):', `${geometry.length.toFixed(1)} / ${geometry.width.toFixed(1)} / ${geometry.thickness.toFixed(1)} mm`, '', '', startY);

    // --- SECTION 2: PERFORMANCE METRICS ---
    startY = drawSectionHeader('2. Performance Metrics', startY + 15);
    
    autoTable(doc, {
      startY: startY,
      head: [['Metric', 'Value', 'Unit', 'Assessment']],
      body: [
        ['Von Mises Stress', results.maxStress.toFixed(2), 'MPa', results.maxStress < yieldStrength ? 'Below Yield' : 'Exceeds Yield'],
        ['Max Deformation', results.maxDeformation.toFixed(4), 'mm', 'Acceptable'],
        ['Safety Factor', safetyFactor.toFixed(2), '-', isSafe ? 'Optimal' : 'Insufficient'],
        ['Bounding Box Volume', results.boundingBoxVolume.toFixed(1), 'mm³', '-'],
        ['Component Weight', results.weight.toFixed(1), 'g', '-'],
        ['Est. Fatigue Life', `${(results.fatigueLife / 1000000).toFixed(2)}M`, 'Cycles', 'High Reliability'],
        ['Estimated Cost', `INR ${Math.round(results.weight * MATERIAL_PROPERTIES[material].pricePerGram).toLocaleString('en-IN')}`, '-', '-'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [39, 39, 42], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: [39, 39, 42] },
      columnStyles: {
        3: { fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 }
    });

    // --- SECTION 3: VISUAL ANALYSIS ---
    startY = (doc as any).lastAutoTable.finalY + 15;
    
    // Check if there's enough space for the charts (approx 120 units)
    if (startY > pageHeight - 120) {
      doc.addPage();
      startY = 20;
    }

    startY = drawSectionHeader('3. Visual Analysis & Comparisons', startY);

    // Add text comparison summary
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(39, 39, 42);
    if (results.isOptimized) {
      doc.text(`Comparative analysis between original and optimized designs.`, 15, startY + 5);
      
      const stressChangePct = ((results.maxStress - results.originalStress) / results.originalStress) * 100;
      const stressChangeText = stressChangePct > 0 ? `Stress Increase: +${stressChangePct.toFixed(1)}%` : `Stress Reduction: ${Math.abs(stressChangePct).toFixed(1)}%`;
      doc.text(stressChangeText, 15, startY + 10);
      
      const massChangePct = ((results.weight - results.originalWeight) / results.originalWeight) * 100;
      const massChangeText = massChangePct > 0 ? `Mass Increase: +${massChangePct.toFixed(1)}%` : `Mass Reduction: ${Math.abs(massChangePct).toFixed(1)}%`;
      doc.text(massChangeText, 80, startY + 10);
      
      startY += 15;
    } else {
      doc.text(`Visual representation of the current design performance metrics.`, 15, startY + 5);
      startY += 10;
    }

    const captureChart = async (ref: React.RefObject<HTMLDivElement | null>, title: string, x: number, y: number, width: number) => {
      if (ref.current) {
        try {
          // Use a small delay to ensure Recharts has finished rendering/animations
          await new Promise(resolve => setTimeout(resolve, 100));

          const imgData = await htmlToImage.toPng(ref.current, {
            backgroundColor: '#18181b',
            pixelRatio: 2,
            filter: (node) => {
              // Optional: filter out elements that might cause issues, but html-to-image usually handles modern CSS well
              return true;
            }
          });
          
          // Get image dimensions
          const img = new Image();
          img.src = imgData;
          await new Promise((resolve) => { img.onload = resolve; });
          
          const imgHeight = (img.height * width) / img.width;
          
          doc.setFontSize(8);
          doc.setTextColor(113, 113, 122);
          doc.text(title, x, y - 3);
          doc.addImage(imgData, 'PNG', x, y, width, imgHeight);
          return imgHeight;
        } catch (e) {
          console.error('Failed to capture chart', e);
          return 0;
        }
      }
      return 0;
    };

    const chartWidth = (pageWidth - 40) / 2;
    const h1 = await captureChart(chartRef, 'STRESS DISTRIBUTION ANALYSIS', 15, startY + 8, chartWidth);
    const h2 = await captureChart(weightChartRef, 'WEIGHT EFFICIENCY ANALYSIS', pageWidth / 2 + 5, startY + 8, chartWidth);
    
    startY += Math.max(h1, h2) + 25;

    // --- SECTION 4: OPTIMIZATION DATA ---
    if (results.isOptimized) {
      if (startY > pageHeight - 60) {
        doc.addPage();
        startY = 20;
      }
      startY = drawSectionHeader('4. Optimization Summary', startY);
      
      const formatChange = (oldVal: number, newVal: number) => {
        const pct = ((newVal - oldVal) / oldVal) * 100;
        return pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
      };
      
      autoTable(doc, {
        startY: startY,
        head: [['Metric', 'Original', 'Optimized', 'Change']],
        body: [
          ['Max Stress', `${results.originalStress.toFixed(1)} MPa`, `${results.maxStress.toFixed(1)} MPa`, formatChange(results.originalStress, results.maxStress)],
          ['Bounding Box Vol', `${results.originalBoundingBoxVolume.toFixed(1)} mm³`, `${results.boundingBoxVolume.toFixed(1)} mm³`, formatChange(results.originalBoundingBoxVolume, results.boundingBoxVolume)],
          ['Implant Weight', `${results.originalWeight.toFixed(1)} g`, `${results.weight.toFixed(1)} g`, formatChange(results.originalWeight, results.weight)],
          ['Safety Factor', `${(yieldStrength / results.originalStress).toFixed(2)}`, `${safetyFactor.toFixed(2)}`, formatChange(yieldStrength / results.originalStress, safetyFactor)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 15, right: 15 }
      });
    }

    // --- FOOTER ---
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(228, 228, 231);
      doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
      
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170);
      doc.text('This report is generated by Ortho-FEA Simulation Suite. Clinical decisions should be verified by a certified professional.', 15, pageHeight - 10);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
    }
    
    doc.save(`OrthoFEA_Report_${patient.age}Y_${implantType}.pdf`);
  };

  const chartData = results.isOptimized && results.originalStress > results.maxStress ? [
    { name: 'Original', stress: results.originalStress, fill: '#ef4444' },
    { name: 'Optimized', stress: results.maxStress, fill: '#22c55e' }
  ] : [
    { name: 'Current Design', stress: results.maxStress, fill: isSafe ? '#22c55e' : '#ef4444' }
  ];

  const weightData = results.isOptimized ? [
    { name: 'Original', weight: results.originalWeight, fill: '#71717a' },
    { name: 'Optimized', weight: results.weight, fill: '#22c55e' }
  ] : [
    { name: 'Current Design', weight: results.weight, fill: '#22c55e' }
  ];

  const radarData = [
    { subject: 'Stress', A: Math.min(100, (results.maxStress / yieldStrength) * 100), fullMark: 100 },
    { subject: 'Weight', A: Math.min(100, (results.weight / 500) * 100), fullMark: 100 },
    { subject: 'Deform', A: Math.min(100, (results.maxDeformation / 0.5) * 100), fullMark: 100 },
    { subject: 'Fatigue', A: Math.min(100, (1 - results.fatigueLife / 1e8) * 100), fullMark: 100 },
    { subject: 'Safety', A: Math.min(100, (1.5 / safetyFactor) * 100), fullMark: 100 },
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

      {results.materialChanged && (
        <div className="p-4 rounded-xl border bg-blue-500/10 border-blue-500/30 flex items-start gap-3">
          <AlertTriangle className="text-blue-500 mt-0.5" size={20} />
          <div>
            <h4 className="font-medium text-blue-400">Material Optimized</h4>
            <p className="text-xs text-zinc-400 mt-1">
              To prevent excessive weight gain, the optimizer automatically switched the material to <span className="text-zinc-200 font-medium">{MATERIAL_PROPERTIES[results.newMaterial as Material].name}</span> for a better strength-to-weight ratio.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          ref={chartRef} 
          className="p-4 rounded-xl h-48"
          style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
        >
          <div className="text-xs font-mono text-zinc-500 uppercase mb-2">Stress Comparison (MPa)</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: '#27272a'}}
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
              />
              <ReferenceLine y={yieldStrength / 1.5} stroke="#eab308" strokeDasharray="3 3" label={{ position: 'top', value: 'Allowable', fill: '#eab308', fontSize: 8 }} />
              <Bar dataKey="stress" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div 
          className="p-4 rounded-xl h-48"
          ref={weightChartRef}
          style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
        >
          <div className="text-xs font-mono text-zinc-500 uppercase mb-2">Performance Profile</div>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="50%" data={radarData} margin={{ top: 10, right: 25, bottom: 10, left: 25 }}>
              <PolarGrid stroke="#27272a" />
              <PolarAngleAxis dataKey="subject" stroke="#71717a" fontSize={10} />
              <Radar
                name="Performance"
                dataKey="A"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
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
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="text-xs font-mono text-zinc-500 uppercase mb-1">Bounding Box Volume</div>
          <div className="text-xl font-medium text-zinc-100">
            {results.boundingBoxVolume.toFixed(0)} <span className="text-sm text-zinc-500">mm³</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl col-span-2">
          <div className="text-xs font-mono text-zinc-500 uppercase mb-1">Estimated Material Cost</div>
          <div className="text-xl font-medium text-emerald-400">
            ₹ {Math.round(results.weight * MATERIAL_PROPERTIES[material].pricePerGram).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {history && history.length > 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-300">Visual Analysis & Comparison</h3>
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Optimization Convergence</div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="iteration" 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  label={{ value: 'Iteration', position: 'insideBottom', offset: -5, fill: '#71717a', fontSize: 10 }}
                />
                <YAxis yAxisId="left" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '10px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <ReferenceLine yAxisId="left" y={yieldStrength / 1.5} stroke="#eab308" strokeDasharray="3 3" />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="stress" 
                  name="Stress (MPa)" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="weight" 
                  name="Weight (g)" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg">
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              The graph above illustrates the multi-objective optimization process. 
              The <span className="text-emerald-500 font-medium">green line</span> represents the peak Von Mises stress, 
              which is iteratively reduced to meet the safety threshold (dashed yellow line). 
              The <span className="text-blue-500 font-medium">blue line</span> tracks the corresponding mass changes.
            </p>
          </div>
        </div>
      )}

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
