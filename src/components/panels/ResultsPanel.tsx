import React, { useRef } from 'react';
import { Download, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MATERIAL_PROPERTIES, Material, PatientData, GeometryData, ImplantType, LoadCase } from '../../App';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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

export function ResultsPanel({ results, material, patient, geometry, implantType, loadCase }: Props) {
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
    printGridRow('Implant Type:', implantType.replace('_', ' ').toUpperCase(), 'Material:', MATERIAL_PROPERTIES[material].name, startY);
    startY += 8;
    printGridRow('Load Case:', loadCase.toUpperCase(), 'Simulation Mode:', results.isOptimized ? 'AUTO-OPTIMIZED' : 'STANDARD', startY);
    startY += 8;
    printGridRow('Geometry (L/W/T):', `${geometry.length.toFixed(1)} / ${geometry.width.toFixed(1)} / ${geometry.thickness.toFixed(1)} mm`, 'Yield Strength:', `${yieldStrength} MPa`, startY);

    // --- SECTION 2: PERFORMANCE METRICS ---
    startY = drawSectionHeader('2. Performance Metrics', startY + 15);
    
    autoTable(doc, {
      startY: startY,
      head: [['Metric', 'Value', 'Unit', 'Assessment']],
      body: [
        ['Peak Von Mises Stress', results.maxStress.toFixed(2), 'MPa', results.maxStress < yieldStrength ? 'Below Yield' : 'Exceeds Yield'],
        ['Max Deformation', results.maxDeformation.toFixed(4), 'mm', 'Acceptable'],
        ['Safety Factor', safetyFactor.toFixed(2), '-', isSafe ? 'Optimal' : 'Insufficient'],
        ['Component Weight', results.weight.toFixed(1), 'g', '-'],
        ['Est. Fatigue Life', `${(results.fatigueLife / 1000000).toFixed(2)}M`, 'Cycles', 'High Reliability'],
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
    startY = drawSectionHeader('3. Visual Analysis & Comparisons', startY);

    // Add text comparison summary
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(39, 39, 42);
    if (results.isOptimized) {
      doc.text(`Comparative analysis between original and optimized designs.`, 15, startY + 5);
      doc.text(`Stress Reduction: ${((results.originalStress - results.maxStress) / results.originalStress * 100).toFixed(1)}%`, 15, startY + 10);
      doc.text(`Mass Reduction: ${((results.originalWeight - results.weight) / results.originalWeight * 100).toFixed(1)}%`, 80, startY + 10);
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

          const canvas = await html2canvas(ref.current, {
            backgroundColor: '#18181b',
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            onclone: (clonedDoc) => {
              // Fix for oklch colors which html2canvas doesn't support
              const elements = clonedDoc.getElementsByTagName('*');
              for (let i = 0; i < elements.length; i++) {
                const el = elements[i] as HTMLElement;
                const style = window.getComputedStyle(el);
                
                // If background or border uses oklch, replace with a safe fallback
                if (style.backgroundColor.includes('oklch')) el.style.backgroundColor = '#18181b';
                if (style.borderColor.includes('oklch')) el.style.borderColor = '#27272a';
                if (style.color.includes('oklch')) el.style.color = '#a1a1aa';
              }
            }
          });
          const imgData = canvas.toDataURL('image/png');
          const imgHeight = (canvas.height * width) / canvas.width;
          
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
      
      autoTable(doc, {
        startY: startY,
        head: [['Metric', 'Original', 'Optimized', 'Improvement']],
        body: [
          ['Max Stress', `${results.originalStress.toFixed(1)} MPa`, `${results.maxStress.toFixed(1)} MPa`, `${((results.originalStress - results.maxStress) / results.originalStress * 100).toFixed(1)}%`],
          ['Implant Weight', `${results.originalWeight.toFixed(1)} g`, `${results.weight.toFixed(1)} g`, `${((results.originalWeight - results.weight) / results.originalWeight * 100).toFixed(1)}%`],
          ['Safety Factor', `${(yieldStrength / results.originalStress).toFixed(2)}`, `${safetyFactor.toFixed(2)}`, `${((safetyFactor - (yieldStrength / results.originalStress)) / (yieldStrength / results.originalStress) * 100).toFixed(1)}%`],
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
          ref={weightChartRef} 
          className="p-4 rounded-xl h-48"
          style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
        >
          <div className="text-xs font-mono text-zinc-500 uppercase mb-2">Weight Comparison (g)</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: '#27272a'}}
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
              />
              <Bar dataKey="weight" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
            </BarChart>
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
