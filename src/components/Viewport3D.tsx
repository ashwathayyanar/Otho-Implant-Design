import React, { useRef, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  Grid, 
  ContactShadows, 
  Html, 
  Float, 
  Stage, 
  PerspectiveCamera,
  BakeShadows,
  PresentationControls,
  Center
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration, Scanline, SSAO, DepthOfField } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { Maximize2, RotateCcw, Box, Activity, Layers, Zap, ZapOff, Target } from 'lucide-react';
import { ImplantType, Material, GeometryData } from '../App';

interface ViewportProps {
  implantType: ImplantType;
  material: Material;
  geometry: GeometryData;
  showResults: boolean;
  stress: number;
  yieldStrength: number;
}

// Helper to get color based on stress
const getStressColor = (stress: number, yieldStrength: number) => {
  const ratio = Math.min(stress / yieldStrength, 1.2);
  if (ratio < 0.66) return "#22c55e"; // Green (Safe, SF > 1.5)
  if (ratio < 0.85) return "#eab308"; // Yellow
  if (ratio < 1.0) return "#f97316"; // Orange
  return "#ef4444"; // Red
};

function StressLabel({ ratio, label }: { ratio: number, label?: string }) {
  const baseClass = "px-2 py-1 rounded font-mono whitespace-nowrap border text-[10px] shadow-lg backdrop-blur-md transition-all duration-300";
  
  if (ratio < 0.66) {
    return (
      <div className={`${baseClass} bg-emerald-500/20 text-emerald-400 border-emerald-500/30`}>
        {label || "MIN STRESS"}
      </div>
    );
  } else if (ratio < 0.85) {
    return (
      <div className={`${baseClass} bg-yellow-500/20 text-yellow-400 border-yellow-500/30`}>
        {label || "MEDIUM STRESS"}
      </div>
    );
  } else if (ratio < 1.0) {
    return (
      <div className={`${baseClass} bg-orange-500/20 text-orange-400 border-orange-500/30`}>
        {label || "HIGH STRESS"}
      </div>
    );
  } else {
    return (
      <div className={`${baseClass} bg-red-500/20 text-red-400 border-red-500/30 animate-pulse`}>
        {label || "MAX STRESS"}
      </div>
    );
  }
}

function ImplantMaterial({ color, showResults, ratio, highQuality }: { color: string, showResults: boolean, ratio: number, highQuality?: boolean }) {
  const emissive = showResults && ratio > 0.85 ? color : "#000000";
  const emissiveIntensity = showResults && ratio > 0.85 ? (Math.sin(Date.now() / 200) * 0.5 + 0.5) * 2 : 0;

  return (
    <meshPhysicalMaterial 
      color={showResults ? color : "#52525b"} 
      metalness={0.95} 
      roughness={highQuality ? 0.05 : 0.1}
      clearcoat={1}
      clearcoatRoughness={0.02}
      reflectivity={1}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      envMapIntensity={highQuality ? 2 : 1.5}
      anisotropy={highQuality ? 1 : 0}
      anisotropyRotation={0.5}
    />
  );
}

function HipStem({ showResults, geometry, color, ratio, onFocus, highQuality }: { showResults: boolean, geometry: GeometryData, color: string, ratio: number, onFocus?: (p: THREE.Vector3) => void, highQuality?: boolean }) {
  const group = useRef<THREE.Group>(null);
  
  const scaleX = geometry.width / 15;
  const scaleY = geometry.length / 120;
  const scaleZ = geometry.thickness / 4.5;

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (onFocus) onFocus(e.point);
  };

  return (
    <group ref={group} scale={[scaleX, scaleY, scaleZ]} onPointerDown={handlePointerDown}>
      <mesh position={[0, -2, 0]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.3, 0.1, 4, 32]} />
        <ImplantMaterial color={showResults ? color : "#71717a"} showResults={showResults} ratio={ratio} highQuality={highQuality} />
      </mesh>
      <mesh position={[0.4, 0.5, 0]} rotation={[0, 0, -0.8]}>
        <cylinderGeometry args={[0.2, 0.3, 1.5, 32]} />
        <ImplantMaterial color={showResults ? color : "#71717a"} showResults={showResults} ratio={ratio} highQuality={highQuality} />
        {showResults && (
          <Html position={[0.5, 0.5, 0]} center distanceFactor={6}>
            <StressLabel ratio={ratio} />
          </Html>
        )}
      </mesh>
      <mesh position={[0.9, 1.0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhysicalMaterial color={showResults ? "#10b981" : "#71717a"} metalness={1} roughness={0.05} clearcoat={1} />
        {showResults && ratio >= 0.66 && (
          <Html position={[0, 0.6, 0]} center distanceFactor={6}>
            <StressLabel ratio={0.1} label="MIN STRESS" />
          </Html>
        )}
      </mesh>
    </group>
  );
}

