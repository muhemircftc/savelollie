import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GAME_CONFIG } from './gameConfig';

function SafeModel({ path, fallback }: { path: string; fallback: React.ReactNode }) {
  try {
    const { scene } = useGLTF(path);
    const clone = scene.clone();
    return <primitive object={clone} />;
  } catch (e) {
    return <>{fallback}</>;
  }
}

function BaitModel({ type }: { type: 'lollie' | 'shark' }) {
  if (type === 'lollie') {
    if (GAME_CONFIG.models.lollieBaitMode === 'gltf') {
      return (
        <group scale={[0.1, 0.1, 0.1]}> 
          <SafeModel path={GAME_CONFIG.models.lollieBaitPath} fallback={<torusGeometry args={[0.12, 0.04, 8, 24]} />} />
        </group>
      );
    }
    return (
      <mesh>
        <torusGeometry args={[0.12, 0.04, 8, 24]} />
        <meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={0.6} roughness={0.2} />
      </mesh>
    );
  } else {
    if (GAME_CONFIG.models.sharkBaitMode === 'gltf') {
      return (
        <group scale={[0.4, 0.4, 0.4]}>
          <SafeModel path={GAME_CONFIG.models.sharkBaitPath} fallback={<boxGeometry args={[0.22, 0.22, 0.22]} />} />
        </group>
      );
    }
    return (
      <mesh>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
        <meshStandardMaterial color="#ef4444" roughness={0.5} metalness={0.1} />
      </mesh>
    );
  }
}

function SharkModel() {
  if (GAME_CONFIG.models.sharkMode === 'gltf') {
    return (
      <group rotation={[0, 0, Math.PI / 2]} scale={[1.5, 1.5, 1.5]}>
        <SafeModel path={GAME_CONFIG.models.sharkPath} fallback={<coneGeometry args={[0.6, 1.8, 4]} />} />
      </group>
    );
  }
  return (
    <mesh>
      <coneGeometry args={[0.6, 1.8, 4]} />
      <meshStandardMaterial color="#334155" roughness={0.4} />
    </mesh>
  );
}

function LollieModel() {
  if (GAME_CONFIG.models.lollieMode === 'gltf') {
    return (
      <group scale={[0.2, 0.2, 0.2]}>
        <SafeModel path={GAME_CONFIG.models.lolliePath} fallback={<sphereGeometry args={[0.4, 32, 16]} />} />
      </group>
    );
  }
  return (
    <mesh>
      <sphereGeometry args={[0.4, 32, 16]} />
      <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.2} />
    </mesh>
  );
}

interface BaitInstance {
  id: number;
  type: 'lollie' | 'shark';
  x: number;
  y: number;
  speed: number;
}

