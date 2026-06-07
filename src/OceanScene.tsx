import { Canvas, useFrame } from '@react-three/fiber';
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
        /* Orijinal boyutun %50'sine indirdik. Gerekirse 0.3 veya 0.7 yapabilirsin */
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
        /* Köpekbalığı yemi GLTF modelini %50 küçülttük */
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
      /* Orijinal boyutun %40'ına indirdik. Çok küçük gelirse 0.6 yapabilirsin */
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

function SceneContent({ distance, feedEvent }: { distance: number; feedEvent: any }) {
  const [baits, setBaits] = useState<BaitInstance[]>([]);
  const sharkGroupRef = useRef<THREE.Group>(null);
  const lollieGroupRef = useRef<THREE.Group>(null);
  const distanceRef = useRef(distance);

  useEffect(() => {
    distanceRef.current = distance;
  }, [distance]);

  // ÇÖZÜM: Yemin türüne (type) göre hedef X koordinatını ayrıştırdık
  const getCharacterX = (type: 'shark' | 'lollie', currentDist: number) => {
    if (type === 'shark') {
      // Köpekbalığı için dinamik hareket hesaplaması
      return -3.5 + ((10000 - currentDist) / 10000) * 6.0;
    }
    // Lollie'nin sabit X koordinatı
    return 2.5;
  };

  useEffect(() => {
    if (!feedEvent) return;
    // Yem atıldığında doğru hedefin (Lollie veya Shark) pozisyonunu alır
    const currentX = getCharacterX(feedEvent.choice, distanceRef.current);
    const newBait: BaitInstance = {
      id: feedEvent.id,
      type: feedEvent.choice,
      x: currentX,
      y: 5.5,
      speed: 0.09 + Math.random() * 0.03
    };
    setBaits((prev) => [...prev, newBait]);
  }, [feedEvent]);

  // OceanScene.tsx içindeki useFrame fonksiyonunun yeni hali:
useFrame((state) => {
  const time = state.clock.getElapsedTime();

  if (sharkGroupRef.current) {
    // Hedef X konumunu hesapla
    const targetX = getCharacterX('shark', distanceRef.current);
    
    /* LERP TEKNOLOJİSİ: Köpek balığının mevcut X pozisyonunu, gitmesi gereken X pozisyonuna 
       her karede %5 (%0.05) oranında yaklaştırır. Bu da harika bir süzülme efekti yaratır.
    */
    sharkGroupRef.current.position.x = THREE.MathUtils.lerp(
      sharkGroupRef.current.position.x, 
      targetX, 
      0.05
    );

    // Yukarı-aşağı dalgalanma ve hafif dönüş animasyonları
    sharkGroupRef.current.position.y = -0.5 + Math.sin(time * 1.8) * 0.15;
    sharkGroupRef.current.rotation.z = (-Math.PI / 2) + Math.cos(time * 1.8) * 0.08;
  }

  if (lollieGroupRef.current) {
    lollieGroupRef.current.position.y = -0.8 + Math.sin(time * 3.5) * 0.12;
    lollieGroupRef.current.rotation.y = Math.cos(time * 4.0) * 0.2;
  }

  // Yemlerin havada süzülürken karakterlerin dinamik konumuna kilitlenmesi
  setBaits((prevBaits) => {
    const currentSharkY = sharkGroupRef.current ? sharkGroupRef.current.position.y : -0.5;
    const currentLollieY = lollieGroupRef.current ? lollieGroupRef.current.position.y : -0.8;

    return prevBaits
      .map((bait) => {
        // Eğer yem köpek balığına atıldıysa, havada düşerken köpek balığının o anki anlık akıcı X koordinatını takip eder
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
      <ambientLight intensity={1.5} color="#b9e3de" />
      <directionalLight position={[5, 15, 8]} intensity={2.5} color="#ffffff" />
      <pointLight position={[0, 2, 6]} intensity={1.8} color="#e0f2fe" distance={25} />

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

export default function OceanScene({ distance, feedEvent }: { distance: number; feedEvent: any }) {
  return (
    <Canvas camera={{ position: [0, 0, 5.5], fov: 60 }}>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 4.5, 9.5]} />
      <Suspense fallback={null}>
        <SceneContent distance={distance} feedEvent={feedEvent} />
      </Suspense>
    </Canvas>
  );
}