function BonePlate({ showResults, geometry, color, ratio, onFocus, highQuality }: { showResults: boolean, geometry: GeometryData, color: string, ratio: number, onFocus?: (p: THREE.Vector3) => void, highQuality?: boolean }) {
  const scaleX = geometry.width / 15;
  const scaleY = geometry.length / 120;
  const scaleZ = geometry.thickness / 4.5;

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (onFocus) onFocus(e.point);
  };

  return (
    <group scale={[scaleX, scaleY, scaleZ]} onPointerDown={handlePointerDown}>
      <mesh>
        <boxGeometry args={[1.2, 4.5, 0.2]} />
        <ImplantMaterial color={showResults ? color : "#71717a"} showResults={showResults} ratio={ratio} highQuality={highQuality} />
      </mesh>
      {[-1.8, -0.6, 0.6, 1.8].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.3, 32]} />
            <meshBasicMaterial color="#09090b" />
          </mesh>
          {showResults && i === 1 && (
            <Html position={[0.6, 0, 0]} center distanceFactor={6}>
              <StressLabel ratio={ratio} />
            </Html>
          )}
        </group>
      ))}
      {showResults && ratio >= 0.66 && (
        <Html position={[0, -2.5, 0]} center distanceFactor={6}>
          <StressLabel ratio={0.1} label="MIN STRESS" />
        </Html>
      )}
    </group>
  );
}

function KneeJoint({ showResults, geometry, color, ratio, onFocus, highQuality }: { showResults: boolean, geometry: GeometryData, color: string, ratio: number, onFocus?: (p: THREE.Vector3) => void, highQuality?: boolean }) {
  const scale = geometry.width / 15;

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (onFocus) onFocus(e.point);
  };

  return (
    <group scale={[scale, scale, scale]} onPointerDown={handlePointerDown}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2.2, 1.2, 2.2]} />
        <ImplantMaterial color={showResults ? color : "#71717a"} showResults={showResults} ratio={ratio} highQuality={highQuality} />
      </mesh>
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[1.1, 0.9, 2.2, 32]} />
        <meshPhysicalMaterial color={showResults ? "#10b981" : "#71717a"} metalness={0.9} roughness={0.1} clearcoat={1} />
      </mesh>
      {showResults && (
        <Html position={[1.5, 1, 0]} center distanceFactor={6}>
          <StressLabel ratio={ratio} />
        </Html>
      )}
    </group>
  );
}

