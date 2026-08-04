import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const GLOBE_RADIUS = 2
const AUTO_ROTATE_SPEED = 0.00035
const DRAG_ROTATE_SPEED = 0.0042
const VERTICAL_DRAG_RATIO = 0.72
const AUTO_ROTATE_RESUME_MS = 1800
const MAX_GLOBE_PITCH = THREE.MathUtils.degToRad(75)
const MIN_ZOOM = 2.42
const MAX_ZOOM = 8.5
const DOT_SPACING_PX = 7
const HOME_MARKER_COLOR = 0xffcf33
const HOME_MARKER_SIZE_PX = 8
const CONTACT_MARKER_COLOR = 0xf5a623
const CONTACT_MARKER_SIZE_PX = 5
const P2P_MARKER_COLOR = 0x39d9ff
const P2P_MARKER_SIZE_PX = 7
const P2P_LINK_COLOR = 0x39d9ff
const P2P_LINK_SEGMENTS = 96
const LAND_LOD_ASSETS = [
  { spacing: 1.5, file: 'land-15.bin' },
  { spacing: 1, file: 'land-1.bin' },
  { spacing: 0.67, file: 'land-067.bin' },
  { spacing: 0.45, file: 'land-045.bin' },
  { spacing: 0.3, file: 'land-03.bin' },
  { spacing: 0.2, file: 'land-02.bin' },
  { spacing: 0.14, file: 'land-014.bin' },
]
const LAND_LOD_SPACINGS = LAND_LOD_ASSETS.map(({ spacing }) => spacing)

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function wrapAngle(angle) {
  return THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI
}

function makeDotTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function buildGreatCircleArc(start, end) {
  const startDirection = start.clone().normalize()
  const endDirection = end.clone().normalize()
  const angle = startDirection.angleTo(endDirection)

  if (angle < 0.00001) return [start.clone(), end.clone()]

  const axis = new THREE.Vector3().crossVectors(startDirection, endDirection)
  if (axis.lengthSq() < 0.000001) {
    axis.crossVectors(startDirection, new THREE.Vector3(0, 1, 0))
    if (axis.lengthSq() < 0.000001) axis.crossVectors(startDirection, new THREE.Vector3(1, 0, 0))
  }
  axis.normalize()

  // Keep the route close to the globe. Longer contacts lift a little higher,
  // but never turn into the oversized beam used by the old P2P curve.
  const lift = THREE.MathUtils.clamp(angle * 0.12, 0.045, 0.24)
  return Array.from({ length: P2P_LINK_SEGMENTS + 1 }, (_, index) => {
    const progress = index / P2P_LINK_SEGMENTS
    const radius = GLOBE_RADIUS * 1.018 + Math.sin(Math.PI * progress) * lift
    return startDirection
      .clone()
      .applyAxisAngle(axis, angle * progress)
      .multiplyScalar(radius)
  })
}

function disposeGroupChildren(group) {
  group.children.forEach((child) => {
    child.traverse((object) => {
      object.geometry?.dispose()
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
      else object.material?.dispose()
    })
  })
  group.clear()
}

async function loadFloat32Asset(file) {
  const response = await fetch(`${import.meta.env.BASE_URL}globe/${file}`)
  if (!response.ok) throw new Error(`Unable to load globe geometry: ${file}`)
  return new Float32Array(await response.arrayBuffer())
}

