import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Viewport3D } from './components/Viewport3D';
import { DesignPanel } from './components/panels/DesignPanel';
import { MaterialPanel } from './components/panels/MaterialPanel';
import { FEAPanel } from './components/panels/FEAPanel';
import { OptimizationPanel } from './components/panels/OptimizationPanel';
import { ResultsPanel } from './components/panels/ResultsPanel';
import { TopBar } from './components/TopBar';

export type Tab = 'design' | 'material' | 'fea' | 'optimization' | 'results';
export type ImplantType = 'bone_plate' | 'hip_stem' | 'knee_joint' | 'spinal_rod';
export type Material = 'Ti6Al4V' | 'SS316L' | 'CoCr' | 'PEEK' | 'BioCeramic';
export type LoadCase = 'walking' | 'stair' | 'jump' | 'iso';

export interface PatientData {
  age: number;
  weight: number; // kg
}

export interface GeometryData {
  length: number; // mm
  width: number; // mm
  thickness: number; // mm
}

export const MATERIAL_PROPERTIES: Record<Material, { name: string; yield: number; density: number; e: string; v: string }> = {
  'Ti6Al4V': { name: 'Titanium Alloy', yield: 880, density: 4.43, e: '114 GPa', v: '0.34' },
  'SS316L': { name: 'Stainless Steel', yield: 290, density: 8.00, e: '193 GPa', v: '0.30' },
  'CoCr': { name: 'Cobalt Chromium', yield: 450, density: 8.30, e: '210 GPa', v: '0.30' },
  'PEEK': { name: 'PEEK Polymer', yield: 100, density: 1.32, e: '3.6 GPa', v: '0.40' },
  'BioCeramic': { name: 'Alumina Ceramic', yield: 300, density: 3.95, e: '380 GPa', v: '0.22' },
};

export const LOAD_MULTIPLIERS: Record<LoadCase, number> = {
  'walking': 2.5,
  'stair': 3.5,
  'jump': 5.0,
  'iso': 4.0,
};

// Helper to calculate estimated stress based on parameters
export const calculateStress = (geom: GeometryData, pat: PatientData, load: LoadCase) => {
  // Bone quality degrades with age after 30
  const boneQuality = Math.max(0.5, 1.0 - Math.max(0, pat.age - 30) * 0.008);
  const force = pat.weight * 9.81 * LOAD_MULTIPLIERS[load];
  const crossSectionArea = geom.width * geom.thickness;
  
  // Simplified bending/axial stress model with stress concentration factor
  const nominalStress = force / crossSectionArea;
  const stressConcentration = 2.5; 
  
  // Lower bone quality means less load sharing by bone, more load on implant
  const loadSharingFactor = 1 / boneQuality; 
  
  return nominalStress * stressConcentration * loadSharingFactor;
};

// Helper to calculate estimated weight of the implant
export const calculateWeight = (geom: GeometryData, mat: Material) => {
  const volume = geom.length * geom.width * geom.thickness; // mm^3
  const density = MATERIAL_PROPERTIES[mat].density / 1000; // g/mm^3
  return volume * density; // grams
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('design');
  const [implantType, setImplantType] = useState<ImplantType>('hip_stem');
  const [material, setMaterial] = useState<Material>('Ti6Al4V');
  const [loadCase, setLoadCase] = useState<LoadCase>('walking');
  
  const [patient, setPatient] = useState<PatientData>({ age: 45, weight: 75 });
  const [geometry, setGeometry] = useState<GeometryData>({ length: 120, width: 15, thickness: 4.5 });
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [optimizationHistory, setOptimizationHistory] = useState<any[] | null>(null);

  const currentStress = useMemo(() => calculateStress(geometry, patient, loadCase), [geometry, patient, loadCase]);
  const currentWeight = useMemo(() => calculateWeight(geometry, material), [geometry, material]);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationResults({
        maxStress: currentStress,
        minStress: currentStress * 0.15,
        maxDeformation: (currentStress / parseInt(MATERIAL_PROPERTIES[material].e)) * geometry.length * 0.1,
        fatigueLife: Math.max(10000, Math.floor(1e8 * Math.pow(MATERIAL_PROPERTIES[material].yield / currentStress, 3))),
        weight: currentWeight,
        isOptimized: false
      });
      setActiveTab('results');
    }, 1500);
  };

  const handleOptimize = () => {
    setIsSimulating(true);
    
    setTimeout(() => {
      let currentGeom = { ...geometry };
      let stress = calculateStress(currentGeom, patient, loadCase);
      const targetStress = MATERIAL_PROPERTIES[material].yield / 1.5; // Safety Factor of 1.5
      
      const history = [];
      history.push({ 
        iteration: 0, 
        geom: { ...currentGeom }, 
        stress, 
        weight: calculateWeight(currentGeom, material) 
      });

      let iteration = 1;
      // Iterative Optimization Loop
      while (stress > targetStress && currentGeom.thickness < 20 && iteration < 20) {
        // Increase dimensions to reduce stress
        currentGeom.thickness += 0.5;
        currentGeom.width += 0.5;
        stress = calculateStress(currentGeom, patient, loadCase);
        
        history.push({ 
          iteration, 
          geom: { ...currentGeom }, 
          stress, 
          weight: calculateWeight(currentGeom, material) 
        });
        iteration++;
      }
      
      setGeometry(currentGeom);
      setOptimizationHistory(history);
      setSimulationResults({
        maxStress: stress,
        minStress: stress * 0.15,
        maxDeformation: (stress / parseInt(MATERIAL_PROPERTIES[material].e)) * currentGeom.length * 0.1,
        fatigueLife: Math.max(10000, Math.floor(1e8 * Math.pow(MATERIAL_PROPERTIES[material].yield / stress, 3))),
        weight: calculateWeight(currentGeom, material),
        isOptimized: true,
        originalStress: history[0].stress,
        originalWeight: history[0].weight
      });
      setIsSimulating(false);
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col relative">
        <TopBar />
        <div className="flex-1 flex overflow-hidden">
          {/* 3D Viewport Area */}
          <div className="flex-1 relative bg-zinc-900 border-r border-zinc-800">
            <Viewport3D 
              implantType={implantType} 
              material={material} 
              geometry={geometry}
              showResults={activeTab === 'results' || activeTab === 'optimization'} 
              stress={currentStress}
              yieldStrength={MATERIAL_PROPERTIES[material].yield}
            />
            {isSimulating && (
              <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-emerald-400 font-mono text-sm">Running FEA Solver...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Control Panel Area */}
          <div className="w-[400px] bg-zinc-950 overflow-y-auto border-l border-zinc-800">
            {activeTab === 'design' && (
              <DesignPanel 
                implantType={implantType} 
                setImplantType={setImplantType}
                patient={patient}
                setPatient={setPatient}
                geometry={geometry}
                setGeometry={setGeometry}
                currentStress={currentStress}
                yieldStrength={MATERIAL_PROPERTIES[material].yield}
              />
            )}
            {activeTab === 'material' && <MaterialPanel material={material} setMaterial={setMaterial} />}
            {activeTab === 'fea' && <FEAPanel loadCase={loadCase} setLoadCase={setLoadCase} onSimulate={handleSimulate} isSimulating={isSimulating} />}
            {activeTab === 'optimization' && (
              <OptimizationPanel 
                onOptimize={handleOptimize} 
                isSimulating={isSimulating} 
                history={optimizationHistory}
                material={material}
              />
            )}
            {activeTab === 'results' && (
              <ResultsPanel 
                results={simulationResults} 
                material={material} 
                patient={patient}
                geometry={geometry}
                implantType={implantType}
                loadCase={loadCase}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
