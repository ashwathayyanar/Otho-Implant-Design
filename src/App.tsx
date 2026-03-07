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
  boneDensity: number; // g/cm³
}

export interface GeometryData {
  length: number; // mm
  width: number; // mm
  thickness: number; // mm
}

export const MATERIAL_PROPERTIES: Record<Material, { name: string; yield: number; density: number; e: string; v: string; pricePerGram: number }> = {
  'Ti6Al4V': { name: 'Titanium Alloy', yield: 880, density: 4.43, e: '114 GPa', v: '0.34', pricePerGram: 450 },
  'SS316L': { name: 'Stainless Steel', yield: 290, density: 8.00, e: '193 GPa', v: '0.30', pricePerGram: 85 },
  'CoCr': { name: 'Cobalt Chromium', yield: 450, density: 8.30, e: '210 GPa', v: '0.30', pricePerGram: 550 },
  'PEEK': { name: 'PEEK Polymer', yield: 100, density: 1.32, e: '3.6 GPa', v: '0.40', pricePerGram: 1200 },
  'BioCeramic': { name: 'Alumina Ceramic', yield: 300, density: 3.95, e: '380 GPa', v: '0.22', pricePerGram: 950 },
};

export const LOAD_MULTIPLIERS: Record<LoadCase, number> = {
  'walking': 2.5,
  'stair': 3.5,
  'jump': 5.0,
  'iso': 4.0,
};

// Helper to calculate estimated stress based on parameters
export const calculateStress = (geom: GeometryData, pat: PatientData, load: LoadCase, implantType: ImplantType, material: Material, elementSize: number, adaptiveRefinement: boolean) => {
  // 1. Calculate Force (Newtons)
  const bodyWeightN = pat.weight * 9.81;
  const force = bodyWeightN * LOAD_MULTIPLIERS[load];

  // 2. Bone Quality & Load Sharing (Stress Shielding)
  // Cortical bone modulus decreases with age and osteoporosis
  const baseBoneModulus = 18; // GPa
  // Use the actual bone density to determine bone quality factor (normal is ~1.5 g/cm³)
  const boneQuality = Math.max(0.3, pat.boneDensity / 1.5);
  const effectiveBoneModulus = baseBoneModulus * boneQuality;
  
  const implantModulus = parseFloat(MATERIAL_PROPERTIES[material].e); // e.g., "114 GPa" -> 114
  
  // Load sharing factor: stiffer implant takes more load (Composite beam theory approximation)
  // Lower bone density means the bone is weaker, transferring more stress to the implant
  const modularRatio = implantModulus / effectiveBoneModulus;
  const loadSharingFactor = Math.min(0.98, 0.4 + (modularRatio * 0.035)); 

  const effectiveForce = force * loadSharingFactor;

  // 3. Biomechanical Stress Calculation based on Implant Type
  let maxVonMises = 0;

  if (implantType === 'hip_stem') {
    // Hip stem experiences severe bending due to femoral head offset (approx 40mm)
    // Longer stems distribute load better, reducing peak stress concentrations
    const offset = 40; 
    const bendingMoment = effectiveForce * offset; 
    const I = (geom.width * Math.pow(geom.thickness, 3)) / 12; // Area moment of inertia
    const c = geom.thickness / 2; 
    const bendingStress = (bendingMoment * c) / I;
    const axialStress = effectiveForce / (geom.width * geom.thickness);
    
    // Length factor: longer stems reduce peak stress by better load distribution (simplified)
    const lengthFactor = Math.max(0.7, 1.2 - (geom.length / 200));
    maxVonMises = Math.sqrt(Math.pow(bendingStress + axialStress, 2) + 3 * Math.pow(axialStress * 0.2, 2)) * lengthFactor;
    
  } else if (implantType === 'bone_plate') {
    // Bone plate experiences bending across the fracture gap
    const gap = 15; // mm
    const bendingMoment = effectiveForce * gap;
    const I = (geom.width * Math.pow(geom.thickness, 3)) / 12;
    const c = geom.thickness / 2;
    const bendingStress = (bendingMoment * c) / I;
    
    // Stress concentration at screw holes (Kt ~ 2.8)
    // Longer plates allow for more screws and better load sharing
    const lengthFactor = Math.max(0.8, 1.1 - (geom.length / 300));
    const Kt = 2.8;
    maxVonMises = bendingStress * Kt * lengthFactor;

  } else if (implantType === 'spinal_rod') {
    // Spinal rod experiences bending and axial compression
    const momentArm = 25; // mm
    const bendingMoment = effectiveForce * momentArm;
    const radius = geom.thickness / 2;
    const I = (Math.PI * Math.pow(radius, 4)) / 4;
    const c = radius;
    const bendingStress = (bendingMoment * c) / I;
    
    const lengthFactor = Math.max(0.9, 1.05 - (geom.length / 500));
    maxVonMises = bendingStress * lengthFactor;

  } else if (implantType === 'knee_joint') {
    // Knee joint is primarily compressive bearing stress
    const contactArea = geom.width * geom.length * 0.3; 
    const compressiveStress = effectiveForce / contactArea;
    // Hertzian contact stress approximation multiplier
    maxVonMises = compressiveStress * 8.0; 
  }

  // Calibration factor to match realistic clinical FEA values (e.g., 150-300 MPa for Ti6Al4V hips)
  const calibrationFactor = 0.65; 
  const baseStress = maxVonMises * calibrationFactor;

  // Mesh accuracy modifier: Coarse mesh underestimates peak stress.
  // Normalize element size between 0 (finest, 0.5mm) and 1 (coarsest, 5.0mm)
  const coarseness = (elementSize - 0.5) / 4.5; 
  let underestimation = coarseness * 0.20; // Up to 20% error for coarse mesh
  
  if (adaptiveRefinement) {
    underestimation *= 0.2; // Adaptive refinement reduces error by 80% at stress concentrations
  }
  
  return baseStress * (1.0 - underestimation);
};

