// Generates compact binary globe geometry from public map source data.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { feature, mesh } from 'topojson-client'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = resolve(projectRoot, 'node_modules/world-atlas/countries-50m.json')
const outputDirectory = resolve(projectRoot, 'public/globe')
const globeRadius = 2
const spacings = [1.5, 1, 0.67, 0.45, 0.3, 0.2, 0.14]
const cellSize = 5
const lonCells = 360 / cellSize
const latCells = 180 / cellSize
const lonCell = (lon) => Math.max(0, Math.min(lonCells - 1, Math.floor((lon + 180) / cellSize)))
const latCell = (lat) => Math.max(0, Math.min(latCells - 1, Math.floor((lat + 90) / cellSize)))

const world = JSON.parse(await readFile(sourcePath, 'utf8'))
const landCollection = feature(world, world.objects.land)
const landGeometry = landCollection.features[0].geometry
function unwrapRing(ring) {
  let previousLon = ring[0][0]
  let offset = 0

  return ring.map(([lon, lat], pointIndex) => {
    if (pointIndex > 0) {
      const delta = lon + offset - previousLon
      if (delta > 180) offset -= 360
      else if (delta < -180) offset += 360
    }
    const unwrappedLon = lon + offset
    previousLon = unwrappedLon
    return [unwrappedLon, lat]
  })
}

function prepareRing(ring) {
  const points = unwrapRing(ring)
  const lons = points.map(([lon]) => lon)
  const lats = points.map(([, lat]) => lat)
  const segmentsByLat = Array.from({ length: latCells }, () => [])

  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i]
    const [xj, yj] = points[j]
    if (yi === yj) continue
    const startCell = latCell(Math.min(yi, yj))
    const endCell = latCell(Math.max(yi, yj))
    const segment = [xi, yi, xj, yj]
    for (let cell = startCell; cell <= endCell; cell += 1) segmentsByLat[cell].push(segment)
  }

  return {
    points,
    segmentsByLat,
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  }
}

const polygons = landGeometry.coordinates.map((polygon) => {
  const rings = polygon.map(prepareRing)
  return { rings, ...rings[0] }
})

const index = Array.from({ length: lonCells * latCells }, () => [])

polygons.forEach((polygon) => {
  // Antimeridian polygons are stored with continuous longitudes (for example,
  // Fiji becomes 178..181 rather than drawing across the entire world). Index
  // shifted copies of the bounding box back into the normal -180..180 range.
  for (let shift = -360; shift <= 360; shift += 360) {
    const minLon = Math.max(-180, polygon.minLon + shift)
    const maxLon = Math.min(180, polygon.maxLon + shift)
    if (minLon > maxLon) continue

    for (let y = latCell(polygon.minLat); y <= latCell(polygon.maxLat); y += 1) {
      for (let x = lonCell(minLon); x <= lonCell(maxLon); x += 1) {
        const bucket = index[y * lonCells + x]
        if (!bucket.includes(polygon)) bucket.push(polygon)
      }
    }
  }
})

function pointInRing(lon, lat, ring) {
  const minimumShift = Math.ceil((ring.minLon - lon) / 360)
  const maximumShift = Math.floor((ring.maxLon - lon) / 360)

  for (let shift = minimumShift; shift <= maximumShift; shift += 1) {
    const testLon = lon + shift * 360
    let inside = false
    for (const [xi, yi, xj, yj] of ring.segmentsByLat[latCell(lat)]) {
      if (yi > lat !== yj > lat && testLon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
        inside = !inside
      }
    }
    if (inside) return true
  }
  return false
}

function isLand(lon, lat) {
  for (const polygon of index[latCell(lat) * lonCells + lonCell(lon)]) {
    if (
      lat >= polygon.minLat &&
      lat <= polygon.maxLat &&
      pointInRing(lon, lat, polygon.rings[0]) &&
      !polygon.rings.slice(1).some((ring) => pointInRing(lon, lat, ring))
    ) {
      return true
    }
  }
  return false
}

function latLonToPosition(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ]
}

function generateLandPositions(spacing) {
  const positions = []
  const latStep = spacing * Math.sqrt(3) * 0.5
  let row = 0

  for (let lat = -89 + latStep * 0.5; lat < 89; lat += latStep) {
    const lonStep = spacing / Math.max(0.06, Math.cos((lat * Math.PI) / 180))
    const rowOffset = (row % 2) * lonStep * 0.5
    for (let lon = -180 + rowOffset; lon < 180; lon += lonStep) {
      if (isLand(lon, lat)) positions.push(...latLonToPosition(lat, lon, globeRadius * 1.006))
    }
    row += 1
  }
  return new Float32Array(positions)
}

function generateBorderPositions() {
  const positions = []
  mesh(world, world.objects.countries).coordinates.forEach((line) => {
    for (let i = 1; i < line.length; i += 1) {
      const [previousLon, previousLat] = line[i - 1]
      const [lon, lat] = line[i]
      if (Math.abs(lon - previousLon) > 180) continue
      positions.push(
        ...latLonToPosition(previousLat, previousLon, globeRadius * 1.009),
        ...latLonToPosition(lat, lon, globeRadius * 1.009)
      )
    }
  })
  return new Float32Array(positions)
}

// Regression guard for the old Fiji antimeridian bug, which produced a
// complete dotted latitude band through otherwise empty ocean.
if (isLand(80, -16.5)) throw new Error('Antimeridian regression: Fiji created a false ocean band')

await mkdir(outputDirectory, { recursive: true })
for (const spacing of spacings) {
  const positions = generateLandPositions(spacing)
  const name = `land-${String(spacing).replace('.', '')}.bin`
  await writeFile(resolve(outputDirectory, name), Buffer.from(positions.buffer))
  console.log(`${name}: ${positions.length / 3} points`)
}

const borders = generateBorderPositions()
await writeFile(resolve(outputDirectory, 'borders.bin'), Buffer.from(borders.buffer))
console.log(`borders.bin: ${borders.length / 6} segments`)
