import React from 'react';
import { Material, MATERIAL_PROPERTIES } from '../../App';
import { cn } from '../../lib/utils';
import { IndianRupee } from 'lucide-react';

interface Props {
  material: Material;
  setMaterial: (mat: Material) => void;
  currentWeight: number;
}

export function MaterialPanel({ material, setMaterial, currentWeight }: Props) {
  const materials: { id: Material; label: string; e: string; v: string; yield: string }[] = [
    { id: 'Ti6Al4V', label: 'Titanium Alloy (Ti-6Al-4V)', e: '114 GPa', v: '0.34', yield: '880 MPa' },
    { id: 'SS316L', label: 'Stainless Steel 316L', e: '193 GPa', v: '0.30', yield: '290 MPa' },
    { id: 'CoCr', label: 'Cobalt Chromium', e: '210 GPa', v: '0.30', yield: '450 MPa' },
    { id: 'PEEK', label: 'PEEK Polymer', e: '3.6 GPa', v: '0.40', yield: '100 MPa' },
    { id: 'BioCeramic', label: 'Alumina Ceramic', e: '380 GPa', v: '0.22', yield: '300 MPa' },
  ];

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium text-zinc-100 mb-1">Material Database</h2>
        <p className="text-sm text-zinc-400">Assign mechanical properties and estimate costs.</p>
      </div>

      <div className="grid gap-3">
        {materials.map((mat) => {
          const props = MATERIAL_PROPERTIES[mat.id];
          const estimatedPrice = props.pricePerGram * currentWeight;
          
          return (
            <button
              key={mat.id}
              onClick={() => setMaterial(mat.id)}
              className={cn(
                "p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                material === mat.id
                  ? "bg-emerald-500/10 border-emerald-500/50"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="font-medium text-zinc-100">{mat.label}</div>
                <div className="flex items-center gap-1 text-emerald-400 font-mono text-sm bg-emerald-500/10 px-2 py-0.5 rounded">
                  <IndianRupee size={12} />
                  {Math.round(estimatedPrice).toLocaleString('en-IN')}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-zinc-500 block">Young's Modulus</span>
                  <span className="text-zinc-300 font-mono">{mat.e}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Poisson's Ratio</span>
                  <span className="text-zinc-300 font-mono">{mat.v}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Yield Strength</span>
                  <span className="text-zinc-300 font-mono">{mat.yield}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Rate (per gram)</span>
                  <span className="text-zinc-300 font-mono">₹{props.pricePerGram}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <div className="text-xs font-mono text-zinc-500 uppercase mb-2">Cost Calculation Basis</div>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Estimated costs are calculated based on current market rates for medical-grade orthopedic materials in India (INR). 
          Final pricing depends on manufacturing complexity, sterilization, and clinical certification.
        </p>
      </div>
    </div>
  );
}
