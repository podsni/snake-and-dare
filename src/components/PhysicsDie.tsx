import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { CanvasTexture, Quaternion, SRGBColorSpace } from 'three'
import type { Mesh } from 'three'
import { faceUp } from '../game/diceThrow.ts'
import { audio } from '../utils/audio.ts'
import { buzz } from '../utils/feel.ts'

const FACE_COLORS = ['#E5DBFF', '#FFD6E8', '#D0EBFF', '#FFF3BF', '#D3F9D8', '#FFE0C2']
const FACE_VALUES = [2, 5, 3, 4, 1, 6]

function paintFace(value: number, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const pen = canvas.getContext('2d')
  if (!pen) return null
  pen.fillStyle = color
  pen.fillRect(0, 0, 256, 256)
  pen.fillStyle = '#2B2144'
  pen.font = '800 148px Nunito, sans-serif'
  pen.textAlign = 'center'
  pen.textBaseline = 'middle'
  pen.fillText(String(value), 128, 140)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function DieBody({ charge, onResult }: { charge: number; onResult: (value: number) => void }) {
  const body = useRef<RapierRigidBody>(null)
  const mesh = useRef<Mesh>(null)
  const worldQuat = useMemo(() => new Quaternion(), [])
  const tossed = useRef(false)
  const done = useRef(false)
  const elapsed = useRef(0)
  const prevVy = useRef(0)
  const textures = useMemo(
    () => FACE_VALUES.map((value, index) => paintFace(value, FACE_COLORS[index] ?? '#ffffff')).filter((item) => item !== null),
    [],
  )

  useFrame((_, delta) => {
    const api = body.current
    if (!api || done.current) return
    if (!tossed.current) {
      tossed.current = true
      api.setLinvel(
        { x: (Math.random() - 0.5) * 0.7, y: 1.5 + charge * 0.8, z: (Math.random() - 0.5) * 0.7 },
        true,
      )
      api.setAngvel(
        {
          x: (Math.random() - 0.5) * (9 + charge * 6),
          y: (Math.random() - 0.5) * (9 + charge * 6),
          z: (Math.random() - 0.5) * (9 + charge * 6),
        },
        true,
      )
    }
    elapsed.current += delta
    const velocity = api.linvel()
    const spin = api.angvel()
    const speed = Math.hypot(velocity.x, velocity.y, velocity.z)
    const turn = Math.hypot(spin.x, spin.y, spin.z)
    if (velocity.y > -0.2 && prevVy.current < -1.5) {
      audio.play('dice')
      buzz(18)
    }
    prevVy.current = velocity.y
    const settled = elapsed.current > 0.6 && speed < 0.06 && turn < 0.08 && api.translation().y < 0.95
    const timedOut = elapsed.current > 4.4
    if (settled || timedOut) {
      done.current = true
      mesh.current?.getWorldQuaternion(worldQuat)
      onResult(faceUp(worldQuat))
    }
  })

  return (
    <RigidBody
      ref={body}
      colliders="cuboid"
      position={[0, 1.55, 0]}
      rotation={[(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2]}
      ccd
      angularDamping={0.35}
      linearDamping={0.12}
      friction={0.7}
      restitution={0.38}
    >
      <mesh ref={mesh} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        {textures.map((texture, index) => (
          <meshPhysicalMaterial key={index} attach={`material-${index}`} map={texture} roughness={0.28} clearcoat={0.55} clearcoatRoughness={0.25} />
        ))}
      </mesh>
    </RigidBody>
  )
}

function Table() {
  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.15, 0]}>
        <mesh>
          <boxGeometry args={[7, 0.3, 7]} />
          <meshStandardMaterial color="#7950F2" />
        </mesh>
      </RigidBody>
      {[
        [0, 0.8, -2.4],
        [0, 0.8, 2.4],
        [-2.4, 0.8, 0],
        [2.4, 0.8, 0],
      ].map((position, index) => (
        <RigidBody key={index} type="fixed" colliders="cuboid" position={position as [number, number, number]}>
          <mesh>
            <boxGeometry args={index < 2 ? [5, 1.4, 0.2] : [0.2, 1.4, 5]} />
            <meshStandardMaterial color="#5B3CC4" transparent opacity={0.35} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  )
}

export default function PhysicsDie({
  charge,
  onResult,
}: {
  charge: number
  throwId: number
  onResult: (value: number) => void
}) {
  const reported = useRef(false)
  const finish = (value: number) => {
    if (reported.current) return
    reported.current = true
    onResult(value)
  }
  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, 1.35]}
      camera={{ position: [0.2, 4.4, 5.6], fov: 32 }}
      onCreated={({ camera }) => camera.lookAt(0, 1.2, 0)}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      frameloop="always"
    >
      <color attach="background" args={['#F8F5FF']} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 7, 3]} intensity={1.45} />
      <Physics gravity={[0, -22, 0]} timeStep={1 / 60}>
        <DieBody charge={charge} onResult={finish} />
        <Table />
      </Physics>
    </Canvas>
  )
}