function updateLandLod(layers, camera, viewportHeight, requestLayer) {
  const loadedLayers = layers.filter(({ material }) => material)
  if (loadedLayers.length === 0) return
  const distanceToSurface = Math.max(0.05, camera.position.length() - GLOBE_RADIUS)
  const worldUnitsPerPixel =
    (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distanceToSurface) /
    Math.max(1, viewportHeight)
  const desiredSpacing = THREE.MathUtils.clamp(
    THREE.MathUtils.radToDeg((worldUnitsPerPixel * DOT_SPACING_PX) / GLOBE_RADIUS),
    LAND_LOD_SPACINGS.at(-1),
    LAND_LOD_SPACINGS[0]
  )

  layers.forEach(({ material }) => {
    if (!material) return
    material.opacity = 0
    material.visible = false
  })

  if (desiredSpacing >= LAND_LOD_SPACINGS[0]) {
    requestLayer(0)
    const material = layers[0].material || loadedLayers[0].material
    material.opacity = 0.84
    material.visible = true
    return
  }

  const finestIndex = LAND_LOD_SPACINGS.length - 1
  if (desiredSpacing <= LAND_LOD_SPACINGS[finestIndex]) {
    requestLayer(finestIndex)
    const material = layers[finestIndex].material || loadedLayers.at(-1).material
    material.opacity = 0.84
    material.visible = true
    return
  }

  const coarseIndex = LAND_LOD_SPACINGS.findIndex(
    (spacing, index) => desiredSpacing <= spacing && desiredSpacing >= LAND_LOD_SPACINGS[index + 1]
  )
  const coarseSpacing = LAND_LOD_SPACINGS[coarseIndex]
  const fineSpacing = LAND_LOD_SPACINGS[coarseIndex + 1]
  const blend = THREE.MathUtils.smoothstep(
    Math.log(coarseSpacing / desiredSpacing) / Math.log(coarseSpacing / fineSpacing),
    0,
    1
  )

  requestLayer(coarseIndex)
  requestLayer(coarseIndex + 1)

  const coarseMaterial = layers[coarseIndex].material
  const fineMaterial = layers[coarseIndex + 1].material
  if (coarseMaterial && fineMaterial) {
    coarseMaterial.opacity = (1 - blend) * 0.84
    coarseMaterial.visible = true
    fineMaterial.opacity = blend * 0.84
    fineMaterial.visible = true
  } else {
    const closest = loadedLayers.reduce((best, layer) =>
      Math.abs(layer.index - coarseIndex - blend) < Math.abs(best.index - coarseIndex - blend) ? layer : best
    )
    closest.material.opacity = 0.84
    closest.material.visible = true
  }
}

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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    mount.appendChild(renderer.domElement)

    const globeGroup = new THREE.Group()
    scene.add(globeGroup)

    const coreGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.997, 72, 48)
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x04070e,
    })
    globeGroup.add(new THREE.Mesh(coreGeo, coreMat))

    const atmosphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.012, 72, 48)
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(mat3(modelMatrix) * normal);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          float rim = pow(1.0 - max(dot(vNormal, viewDirection), 0.0), 4.0);
          gl_FragColor = vec4(0.22, 0.34, 0.62, rim * 0.16);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    globeGroup.add(new THREE.Mesh(atmosphereGeo, atmosphereMat))

    const dotTexture = makeDotTexture()
    const landLayers = LAND_LOD_ASSETS.map((asset, index) => ({ ...asset, index, material: null, loading: false }))
    let disposed = false
    async function loadLandLayer(index) {
      const layer = landLayers[index]
      if (!layer || layer.material || layer.loading || disposed) return
      layer.loading = true
      try {
        const positions = await loadFloat32Asset(layer.file)
        if (disposed) return
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        const material = new THREE.PointsMaterial({
          size: 2.25,
          map: dotTexture,
          color: 0xe2e9f3,
          transparent: true,
          opacity: 0,
          alphaTest: 0.04,
          depthWrite: false,
          sizeAttenuation: false,
        })
        material.visible = false
        layer.material = material
        layer.object = new THREE.Points(geometry, material)
        globeGroup.add(layer.object)
      } catch (error) {
        console.error(error)
      } finally {
        layer.loading = false
      }
    }

    async function loadGlobeGeometry() {
      try {
        const [, , borderPositions] = await Promise.all([
          loadLandLayer(0),
          loadLandLayer(1),
          loadFloat32Asset('borders.bin'),
        ])
        if (disposed) return

        const bordersGeo = new THREE.BufferGeometry()
        bordersGeo.setAttribute('position', new THREE.BufferAttribute(borderPositions, 3))
        const bordersMat = new THREE.LineBasicMaterial({
          color: 0x8897ad,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
        })
        globeGroup.add(new THREE.LineSegments(bordersGeo, bordersMat))
      } catch (error) {
        console.error(error)
      }
    }
    loadGlobeGeometry()

    const markersGroup = new THREE.Group()
    const linksGroup = new THREE.Group()
    globeGroup.add(markersGroup, linksGroup)

    const homePos = latLonToVector3(homeLat, homeLon, GLOBE_RADIUS * 1.012)
    const homeGeo = new THREE.BufferGeometry().setFromPoints([homePos])
    const homeMat = new THREE.PointsMaterial({
      size: HOME_MARKER_SIZE_PX,
      map: dotTexture,
      color: HOME_MARKER_COLOR,
      transparent: true,
      opacity: 1,
      alphaTest: 0.04,
      depthWrite: false,
      sizeAttenuation: false,
    })
    const homeMarker = new THREE.Points(homeGeo, homeMat)
    homeMarker.renderOrder = 2
    globeGroup.add(homeMarker)

    // Longitude and latitude are the only rotation state. Rebuilding the
    // orientation from these values prevents quaternion/Euler drift, so the
    // globe can never accumulate roll after repeated drags.
    let globeYaw = 0.4
    let globePitch = -0.15
    globeGroup.rotation.order = 'YXZ'

    function applyGlobeOrientation() {
      globeGroup.rotation.set(globePitch, globeYaw, 0, 'YXZ')
    }

    applyGlobeOrientation()

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.075
    controls.enablePan = false
    // Rotation is applied to the globe group below, rather than orbiting the
    // camera. This keeps the pivot at the sphere's exact centre even after
    // zoomToCursor has moved the camera's focus point.
    controls.enableRotate = false
    controls.minDistance = MIN_ZOOM
    controls.maxDistance = MAX_ZOOM
    controls.zoomSpeed = 0.82
    controls.zoomToCursor = true
    controls.maxTargetRadius = GLOBE_RADIUS * 0.82
    controls.update()

    const activePointers = new Set()
    const worldUp = new THREE.Vector3(0, 1, 0)
    let dragPointerId = null
    let dragStartX = 0
    let dragStartY = 0
    let dragStartYaw = globeYaw
    let dragStartPitch = globePitch
    let lastInteractionAt = performance.now()

    function finishDrag(pointerId) {
      activePointers.delete(pointerId)
      if (dragPointerId === pointerId) {
        dragPointerId = null
        lastInteractionAt = performance.now()
      }
      if (activePointers.size === 0) renderer.domElement.style.cursor = 'grab'
    }

    function onPointerDown(event) {
      activePointers.add(event.pointerId)
      lastInteractionAt = performance.now()
      if (activePointers.size !== 1 || event.button !== 0) {
        dragPointerId = null
        renderer.domElement.style.cursor = 'grab'
        return
      }
      dragPointerId = event.pointerId
      dragStartX = event.clientX
      dragStartY = event.clientY
      dragStartYaw = globeYaw
      dragStartPitch = globePitch
      renderer.domElement.setPointerCapture?.(event.pointerId)
      renderer.domElement.style.cursor = 'grabbing'
    }

    function onPointerMove(event) {
      if (event.pointerId !== dragPointerId || activePointers.size !== 1) return
      const deltaX = event.clientX - dragStartX
      const deltaY = event.clientY - dragStartY

      // Horizontal movement follows the pointer freely. Vertical movement is
      // slightly gentler and has a firm latitude limit, keeping north upright
      // without making ordinary dragging feel locked down.
      globeYaw = wrapAngle(dragStartYaw + deltaX * DRAG_ROTATE_SPEED)
      globePitch = THREE.MathUtils.clamp(
        dragStartPitch + deltaY * DRAG_ROTATE_SPEED * VERTICAL_DRAG_RATIO,
        -MAX_GLOBE_PITCH,
        MAX_GLOBE_PITCH
      )
      applyGlobeOrientation()
      lastInteractionAt = performance.now()
    }

    function onPointerUp(event) {
      finishDrag(event.pointerId)
    }

    function onPointerCancel(event) {
      finishDrag(event.pointerId)
    }

    function onWheel() {
      lastInteractionAt = performance.now()
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointercancel', onPointerCancel)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true })

    let frameId
    let previousFrameAt = performance.now()
    function renderLoop(frameAt = performance.now()) {
      const elapsedFrames = Math.min(3, (frameAt - previousFrameAt) / (1000 / 60))
      previousFrameAt = frameAt
      controls.update()
      updateLandLod(landLayers, camera, mount.clientHeight, loadLandLayer)

      if (dragPointerId === null && frameAt - lastInteractionAt > AUTO_ROTATE_RESUME_MS) {
        const autoRotation = AUTO_ROTATE_SPEED * elapsedFrames
        globeGroup.rotateOnWorldAxis(worldUp, autoRotation)
        globeYaw = wrapAngle(globeYaw + autoRotation)
      }

      const now = frameAt / 1000
      linksGroup.children.forEach((group) => {
        const { curve, pulse, speed, phase } = group.userData
        if (!curve) return
        const progress = (now * speed + phase) % 1
        pulse.position.copy(curve.getPointAt(progress))
        pulse.material.opacity = 0.75 * Math.sin(progress * Math.PI) + 0.15
      })

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(renderLoop)
    }
    renderLoop()

    function onResize() {
      const nextWidth = mount.clientWidth
      const nextHeight = mount.clientHeight
      camera.aspect = nextWidth / nextHeight
      camera.updateProjectionMatrix()
      renderer.setSize(nextWidth, nextHeight)
    }
    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(mount)

    stateRef.current = { markersGroup, linksGroup, dotTexture }

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointercancel', onPointerCancel)
      renderer.domElement.removeEventListener('wheel', onWheel)
      scene.traverse((object) => {
        object.geometry?.dispose()
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
        else object.material?.dispose()
      })
      dotTexture.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [homeLat, homeLon])

  useEffect(() => {
    const { markersGroup, linksGroup, dotTexture } = stateRef.current
    if (!markersGroup || !dotTexture) return

    disposeGroupChildren(markersGroup)
    disposeGroupChildren(linksGroup)

    const homePos = latLonToVector3(homeLat, homeLon, GLOBE_RADIUS * 1.018)
    const contactPositions = []
    const p2pPositions = []

    contacts.forEach((contact, index) => {
      if (!Number.isFinite(Number(contact.lat)) || !Number.isFinite(Number(contact.lon)) || contact.lat === '' || contact.lon === '') return
      const point = latLonToVector3(Number(contact.lat), Number(contact.lon), GLOBE_RADIUS * 1.018)
      if (contact.isP2p) p2pPositions.push(point)
      else contactPositions.push(point)

      if (contact.isP2p) {
        const seed = ((index * 37) % 100) / 100
        const arcPoints = buildGreatCircleArc(homePos, point)
        const curve = new THREE.CatmullRomCurve3(arcPoints)
        const lineGeo = new THREE.BufferGeometry().setFromPoints(arcPoints)
        const lineMat = new THREE.LineBasicMaterial({
          color: P2P_LINK_COLOR,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
        const line = new THREE.Line(lineGeo, lineMat)

        const pulseGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()])
        const pulseMat = new THREE.PointsMaterial({
          size: 4,
          map: dotTexture,
          color: 0xc5f6ff,
          transparent: true,
          opacity: 1,
          alphaTest: 0.04,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: false,
        })
        const pulse = new THREE.Points(pulseGeo, pulseMat)

        const group = new THREE.Group()
        group.add(line, pulse)
        group.userData = { curve, pulse, speed: 0.12 + seed * 0.05, phase: seed }
        linksGroup.add(group)
      }
    })

    function addMarkerLayer(positions, color, size) {
      if (positions.length === 0) return
      const geometry = new THREE.BufferGeometry().setFromPoints(positions)
      const material = new THREE.PointsMaterial({
        size,
        map: dotTexture,
        color,
        transparent: true,
        opacity: 1,
        alphaTest: 0.04,
        depthWrite: false,
        sizeAttenuation: false,
      })
      const markers = new THREE.Points(geometry, material)
      markers.renderOrder = 3
      markersGroup.add(markers)
    }

    addMarkerLayer(contactPositions, CONTACT_MARKER_COLOR, CONTACT_MARKER_SIZE_PX)
    addMarkerLayer(p2pPositions, P2P_MARKER_COLOR, P2P_MARKER_SIZE_PX)
  }, [contacts, homeLat, homeLon])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: 'grab',
        touchAction: 'none',
        background: 'radial-gradient(circle at 50% 48%, rgba(32,108,96,0.16), transparent 66%)',
      }}
    />
  )
}