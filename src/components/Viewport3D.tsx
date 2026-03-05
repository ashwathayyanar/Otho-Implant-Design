import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows, Html } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import * as THREE from 'three';
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

const MATERIAL_APPEARANCE: Record<Material, { color: string; metalness: number; roughness: number }> = {
  'Ti6Al4V': { color: '#8a8d8f', metalness: 0.9, roughness: 0.3 },
  'SS316L': { color: '#d1d5db', metalness: 0.9, roughness: 0.1 },
  'CoCr': { color: '#b0b8c1', metalness: 1.0, roughness: 0.05 },
  'PEEK': { color: '#d2b48c', metalness: 0.0, roughness: 0.6 },
  'BioCeramic': { color: '#f8fafc', metalness: 0.0, roughness: 0.2 },
};

function StressLabel({ ratio }: { ratio: number }) {
  if (ratio < 0.66) {
    return (
      <div className="bg-green-500/90 text-white text-[10px] px-2 py-1 rounded font-mono whitespace-nowrap border border-green-400">
        MIN STRESS
      </div>
    );
  } else if (ratio < 0.85) {
    return (
      <div className="bg-yellow-500/90 text-white text-[10px] px-2 py-1 rounded font-mono whitespace-nowrap border border-yellow-400">
        MEDIUM STRESS
      </div>
    );
  } else if (ratio < 1.0) {
    return (
      <div className="bg-orange-500/90 text-white text-[10px] px-2 py-1 rounded font-mono whitespace-nowrap border border-orange-400">
        HIGH STRESS
      </div>
    );
  } else {
    return (
      <div className="bg-red-500/90 text-white text-[10px] px-2 py-1 rounded font-mono whitespace-nowrap border border-red-400">
        MAX STRESS
      </div>
    );
  }
}

function HipStem({ showResults, geometry, color, ratio, appearance }: { showResults: boolean, geometry: GeometryData, color: string, ratio: number, appearance: any }) {
  const group = useRef<THREE.Group>(null);
  
  // Scale based on parametric geometry
  const scaleX = geometry.width / 15;
  const scaleY = geometry.length / 120;
  const scaleZ = geometry.thickness / 4.5;

  return (
    <group ref={group} position={[0, 0, 0]} scale={[scaleX, scaleY, scaleZ]}>
      {/* Stem */}
      <mesh position={[0, -2, 0]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.3, 0.1, 4, 32]} />
        <meshStandardMaterial 
          color={showResults ? color : appearance.color} 
          metalness={showResults ? 0.8 : appearance.metalness} 
          roughness={showResults ? 0.2 : appearance.roughness} 
        />
      </mesh>
      {/* Neck (High Stress Area) */}
      <mesh position={[0.4, 0.5, 0]} rotation={[0, 0, -0.8]}>
        <cylinderGeometry args={[0.2, 0.3, 1.5, 32]} />
        <meshStandardMaterial 
          color={showResults ? color : appearance.color} 
          metalness={showResults ? 0.8 : appearance.metalness} 
          roughness={showResults ? 0.2 : appearance.roughness} 
        />
        {showResults && (
          <Html position={[0.5, 0.5, 0]} center>
            <StressLabel ratio={ratio} />
          </Html>
        )}
      </mesh>
      {/* Head */}
      <mesh position={[0.9, 1.0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          color={showResults ? "#22c55e" : appearance.color} 
          metalness={showResults ? 0.9 : appearance.metalness} 
          roughness={showResults ? 0.1 : appearance.roughness} 
        />
        {showResults && ratio >= 0.66 && (
          <Html position={[0, 0.6, 0]} center>
            <div className="bg-green-500/90 text-white text-[10px] px-2 py-1 rounded font-mono whitespace-nowrap border border-green-400">
              MIN STRESS
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
}

function BonePlate({ showResults, geometry, color, ratio, appearance }: { showResults: boolean, geometry: GeometryData, color: string, ratio: number, appearance: any }) {
  const scaleX = geometry.width / 15;
  const scaleY = geometry.length / 120;
  const scaleZ = geometry.thickness / 4.5;

  return (
    <group position={[0, 0, 0]} scale={[scaleX, scaleY, scaleZ]}>
      <mesh>
        <boxGeometry args={[1, 4, 0.2]} />
        <meshStandardMaterial 
          color={showResults ? color : appearance.color} 
          metalness={showResults ? 0.8 : appearance.metalness} 
          roughness={showResults ? 0.2 : appearance.roughness} 
        />
      </mesh>
      {/* Holes */}
      {[-1.5, -0.5, 0.5, 1.5].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.25, 32]} />
            <meshBasicMaterial color="#222" />
          </mesh>
          {/* Middle hole is usually max stress */}
          {showResults && i === 1 && (
            <Html position={[0.5, 0, 0]} center>
              <StressLabel ratio={ratio} />
            </Html>
          )}
        </group>
      ))}
      {showResults && ratio >= 0.66 && (
        <Html position={[0, -2.2, 0]} center>
          <div className="bg-green-500/90 text-white text-[10px] px-2 py-1 rounded font-mono whitespace-nowrap border border-green-400">
            MIN STRESS
          </div>
        </Html>
      )}
    </group>
  );
}

