import React from 'react';
import { Material } from '../../App';
import { cn } from '../../lib/utils';

interface Props {
  material: Material;
  setMaterial: (mat: Material) => void;
  currentWeight: number; // Used to calculate dynamic price based on geometry
}

export function MaterialPanel({ material, setMaterial, currentWeight }: Props) {
  // Estimated prices per gram based on medical-grade orthopedic manufacturing averages
  const materials: { id: Material; label: string; e: string; v: string; yield: string; pricePerGram: number }[] = [
    { id: 'Ti6Al4V', label: 'Titanium Alloy (Ti-6Al-4V)', e: '114 GPa', v: '0.34', yield: '880 MPa', pricePerGram: 15.0 },
    { id: 'SS316L', label: 'Stainless Steel 316L', e: '193 GPa', v: '0.30', yield: '290 MPa', pricePerGram: 4.0 },
    { id: 'CoCr', label: 'Cobalt Chromium', e: '210 GPa', v: '0.30', yield: '450 MPa', pricePerGram: 14.0 },
    { id: 'PEEK', label: 'PEEK Polymer', e: '3.6 GPa', v: '0.40', yield: '100 MPa', pricePerGram: 25.0 },
    { id: 'BioCeramic', label: 'Alumina Ceramic', e: '380 GPa', v: '0.22', yield: '300 MPa', pricePerGram: 20.0 },
  ];

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium text-zinc-100 mb-1">Material Database</h2>
        <p className="text-sm text-zinc-400">
          Assign mechanical properties and evaluate estimated costs based on implant weight ({currentWeight?.toFixed(1) || 0}g).
        </p>
      </div>

      <div className="grid gap-3">
        {materials.map((mat) => {
          // Calculate the dynamic price based on the current geometry weight
          const estimatedPrice = mat.pricePerGram * (currentWeight || 0);
          
          return (
            <button
              key={mat.id}
              onClick={() => setMaterial(mat.id)}
              className={cn(
                "p-4 rounded-xl border text-left transition-all",
                material === mat.id
                  ? "bg-emerald-500/10 border-emerald-500/50"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="font-medium text-zinc-100">{mat.label}</div>
                <div className={cn(
                  "text-xs font-mono px-2 py-1 rounded border",
                  material === mat.id 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                    : "bg-zinc-800 text-zinc-300 border-zinc-700"
                )}>
                  ${estimatedPrice.toFixed(2)}
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
                  <span className="text-zinc-500 block">Est. Cost/g</span>
                  <span className="text-zinc-300 font-mono">${mat.pricePerGram.toFixed(2)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