function SceneContent({ distance }: { distance: number }) {
  const [baits, setBaits] = useState<BaitInstance[]>([]);
  const sharkGroupRef = useRef<THREE.Group>(null);
  const lollieGroupRef = useRef<THREE.Group>(null);
  const distanceRef = useRef(distance);

  const { camera, scene, size } = useThree();

  useEffect(() => {
    distanceRef.current = distance;
  }, [distance]);

  useEffect(() => {
    const isPortrait = size.height > size.width;
    if (isPortrait) {
      camera.position.z = 10.5;
      if (scene.fog) {
        (scene.fog as THREE.Fog).near = 8.5;
        (scene.fog as THREE.Fog).far = 17.0;
      }
    } else {
      camera.position.z = 5.5;
      if (scene.fog) {
        (scene.fog as THREE.Fog).near = 4.5;
        (scene.fog as THREE.Fog).far = 10.5;
      }
    }
    camera.updateProjectionMatrix();
  }, [size.width, size.height, camera, scene]);

  // RESPONSIVE KARAKTER POZİSYONLARI
  const getCharacterX = (type: 'shark' | 'lollie', currentDist: number) => {
    const isPortraitMode = size.height > size.width;
    const sharkStartX = isPortraitMode ? -2.1 : -3.5;
    const lollieX = isPortraitMode ? 1.7 : 2.5;
    const movementRange = isPortraitMode ? 3.8 : 6.0;

    if (type === 'shark') {
      return sharkStartX + ((10000 - currentDist) / 10000) * movementRange;
    }
    return lollieX;
  };

  // 🔄 OTOMATİK, KESİNTİSİZ VE HIZLI YEM AKIŞI MECHANISM (BUTONDAN BAĞIMSIZ)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      
      setBaits((prev) => [
        ...prev,
        {
          id: now + Math.random(),
          type: 'shark',
          x: 0, 
          y: 5.5,
          speed: 0.08 + Math.random() * 0.04 
        },
        {
          id: now + Math.random() + 1,
          type: 'lollie',
          x: 0,
          y: 5.5,
          speed: 0.08 + Math.random() * 0.04
        }
      ]);
    }, 220); 

    return () => clearInterval(interval);
  }, []);

  useFrame(() => {
    const time = performance.now() * 0.001; 

    if (sharkGroupRef.current) {
      const targetX = getCharacterX('shark', distanceRef.current);
      sharkGroupRef.current.position.x = THREE.MathUtils.lerp(
        sharkGroupRef.current.position.x, 
        targetX, 
        0.05
      );
      sharkGroupRef.current.position.y = -0.5 + Math.sin(time * 1.8) * 0.15;
      sharkGroupRef.current.rotation.z = (-Math.PI / 2) + Math.cos(time * 1.8) * 0.08;
    }

    if (lollieGroupRef.current) {
      const targetX = getCharacterX('lollie', distanceRef.current);
      lollieGroupRef.current.position.x = targetX;
      lollieGroupRef.current.position.y = -0.8 + Math.sin(time * 3.5) * 0.12;
      lollieGroupRef.current.rotation.y = Math.cos(time * 4.0) * 0.2;
    }

    setBaits((prevBaits) => {
      const currentSharkY = sharkGroupRef.current ? sharkGroupRef.current.position.y : -0.5;
      const currentLollieY = lollieGroupRef.current ? lollieGroupRef.current.position.y : -0.8;

      return prevBaits
        .map((bait) => {
          const characterX = bait.type === 'shark' && sharkGroupRef.current 
            ? sharkGroupRef.current.position.x 
            : getCharacterX(bait.type, distanceRef.current);

          return { ...bait, x: characterX, y: bait.y - bait.speed };
        })
        .filter((bait) => {
          const limitY = bait.type === 'shark' ? currentSharkY : currentLollieY;
          return bait.y > limitY;
        });
    });
  });

  return (
    <>
      <ambientLight intensity={2.5} color="#c2f0eb" />
      <directionalLight position={[5, 15, 10]} intensity={3.5} color="#ffffff" />
      <pointLight position={[0, 3, 7]} intensity={2.8} color="#e0f2fe" distance={30} />

      <group ref={sharkGroupRef} position={[-3.5, -0.5, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <SharkModel />
      </group>

      <group ref={lollieGroupRef} position={[2.5, -0.8, 0]}>
        <LollieModel />
      </group>

      {baits.map((bait) => (
        <group key={bait.id} position={[bait.x, bait.y, 0]}>
          <BaitModel type={bait.type} />
        </group>
      ))}

      <ParticlesEffect />
    </>
  );
}

function ParticlesEffect() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 40;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = Math.random() * 12 - 6;
    positions[i + 1] = Math.random() * 10 - 5;
    positions[i + 2] = Math.random() * 4 - 2;
  }

  useFrame(() => {
    if (!pointsRef.current) return;
    const array = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 1; i < array.length; i += 3) {
      array[i] -= 0.01;
      if (array[i] < -5) array[i] = 5;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.07} color="#38bdf8" transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

export default function OceanScene({ distance }: { distance: number }) {
  return (
    <Canvas camera={{ position: [0, 0, 5.5], fov: 60 }}>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 4.5, 10.5]} />
      <Suspense fallback={null}>
        <SceneContent distance={distance} />
      </Suspense>
    </Canvas>
  );
}