function SpinalRod({ showResults, geometry, color, ratio, onFocus, highQuality }: { showResults: boolean, geometry: GeometryData, color: string, ratio: number, onFocus?: (p: THREE.Vector3) => void, highQuality?: boolean }) {
  const scaleY = geometry.length / 120;
  const scaleXZ = geometry.thickness / 4.5;

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (onFocus) onFocus(e.point);
  };
  
  return (
    <group onPointerDown={handlePointerDown}>
      <mesh rotation={[0, 0, 0]} scale={[scaleXZ, scaleY, scaleXZ]}>
        <cylinderGeometry args={[0.25, 0.25, 6, 32]} />
        <ImplantMaterial color={showResults ? color : "#71717a"} showResults={showResults} ratio={ratio} highQuality={highQuality} />
      </mesh>
      {[-2.2, 0, 2.2].map((y, i) => (
        <group key={i} position={[0.4, y * scaleY, 0]}>
          <mesh rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[0.22, 0.22, 1.2, 32]} />
            <meshPhysicalMaterial color="#71717a" metalness={0.9} roughness={0.1} />
          </mesh>
          {showResults && i === 1 && (
            <Html position={[1, 0, 0]} center distanceFactor={6}>
              <StressLabel ratio={ratio} />
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

export function Viewport3D({ implantType, material, geometry, showResults, stress, yieldStrength }: ViewportProps) {
  const baseColor = getStressColor(stress, yieldStrength);
  const ratio = stress / yieldStrength;
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [highQuality, setHighQuality] = useState(true);
  const [focusPoint, setFocusPoint] = useState<[number, number, number]>([0, 0, 0]);
  const orbitRef = useRef<any>(null);

  const resetCamera = () => {
    if (orbitRef.current) {
      orbitRef.current.reset();
    }
  };

  const chromaticOffset = useMemo(() => new THREE.Vector2(0.0005, 0.0005), []);

  return (
    <div className="w-full h-full relative group bg-zinc-950 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#18181b_0%,#09090b_100%)] pointer-events-none" />
      
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center text-zinc-500 font-mono text-xs">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            INITIALIZING VIEWPORT...
          </div>
        </div>
      }>
        <Canvas shadows dpr={[1, 2]} camera={{ position: [8, 8, 8], fov: 40 }}>
          <color attach="background" args={['#09090b']} />
          <fog attach="fog" args={['#09090b', 10, 25]} />
          
          <Stage environment="studio" intensity={0.5} adjustCamera={false}>
            <Center>
              <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                <PresentationControls global zoom={0.8} rotation={[0, 0, 0]} polar={[-Math.PI / 4, Math.PI / 4]} azimuth={[-Math.PI / 4, Math.PI / 4]}>
                  <group>
                    {implantType === 'hip_stem' && <HipStem showResults={showResults} geometry={geometry} color={baseColor} ratio={ratio} onFocus={(p) => setFocusPoint([p.x, p.y, p.z])} highQuality={highQuality} />}
                    {implantType === 'bone_plate' && <BonePlate showResults={showResults} geometry={geometry} color={baseColor} ratio={ratio} onFocus={(p) => setFocusPoint([p.x, p.y, p.z])} highQuality={highQuality} />}
                    {implantType === 'knee_joint' && <KneeJoint showResults={showResults} geometry={geometry} color={baseColor} ratio={ratio} onFocus={(p) => setFocusPoint([p.x, p.y, p.z])} highQuality={highQuality} />}
                    {implantType === 'spinal_rod' && <SpinalRod showResults={showResults} geometry={geometry} color={baseColor} ratio={ratio} onFocus={(p) => setFocusPoint([p.x, p.y, p.z])} highQuality={highQuality} />}
                    
                    {wireframe && (
                      <mesh scale={1.01}>
                        {implantType === 'hip_stem' && <cylinderGeometry args={[0.3, 0.1, 4, 32]} />}
                        {implantType === 'bone_plate' && <boxGeometry args={[1.2, 4.5, 0.2]} />}
                        {implantType === 'knee_joint' && <boxGeometry args={[2.2, 1.2, 2.2]} />}
                        {implantType === 'spinal_rod' && <cylinderGeometry args={[0.25, 0.25, 6, 32]} />}
                        <meshBasicMaterial wireframe color="#10b981" transparent opacity={0.2} />
                      </mesh>
                    )}
                  </group>
                </PresentationControls>
              </Float>
            </Center>
          </Stage>

          <Grid 
            infiniteGrid 
            fadeDistance={25} 
            sectionColor="#18181b" 
            cellColor="#27272a" 
            sectionSize={1} 
            cellSize={0.2} 
            position={[0, -3.5, 0]}
          />
          
          <ContactShadows 
            position={[0, -3.4, 0]} 
            opacity={0.6} 
            scale={15} 
            blur={2.5} 
            far={4} 
            color="#000000"
          />

          <OrbitControls 
            ref={orbitRef}
            makeDefault 
            enableDamping 
            dampingFactor={0.05} 
            minDistance={5} 
            maxDistance={15}
            autoRotate={autoRotate}
            autoRotateSpeed={1}
          />

          <EffectComposer multisampling={highQuality ? 8 : 0}>
            <Bloom luminanceThreshold={1} luminanceSmoothing={0.9} height={300} intensity={0.8} />
            <Noise opacity={0.015} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
            <ChromaticAberration 
              blendFunction={BlendFunction.NORMAL} 
              offset={chromaticOffset} 
            />
            <Scanline opacity={0.01} density={1.5} />
            
            <DepthOfField 
              focusDistance={0.025} 
              focalLength={0.05} 
              bokehScale={highQuality ? 2 : 0} 
              height={480} 
              target={focusPoint}
            />
          </EffectComposer>

          <BakeShadows />
        </Canvas>
      </Suspense>
      
      {/* Viewport Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <button 
          onClick={resetCamera}
          className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 rounded-lg backdrop-blur transition-all"
          title="Reset Camera"
        >
          <RotateCcw size={16} />
        </button>
        <button 
          onClick={() => setWireframe(!wireframe)}
          className={`p-2 border rounded-lg backdrop-blur transition-all ${wireframe ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-100'}`}
          title="Toggle Wireframe"
        >
          <Layers size={16} />
        </button>
        <button 
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 border rounded-lg backdrop-blur transition-all ${autoRotate ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-100'}`}
          title="Toggle Auto-Rotate"
        >
          <RotateCcw size={16} className={autoRotate ? 'animate-spin-slow' : ''} />
        </button>
        <button 
          onClick={() => setHighQuality(!highQuality)}
          className={`p-2 border rounded-lg backdrop-blur transition-all ${highQuality ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-100'}`}
          title={highQuality ? "High Quality Mode" : "Performance Mode"}
        >
          {highQuality ? <Zap size={16} /> : <ZapOff size={16} />}
        </button>
      </div>

      {/* Overlay info */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-zinc-950/60 backdrop-blur-md border border-zinc-800/50 px-4 py-3 rounded-xl shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Box size={14} className="text-emerald-500" />
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Active Model</p>
          </div>
          <p className="text-sm font-semibold text-zinc-100 tracking-tight">{implantType.replace('_', ' ').toUpperCase()}</p>
        </div>
        <div className="bg-zinc-950/60 backdrop-blur-md border border-zinc-800/50 px-4 py-3 rounded-xl shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Maximize2 size={14} className="text-emerald-500" />
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Dimensions</p>
          </div>
          <p className="text-sm font-semibold text-zinc-100 font-mono tracking-tighter">
            {geometry.length.toFixed(1)} <span className="text-zinc-600">×</span> {geometry.width.toFixed(1)} <span className="text-zinc-600">×</span> {geometry.thickness.toFixed(1)} <span className="text-zinc-500 text-[10px]">mm</span>
          </p>
        </div>
      </div>
      
      {showResults && (
        <div className="absolute top-4 right-4 bg-zinc-950/40 backdrop-blur-xl border border-white/5 px-6 py-5 rounded-2xl shadow-2xl pointer-events-none w-64 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-500" />
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em]">Stress Analysis</p>
            </div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 mb-2 uppercase tracking-wider">
                <span>Distribution</span>
                <span className={stress > yieldStrength ? 'text-red-400' : 'text-emerald-400'}>
                  {((stress / yieldStrength) * 100).toFixed(1)}% Yield
                </span>
              </div>
              <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden flex gap-0.5">
                <div className="h-full bg-emerald-500/80" style={{ width: '40%' }} />
                <div className="h-full bg-yellow-500/80" style={{ width: '30%' }} />
                <div className="h-full bg-orange-500/80" style={{ width: '20%' }} />
                <div className="h-full bg-red-500/80" style={{ width: '10%' }} />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Peak Von Mises</p>
              <div className="flex items-baseline gap-1">
                <p className={`text-3xl font-mono font-light tracking-tighter ${stress > yieldStrength ? 'text-red-500' : 'text-zinc-100'}`}>
                  {stress.toFixed(1)}
                </p>
                <span className="text-xs text-zinc-500 font-mono">MPa</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider">Safety Factor</span>
                <span className={`text-sm font-mono font-medium ${(yieldStrength / stress) < 1.5 ? 'text-orange-500' : 'text-emerald-500'}`}>
                  {(yieldStrength / stress).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
