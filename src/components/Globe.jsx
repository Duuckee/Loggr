import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { generateLandPoints } from '../data/landmasses'

const GLOBE_RADIUS = 2
const AUTO_ROTATE_SPEED = 0.0009
const MIN_ZOOM = 3.2
const MAX_ZOOM = 8
const ARC_COLOR = 0xd64ee0

// Finest resolution the landmass dot field is generated at. Only a shuffled
// prefix of these points is drawn at once (see LAND_MIN_REVEAL below), so
// zooming in reveals more of the same field rather than the existing dots
// just spreading apart — keeps the dot spacing feeling consistent.
const LAND_STEP = 0.4
const LAND_MIN_REVEAL = 0.02
const LAND_REVEAL_EXPONENT = 3

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function makeDotTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

function makeGlowTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,0.35)')
  gradient.addColorStop(0.4, 'rgba(180,150,255,0.12)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

function buildLoopCurve(start, end, seed) {
  const mid = start.clone().add(end).multiplyScalar(0.5)
  const distance = start.distanceTo(end)
  const bulge = GLOBE_RADIUS * (1.4 + seed * 1.6) + distance * 0.3
  const axis = new THREE.Vector3().crossVectors(start, end).normalize()
  if (axis.lengthSq() === 0) axis.set(0, 1, 0)
  const tilt = new THREE.Vector3().crossVectors(mid.clone().normalize(), axis).normalize()
  const apex = mid
    .clone()
    .normalize()
    .multiplyScalar(bulge)
    .add(tilt.multiplyScalar((seed - 0.5) * GLOBE_RADIUS * 0.9))
  const quarter1 = start.clone().lerp(apex, 0.5).add(tilt.clone().multiplyScalar(seed * 0.6))
  const quarter2 = end.clone().lerp(apex, 0.5).add(tilt.clone().multiplyScalar(-seed * 0.6))
  return new THREE.CatmullRomCurve3([start, quarter1, apex, quarter2, end])
}

// Land points shuffled once at module load, so revealing a growing PREFIX
// (via BufferGeometry.setDrawRange) gives an evenly-distributed sample at
// any zoom level instead of filling in region by region.
function buildShuffledLandPositions(step) {
  const points = generateLandPoints(step)
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[points[i], points[j]] = [points[j], points[i]]
  }
  const positions = new Float32Array(points.length * 3)
  points.forEach(([lon, lat], i) => {
    const v = latLonToVector3(lat, lon, GLOBE_RADIUS * 1.005)
    positions[i * 3] = v.x
    positions[i * 3 + 1] = v.y
    positions[i * 3 + 2] = v.z
  })
  return positions
}
// Computed once when this module first loads, shared across mounts.
const LAND_POSITIONS = buildShuffledLandPositions(LAND_STEP)

