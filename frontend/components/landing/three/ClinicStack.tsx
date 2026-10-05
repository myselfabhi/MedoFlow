'use client'

/**
 * ClinicStack — the central 3D motif for MedoFlow's landing page.
 *
 * Four layered glass panels representing the four pillars (Scheduling,
 * EMR, Billing, AI Scribe), with a teal light beam threading through
 * them and ambient particles. Camera pull-back and rotation is driven
 * by props so different sections can re-use the same scene at different
 * angles.
 */

import React, { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment, PerspectiveCamera, RoundedBox, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

const NAVY = '#1E3A5F'
const TEAL = '#0D9488'
const TEAL_BRIGHT = '#5EEAD4'

type PanelProps = {
  position: [number, number, number]
  rotation?: [number, number, number]
  color?: string
  emissive?: string
  width?: number
  height?: number
  depth?: number
}

function GlassPanel({
  position,
  rotation = [0, 0, 0],
  color = '#5EEAD4',
  emissive = TEAL_BRIGHT,
  width = 2.4,
  height = 1.5,
  depth = 0.05,
}: PanelProps) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    ref.current.rotation.z = rotation[2] + Math.sin(t * 0.4) * 0.015
  })

  return (
    <group ref={ref} position={position} rotation={rotation}>
      {/* Big soft glow halo */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[width + 0.8, height + 0.6]} />
        <meshBasicMaterial color={emissive} transparent opacity={0.22} />
      </mesh>

      {/* Solid bright card — clearly visible against navy */}
      <RoundedBox args={[width, height, depth]} radius={0.1} smoothness={4}>
        <meshBasicMaterial color={color} transparent opacity={0.92} />
      </RoundedBox>

      {/* Inner bright frame */}
      <mesh position={[0, 0, depth / 2 + 0.001]}>
        <ringGeometry args={[Math.min(width, height) * 0.42, Math.min(width, height) * 0.46, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

function PulsingBeam() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.45 + Math.sin(t * 1.6) * 0.18
  })

  return (
    <mesh ref={ref} position={[0, 0, -1.5]}>
      <cylinderGeometry args={[0.025, 0.025, 4.5, 16]} />
      <meshBasicMaterial color={TEAL_BRIGHT} transparent opacity={0.35} />
    </mesh>
  )
}

function Particles() {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const n = 60
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6
      arr[i * 3 + 1] = (Math.random() - 0.5) * 4
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3
    }
    return arr
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.04} color={TEAL_BRIGHT} transparent opacity={0.7} />
    </points>
  )
}

type SceneProps = {
  cameraPosition?: [number, number, number]
  rotateY?: boolean
}

function Scene({ cameraPosition = [0, 0, 5.5], rotateY = true }: SceneProps) {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.getElapsedTime()
    if (rotateY) {
      group.current.rotation.y = Math.sin(t * 0.25) * 0.25
    }
    group.current.position.y = Math.sin(t * 0.5) * 0.06
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={cameraPosition} fov={42} />

      <ambientLight intensity={0.7} color={'#ffffff'} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} color={TEAL_BRIGHT} />
      <directionalLight position={[-4, -2, -3]} intensity={1.0} color={'#8ab4d8'} />
      <pointLight position={[0, 0, 2]} intensity={3.5} color={TEAL_BRIGHT} distance={8} />
      <pointLight position={[-2, 2, 1]} intensity={2.0} color={TEAL} distance={6} />

      <Environment preset="city" />

      <group ref={group}>
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
          <PulsingBeam />

          {/* Four cards in the corners, smaller, tilted away — frame the text */}
          <GlassPanel
            position={[-3.4, 1.8, -1.2]}
            rotation={[0.15, 0.5, 0.18]}
            color={'#ccfbf1'}
            emissive={TEAL}
            width={1.6}
            height={1.0}
          />
          <GlassPanel
            position={[3.4, 1.6, -1.0]}
            rotation={[0.12, -0.5, -0.15]}
            color={'#5EEAD4'}
            emissive={TEAL_BRIGHT}
            width={1.6}
            height={1.0}
          />
          <GlassPanel
            position={[-3.2, -1.8, -0.8]}
            rotation={[-0.12, 0.45, 0.12]}
            color={'#5EEAD4'}
            emissive={TEAL_BRIGHT}
            width={1.6}
            height={1.0}
          />
          <GlassPanel
            position={[3.5, -1.6, -1.0]}
            rotation={[-0.15, -0.48, -0.18]}
            color={'#ccfbf1'}
            emissive={TEAL}
            width={1.6}
            height={1.0}
          />
        </Float>

        <Sparkles
          count={80}
          scale={[7, 6, 4]}
          size={3}
          speed={0.5}
          color={TEAL_BRIGHT}
          opacity={0.9}
        />
        <Particles />
      </group>
    </>
  )
}

type Props = {
  className?: string
  cameraPosition?: [number, number, number]
  rotateY?: boolean
}

export default function ClinicStack({ className = '', cameraPosition, rotateY }: Props) {
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene cameraPosition={cameraPosition} rotateY={rotateY} />
        </Suspense>
      </Canvas>
    </div>
  )
}