function KneeJoint({ showResults, geometry, color, ratio, appearance }: { showResults: boolean, geometry: GeometryData, color: string, ratio: number, appearance: any }) {
  const scale = geometry.width / 15;
  return (
    <group position={[0, 0, 0]} scale={[scale, scale, scale]}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial 
          color={showResults ? color : appearance.color} 
          metalness={showResults ? 0.8 : appearance.metalness} 
          roughness={showResults ? 0.2 : appearance.roughness} 
        />
      </mesh>
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[1, 0.8, 2, 32]} />
        <meshStandardMaterial 
          color={showResults ? "#22c55e" : appearance.color} 
          metalness={showResults ? 0.8 : appearance.metalness} 
          roughness={showResults ? 0.2 : appearance.roughness} 
        />
      </mesh>
      {showResults && (
        <Html position={[1.2, 1, 0]} center>
          <StressLabel ratio={ratio} />
        </Html>
      )}
    </group>
  );
}

function SpinalRod({ showResults, geometry, color, ratio, appearance }: { showResults: boolean, geometry: GeometryData, color: string, ratio: number, appearance: any }) {
  const scaleY = geometry.length / 120;
  const scaleXZ = geometry.thickness / 4.5;
  
  return (
    <group position={[0, 0, 0]}>
      <mesh rotation={[0, 0, 0]} scale={[scaleXZ, scaleY, scaleXZ]}>
        <cylinderGeometry args={[0.2, 0.2, 6, 32]} />
        <meshStandardMaterial 
          color={showResults ? color : appearance.color} 
          metalness={showResults ? 0.8 : appearance.metalness} 
          roughness={showResults ? 0.2 : appearance.roughness} 
        />
      </mesh>
      {[-2, 0, 2].map((y, i) => (
        <group key={i} position={[0.3, y * scaleY, 0]}>
          <mesh rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[0.2, 0.2, 1, 32]} />
            <meshStandardMaterial 
              color={appearance.color} 
              metalness={appearance.metalness} 
              roughness={appearance.roughness} 
            />
          </mesh>
          {showResults && i === 1 && (
            <Html position={[0.8, 0, 0]} center>
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
  const appearance = MATERIAL_APPEARANCE[material];

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
        <color attach="background" args={['#18181b']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        {implantType === 'hip_stem' && <HipStem showResults={showResults} geometry={geometry} color={baseColor} ratio={ratio} appearance={appearance} />}
        {implantType === 'bone_plate' && <BonePlate showResults={showResults} geometry={geometry} color={baseColor} ratio={ratio} appearance={appearance} />}
        {implantType === 'knee_joint' && <KneeJoint showResults={showResults} geometry={geometry} color={baseColor} ratio={ratio} appearance={appearance} />}
        {implantType === 'spinal_rod' && <SpinalRod showResults={showResults} geometry={geometry} color={baseColor} ratio={ratio} appearance={appearance} />}

        <Grid infiniteGrid fadeDistance={20} sectionColor="#3f3f46" cellColor="#27272a" />
        <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        <OrbitControls makeDefault />
        <Environment preset="studio" />
        
        <EffectComposer>
          <Bloom 
            luminanceThreshold={1} 
            mipmapBlur 
            intensity={0.5} 
            radius={0.4}
          />
          <ToneMapping mode={THREE.ACESFilmicToneMapping} />
        </EffectComposer>
      </Canvas>
      
      {/* Overlay info */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-zinc-950/80 backdrop-blur border border-zinc-800 px-3 py-2 rounded-lg">
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Active Model</p>
          <p className="text-sm font-medium text-zinc-100">{implantType.replace('_', ' ').toUpperCase()}</p>
        </div>
        <div className="bg-zinc-950/80 backdrop-blur border border-zinc-800 px-3 py-2 rounded-lg">
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Dimensions</p>
          <p className="text-sm font-medium text-zinc-100 font-mono">
            {geometry.length.toFixed(1)} x {geometry.width.toFixed(1)} x {geometry.thickness.toFixed(1)} mm
          </p>
        </div>
      </div>
      
      {showResults && (
        <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur border border-zinc-800 px-4 py-3 rounded-lg pointer-events-none w-48">
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Von Mises Stress</p>
          <div className="w-full h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-sm mb-1" />
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>0 MPa</span>
            <span>{yieldStrength} MPa (Yield)</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-400 mb-1">Current Max Stress:</p>
            <p className={`text-lg font-mono font-bold ${stress > yieldStrength ? 'text-red-500' : 'text-emerald-500'}`}>
              {stress.toFixed(1)} MPa
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
