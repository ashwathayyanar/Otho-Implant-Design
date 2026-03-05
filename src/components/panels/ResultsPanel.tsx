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
    
    // Helper for colors
    const colors: Record<string, [number, number, number]> = {
      primary: [16, 185, 129], // Emerald 500
      secondary: [39, 39, 42], // Zinc 800
      text: [39, 39, 42],
      muted: [113, 113, 122],
      danger: [239, 68, 68],
      success: [34, 197, 94]
    };

    // 1. Header with Background
    doc.setFillColor(24, 24, 27); // Zinc 900
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('ORTHO FEA REPORT', 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(161, 161, 170); // Zinc 400
    doc.setFont('helvetica', 'normal');
    doc.text(`SIMULATION ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, 20, 35);
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, pageWidth - 60, 35);

    // 2. Patient & Configuration Summary
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('1. PATIENT & CONFIGURATION', 20, 60);
    
    autoTable(doc, {
      startY: 65,
      head: [['Parameter', 'Value', 'Details']],
      body: [
        ['Patient Profile', `${patient.age}y / ${patient.weight}kg`, 'Standard Orthopedic Load Case'],
        ['Implant Type', implantType.replace('_', ' ').toUpperCase(), 'Custom Geometry'],
        ['Material', MATERIAL_PROPERTIES[material].name, `Yield: ${yieldStrength} MPa`],
        ['Load Case', loadCase.toUpperCase(), 'Static Structural Analysis'],
        ['Dimensions', `${geometry.length.toFixed(1)} x ${geometry.width.toFixed(1)} x ${geometry.thickness.toFixed(1)}`, 'mm (L x W x T)']
      ],
      theme: 'striped',
      headStyles: { fillColor: colors.primary },
      margin: { left: 20, right: 20 }
    });

    // 3. Performance Analysis
    const finalY = (doc as any).lastAutoTable.finalY || 110;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('2. PERFORMANCE ANALYSIS', 20, finalY + 15);

    // Status Banner
    doc.setFillColor(isSafe ? 240 : 254, isSafe ? 253 : 242, isSafe ? 244 : 242); // Light green or light red
    doc.roundedRect(20, finalY + 20, pageWidth - 40, 20, 3, 3, 'F');
    doc.setFontSize(11);
    doc.setTextColor(isSafe ? colors.success[0] : colors.danger[0], isSafe ? colors.success[1] : colors.danger[1], isSafe ? colors.success[2] : colors.danger[2]);
    doc.text(isSafe ? 'DESIGN STATUS: COMPLIANT / SAFE' : 'DESIGN STATUS: CRITICAL RISK DETECTED', 25, finalY + 32);

    // Results Table
    autoTable(doc, {
      startY: finalY + 45,
      head: [['Metric', 'Result', 'Target / Limit', 'Status']],
      body: [
        ['Max Von Mises Stress', `${results.maxStress.toFixed(1)} MPa`, `< ${yieldStrength} MPa`, results.maxStress < yieldStrength ? 'PASS' : 'FAIL'],
        ['Safety Factor', safetyFactor.toFixed(2), '>= 1.50', isSafe ? 'PASS' : 'FAIL'],
        ['Max Deformation', `${results.maxDeformation.toFixed(3)} mm`, '< 0.500 mm', results.maxDeformation < 0.5 ? 'PASS' : 'WARN'],
        ['Fatigue Life', `${(results.fatigueLife / 1000000).toFixed(2)}M cycles`, '> 1.00M cycles', results.fatigueLife > 1000000 ? 'PASS' : 'FAIL'],
        ['Total Weight', `${results.weight.toFixed(1)} g`, 'N/A', '-']
      ],
      theme: 'grid',
      headStyles: { fillColor: colors.secondary },
      columnStyles: {
        3: { fontStyle: 'bold' }
      }
    });

    // 4. Visual Analysis (Graphs)
    const finalY2 = (doc as any).lastAutoTable.finalY || 200;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('3. VISUAL ANALYSIS', 20, finalY2 + 15);

    let currentYForCharts = finalY2 + 20;

    const captureChart = async (ref: React.RefObject<HTMLDivElement | null>, title: string) => {
      if (ref.current) {
        try {
          const canvas = await html2canvas(ref.current, {
            backgroundColor: '#18181b',
            scale: 2
          });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = (pageWidth - 50) / 2;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (currentYForCharts + imgHeight > pageHeight - 30) {
            doc.addPage();
            currentYForCharts = 20;
          }
          
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(title, 20 + (title.includes('Weight') ? imgWidth + 10 : 0), currentYForCharts - 2);
          doc.addImage(imgData, 'PNG', 20 + (title.includes('Weight') ? imgWidth + 10 : 0), currentYForCharts, imgWidth, imgHeight);
          
          if (title.includes('Weight')) {
            currentYForCharts += imgHeight + 20;
          }
        } catch (e) {
          console.error('Failed to capture chart', e);
        }
      }
    };

    await captureChart(chartRef, 'STRESS COMPARISON (MPa)');
    await captureChart(weightChartRef, 'WEIGHT COMPARISON (g)');

    // 5. Optimization Summary
    if (results.isOptimized) {
      if (currentYForCharts > pageHeight - 80) {
        doc.addPage();
        currentYForCharts = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('4. OPTIMIZATION SUMMARY', 20, currentYForCharts + 10);

      autoTable(doc, {
        startY: currentYForCharts + 15,
        head: [['Metric', 'Original', 'Optimized', 'Improvement']],
        body: [
          ['Peak Stress', `${results.originalStress.toFixed(1)} MPa`, `${results.maxStress.toFixed(1)} MPa`, `${(((results.originalStress - results.maxStress) / results.originalStress) * 100).toFixed(1)}%`],
          ['Implant Weight', `${results.originalWeight.toFixed(1)} g`, `${results.weight.toFixed(1)} g`, `${(((results.originalWeight - results.weight) / results.originalWeight) * 100).toFixed(1)}%`],
          ['Safety Factor', (yieldStrength / results.originalStress).toFixed(2), (yieldStrength / results.maxStress).toFixed(2), `${(((yieldStrength / results.maxStress - yieldStrength / results.originalStress) / (yieldStrength / results.originalStress)) * 100).toFixed(1)}%`]
        ],
        theme: 'striped',
        headStyles: { fillColor: colors.primary }
      });
    }

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('CONFIDENTIAL - ORTHO FEA SIMULATION SUITE', 20, footerY);
    doc.text(`Page 1 of 1`, pageWidth - 35, footerY);
    doc.text('Disclaimer: For research and engineering validation only. Not for clinical diagnosis.', pageWidth / 2, footerY, { align: 'center' });

    doc.save(`Ortho_FEA_Report_${implantType}_${new Date().getTime()}.pdf`);
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
        <div ref={chartRef} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl h-48">
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
              <Bar dataKey="stress" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div ref={weightChartRef} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl h-48">
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
              <Bar dataKey="weight" radius={[4, 4, 0, 0]} maxBarSize={40} />
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