export default function Globe({ homeLat, homeLon, contacts }) {
  const mountRef = useRef(null)
  const stateRef = useRef({})

  useEffect(() => {
    const mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.z = 5.2

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    mount.appendChild(renderer.domElement)

    const globeGroup = new THREE.Group()
    scene.add(globeGroup)

    const glowSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    glowSprite.scale.set(GLOBE_RADIUS * 3.4, GLOBE_RADIUS * 3.4, 1)
    scene.add(glowSprite)

    // Solid dark core so land dots on the far side of the sphere are hidden.
    // No wireframe/grid lines on the globe itself.
    const coreGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.995, 48, 32)
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x05070a })
    globeGroup.add(new THREE.Mesh(coreGeo, coreMat))

    // Dotted landmass texture — draw range grows with zoom (set each frame)
    const dotTexture = makeDotTexture()
    const landGeo = new THREE.BufferGeometry()
    landGeo.setAttribute('position', new THREE.BufferAttribute(LAND_POSITIONS, 3))
    const landCount = LAND_POSITIONS.length / 3
    landGeo.setDrawRange(0, Math.max(1, Math.floor(landCount * LAND_MIN_REVEAL)))
    const landMat = new THREE.PointsMaterial({
      size: 0.024,
      map: dotTexture,
      color: 0xd7dee8,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      sizeAttenuation: true,
    })
    globeGroup.add(new THREE.Points(landGeo, landMat))

    const markersGroup = new THREE.Group()
    const linksGroup = new THREE.Group()
    globeGroup.add(markersGroup, linksGroup)

    const homePos = latLonToVector3(homeLat, homeLon, GLOBE_RADIUS * 1.01)
    const ringGeo = new THREE.RingGeometry(0.045, 0.065, 24)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf5a623, side: THREE.DoubleSide })
    const homeMarker = new THREE.Mesh(ringGeo, ringMat)
    homeMarker.position.copy(homePos)
    homeMarker.lookAt(homePos.clone().multiplyScalar(2))
    globeGroup.add(homeMarker)

    let rotationY = 0.4
    let rotationX = -0.15
    let zoom = 5.2
    let dragging = false
    let lastX = 0
    let lastY = 0

    function onPointerDown(e) {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
    }
    function onPointerMove(e) {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      rotationY += dx * 0.005
      rotationX = Math.max(-1.2, Math.min(1.2, rotationX + dy * 0.005))
      lastX = e.clientX
      lastY = e.clientY
    }
    function onPointerUp() {
      dragging = false
    }
    function onWheel(e) {
      e.preventDefault()
      zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + e.deltaY * 0.01))
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false })

    let frameId
    function renderLoop() {
      if (!dragging) rotationY += AUTO_ROTATE_SPEED
      globeGroup.rotation.y = rotationY
      globeGroup.rotation.x = rotationX
      camera.position.z += (zoom - camera.position.z) * 0.08

      // More of the landmass dot field reveals as the camera gets closer
      const t = Math.min(
        1,
        Math.max(0, (MAX_ZOOM - camera.position.z) / (MAX_ZOOM - MIN_ZOOM))
      )
      const revealFraction =
        LAND_MIN_REVEAL + (1 - LAND_MIN_REVEAL) * Math.pow(t, LAND_REVEAL_EXPONENT)
      landGeo.setDrawRange(0, Math.max(1, Math.floor(landCount * revealFraction)))

      const t2 = performance.now() / 1000
      linksGroup.children.forEach((group) => {
        const { curve, comet, speed, phase } = group.userData
        if (!curve) return
        const progress = (t2 * speed + phase) % 1
        const p = curve.getPointAt(progress)
        comet.position.copy(p)
        comet.material.opacity = 0.9 * Math.sin(progress * Math.PI) + 0.1
      })

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(renderLoop)
    }
    renderLoop()

    function onResize() {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(mount)

    stateRef.current = { scene, markersGroup, linksGroup, renderer }

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeLat, homeLon])

  // Contact markers + park-to-park traces. `contact.park` (set when the
  // caller picked a real POTA park in the Add Contact form) is what its
  // lat/lon came from — the park itself never renders as its own dot,
  // only as the trace endpoint once a contact against it is logged.
  useEffect(() => {
    const { markersGroup, linksGroup } = stateRef.current
    if (!markersGroup) return

    markersGroup.clear()
    linksGroup.clear()

    const homePos = latLonToVector3(homeLat, homeLon, GLOBE_RADIUS)
    const dotGeo = new THREE.SphereGeometry(0.035, 10, 10)
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xf5a623 })
    const cometGeo = new THREE.SphereGeometry(0.03, 8, 8)

    contacts.forEach((contact, i) => {
      const point = latLonToVector3(contact.lat, contact.lon, GLOBE_RADIUS * 1.02)
      const marker = new THREE.Mesh(dotGeo, dotMat)
      marker.position.copy(point)
      markersGroup.add(marker)

      if (contact.isP2p) {
        const seed = ((i * 37) % 100) / 100
        const curve = buildLoopCurve(homePos, point, seed)
        const tubeGeo = new THREE.TubeGeometry(curve, 96, 0.006, 6, false)
        const tubeMat = new THREE.MeshBasicMaterial({
          color: ARC_COLOR,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
        const tube = new THREE.Mesh(tubeGeo, tubeMat)

        const cometMat = new THREE.MeshBasicMaterial({
          color: 0xffe1ff,
          transparent: true,
          opacity: 1,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
        const comet = new THREE.Mesh(cometGeo, cometMat)

        const group = new THREE.Group()
        group.add(tube, comet)
        group.userData = { curve, comet, speed: 0.15 + seed * 0.1, phase: seed }
        linksGroup.add(group)
      }
    })
  }, [contacts, homeLat, homeLon])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: 'grab',
        touchAction: 'none',
        background: 'radial-gradient(circle at 50% 50%, rgba(30,20,45,0.4), transparent 65%)',
      }}
    />
  )
}