// Helper to calculate estimated weight of the implant
export const calculateWeight = (geom: GeometryData, mat: Material, type: ImplantType) => {
  const boundingBoxVolume = geom.length * geom.width * geom.thickness; // mm^3
  
  // Volume reduction factors based on typical implant geometries
  const volumeFactors: Record<ImplantType, number> = {
    'hip_stem': 0.25,    // Tapered stem + neck + head is much less than bounding box
    'bone_plate': 0.75,  // Plate with holes
    'knee_joint': 0.40,  // Complex femoral/tibial component geometry
    'spinal_rod': 0.65,  // Cylindrical rod (pi * r^2 * h vs w * h * l)
  };

  const actualVolume = boundingBoxVolume * volumeFactors[type];
  const density = MATERIAL_PROPERTIES[mat].density / 1000; // g/mm^3
  return actualVolume * density; // grams
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('design');
  const [implantType, setImplantType] = useState<ImplantType>('hip_stem');
  const [material, setMaterial] = useState<Material>('Ti6Al4V');
  const [loadCase, setLoadCase] = useState<LoadCase>('walking');
  
  const [patient, setPatient] = useState<PatientData>({ age: 45, weight: 75, boneDensity: 1.45 });
  const [geometry, setGeometry] = useState<GeometryData>({ length: 120, width: 15, thickness: 4.5 });
  
  const [elementSize, setElementSize] = useState(2.0);
  const [adaptiveRefinement, setAdaptiveRefinement] = useState(true);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [optimizationHistory, setOptimizationHistory] = useState<any[] | null>(null);

  const currentStress = useMemo(() => calculateStress(geometry, patient, loadCase, implantType, material, elementSize, adaptiveRefinement), [geometry, patient, loadCase, implantType, material, elementSize, adaptiveRefinement]);
  const currentWeight = useMemo(() => calculateWeight(geometry, material, implantType), [geometry, material, implantType]);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationResults({
        maxStress: currentStress,
        minStress: currentStress * 0.12, // Realistic minimum stress in unloaded regions
        maxDeformation: (currentStress / parseInt(MATERIAL_PROPERTIES[material].e)) * geometry.length * 0.15,
        fatigueLife: Math.max(10000, Math.floor(1e8 * Math.pow(MATERIAL_PROPERTIES[material].yield / currentStress, 3))),
        weight: currentWeight,
        boundingBoxVolume: geometry.length * geometry.width * geometry.thickness,
        isOptimized: false
      });
      setActiveTab('results');
    }, 1500);
  };

  const handleOptimize = () => {
    setIsSimulating(true);
    
    setTimeout(() => {
      let currentGeom = { ...geometry };
      let stress = calculateStress(currentGeom, patient, loadCase, implantType, material, elementSize, adaptiveRefinement);
      let targetStress = MATERIAL_PROPERTIES[material].yield / 1.5; // Safety Factor of 1.5
      
      const history = [];
      history.push({ 
        iteration: 0, 
        geom: { ...currentGeom }, 
        stress, 
        weight: calculateWeight(currentGeom, material, implantType),
        boundingBoxVolume: currentGeom.length * currentGeom.width * currentGeom.thickness
      });

      let iteration = 1;
      let currentMaterial = material;
      let materialChanged = false;

      // Iterative Optimization Loop
      // Goal: Reduce stress below target, but penalize excessive weight gain
      const maxAllowedWeight = history[0].weight * 1.3; // Allow max 30% weight increase

      while (stress > targetStress && iteration < 40) {
        // Optimization Strategy:
        // 1. Increase dimensions to reduce stress
        if (currentGeom.thickness < 25) currentGeom.thickness += 0.2;
        if (currentGeom.width < 50) currentGeom.width += 0.2;
        if (currentGeom.length < 300) currentGeom.length += 1.0;
        
        stress = calculateStress(currentGeom, patient, loadCase, implantType, currentMaterial, elementSize, adaptiveRefinement);
        let currentWeight = calculateWeight(currentGeom, currentMaterial, implantType);

        // 2. If weight gets too high, try a stronger/lighter material instead of just making it bigger
        if (currentWeight > maxAllowedWeight && !materialChanged) {
          // Find a material with a better strength-to-weight ratio
          const materials: Material[] = ['Ti6Al4V', 'SS316L', 'CoCr', 'PEEK', 'BioCeramic'];
          let bestMaterial = currentMaterial;
          let bestRatio = MATERIAL_PROPERTIES[currentMaterial].yield / MATERIAL_PROPERTIES[currentMaterial].density;

          for (const mat of materials) {
            const ratio = MATERIAL_PROPERTIES[mat].yield / MATERIAL_PROPERTIES[mat].density;
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestMaterial = mat;
            }
          }

          if (bestMaterial !== currentMaterial) {
            currentMaterial = bestMaterial;
            materialChanged = true;
            // Recalculate with new material
            stress = calculateStress(currentGeom, patient, loadCase, implantType, currentMaterial, elementSize, adaptiveRefinement);
            currentWeight = calculateWeight(currentGeom, currentMaterial, implantType);
            // Reset target stress for new material
            targetStress = MATERIAL_PROPERTIES[currentMaterial].yield / 1.5;
          } else {
            // If we can't find a better material, we have to accept the weight or stop.
            // Let's implement a "topological optimization" simulation:
            // We reduce the volume factor slightly to simulate hollowing out low-stress areas
            // This is a simplified representation of what a real topology optimization solver does.
            currentWeight *= 0.95; // Simulate 5% mass reduction via topology optimization
          }
        } else if (currentWeight > maxAllowedWeight && materialChanged) {
           // Simulate topology optimization if we already changed materials and are still too heavy
           currentWeight *= 0.95;
        }
        
        history.push({ 
          iteration, 
          geom: { ...currentGeom }, 
          stress, 
          weight: currentWeight,
          boundingBoxVolume: currentGeom.length * currentGeom.width * currentGeom.thickness,
          material: currentMaterial
        });
        iteration++;
      }
      
      setGeometry(currentGeom);
      if (materialChanged) {
        setMaterial(currentMaterial);
      }
      setOptimizationHistory(history);
      setSimulationResults({
        maxStress: stress,
        minStress: stress * 0.12,
        maxDeformation: (stress / parseInt(MATERIAL_PROPERTIES[currentMaterial].e)) * currentGeom.length * 0.15,
        fatigueLife: Math.max(10000, Math.floor(1e8 * Math.pow(MATERIAL_PROPERTIES[currentMaterial].yield / stress, 3))),
        weight: history[history.length - 1].weight, // Use the final weight which might include topology optimization
        boundingBoxVolume: currentGeom.length * currentGeom.width * currentGeom.thickness,
        isOptimized: true,
        originalStress: history[0].stress,
        originalWeight: history[0].weight,
        originalBoundingBoxVolume: history[0].boundingBoxVolume,
        materialChanged: materialChanged,
        newMaterial: currentMaterial
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
                currentWeight={currentWeight}
              />
            )}
            {activeTab === 'material' && <MaterialPanel material={material} setMaterial={setMaterial} geometry={geometry} implantType={implantType} />}
            {activeTab === 'fea' && (
              <FEAPanel 
                loadCase={loadCase} 
                setLoadCase={setLoadCase} 
                onSimulate={handleSimulate} 
                isSimulating={isSimulating} 
                elementSize={elementSize}
                setElementSize={setElementSize}
                adaptiveRefinement={adaptiveRefinement}
                setAdaptiveRefinement={setAdaptiveRefinement}
              />
            )}
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
                history={optimizationHistory}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
