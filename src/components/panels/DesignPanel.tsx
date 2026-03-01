import React from 'react';
import { ImplantType, PatientData, GeometryData } from '../../App';
import { cn } from '../../lib/utils';
import { Activity } from 'lucide-react';

interface Props {
  implantType: ImplantType;
  setImplantType: (type: ImplantType) => void;
  patient: PatientData;
  setPatient: (data: PatientData) => void;
  geometry: GeometryData;
  setGeometry: (data: GeometryData) => void;
  currentStress: number;
  yieldStrength: number;
}

export function DesignPanel({ 
  implantType, setImplantType, 
  patient, setPatient, 
  geometry, setGeometry,
  currentStress, yieldStrength
}: Props) {
  const implants: { id: ImplantType; label: string; desc: string }[] = [
    { id: 'hip_stem', label: 'Hip Stem', desc: 'Femoral component for total hip arthroplasty' },
    { id: 'bone_plate', label: 'Bone Plate', desc: 'Fracture fixation plate with locking screws' },
    { id: 'knee_joint', label: 'Knee Joint', desc: 'Tibial and femoral components' },
    { id: 'spinal_rod', label: 'Spinal Rod', desc: 'Pedicle screw and rod fixation system' },
  ];

  const boneQuality = Math.max(0.5, 1.0 - Math.max(0, patient.age - 30) * 0.008);
  const stressRatio = currentStress / yieldStrength;
  const isSafe = stressRatio < 0.66; // SF > 1.5

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium text-zinc-100 mb-1">Parametric Design</h2>
        <p className="text-sm text-zinc-400">Configure patient specifics and implant geometry.</p>
      </div>

      {/* Real-time Feedback Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Activity size={16} className={isSafe ? "text-emerald-500" : "text-red-500"} />
            Real-time Stress Estimate
          </div>
          <span className={cn("text-sm font-mono", isSafe ? "text-emerald-400" : "text-red-400")}>
            {currentStress.toFixed(0)} MPa
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300", isSafe ? "bg-emerald-500" : "bg-red-500")}
            style={{ width: `${Math.min(100, stressRatio * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
          <span>0</span>
          <span>Yield: {yieldStrength} MPa</span>
        </div>
      </div>

      {/* Patient Specifics */}
      <div className="flex flex-col gap-3 pt-2">
        <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Patient Specifics</h3>
        <div className="space-y-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Age</span>
              <span className="text-zinc-100 font-mono">{patient.age} yrs</span>
            </div>
            <input 
              type="range" className="w-full accent-emerald-500" 
              value={patient.age} min={18} max={90} 
              onChange={(e) => setPatient({ ...patient, age: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Body Weight</span>
              <span className="text-zinc-100 font-mono">{patient.weight} kg</span>
            </div>
            <input 
              type="range" className="w-full accent-emerald-500" 
              value={patient.weight} min={40} max={150} 
              onChange={(e) => setPatient({ ...patient, weight: parseInt(e.target.value) })}
            />
          </div>
          <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
            <span className="text-xs text-zinc-500">Est. Bone Quality Factor</span>
            <span className={cn("text-xs font-mono px-2 py-0.5 rounded", boneQuality > 0.8 ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400")}>
              {boneQuality.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Geometry Parameters */}
      <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800">
        <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Implant Geometry</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Length</span>
              <span className="text-zinc-100 font-mono">{geometry.length.toFixed(1)} mm</span>
            </div>
            <input 
              type="range" className="w-full accent-emerald-500" 
              value={geometry.length} min={80} max={200} step={1}
              onChange={(e) => setGeometry({ ...geometry, length: parseFloat(e.target.value) })}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Width</span>
              <span className="text-zinc-100 font-mono">{geometry.width.toFixed(1)} mm</span>
            </div>
            <input 
              type="range" className="w-full accent-emerald-500" 
              value={geometry.width} min={10} max={30} step={0.5}
              onChange={(e) => setGeometry({ ...geometry, width: parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Thickness</span>
              <span className="text-zinc-100 font-mono">{geometry.thickness.toFixed(1)} mm</span>
            </div>
            <input 
              type="range" className="w-full accent-emerald-500" 
              value={geometry.thickness} min={2} max={15} step={0.5}
              onChange={(e) => setGeometry({ ...geometry, thickness: parseFloat(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Implant Type Selection */}
      <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800">
        <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Implant Type</h3>
        <div className="grid gap-2">
          {implants.map((imp) => (
            <button
              key={imp.id}
              onClick={() => setImplantType(imp.id)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all",
                implantType === imp.id
                  ? "bg-emerald-500/10 border-emerald-500/50"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
              )}
            >
              <div className="font-medium text-zinc-100 text-sm mb-0.5">{imp.label}</div>
              <div className="text-xs text-zinc-500">{imp.desc}</div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
