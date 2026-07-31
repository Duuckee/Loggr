import LAND_POLYGONS from './ne-110m-land.json'

// Real coastlines, from the Natural Earth 1:110m "land" dataset (public
// domain). Stored as a flat list of polygons — each polygon is an array of
// rings, each ring an array of [lon, lat] pairs, rounded to 2dp (~1km). The
// first ring of a polygon is its outline, any others are holes.

const MASK_WIDTH = 2048
const MASK_HEIGHT = 1024

// Equirectangular land mask, rasterised once and shared by every Globe mount.
// Testing a bit in a raster is far cheaper than running point-in-polygon over
// thousands of coastline vertices for every candidate dot.
let maskData = null

function buildLandMask() {
  const canvas = document.createElement('canvas')
  canvas.width = MASK_WIDTH
  canvas.height = MASK_HEIGHT
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#fff'

  for (const rings of LAND_POLYGONS) {
    ctx.beginPath()
    for (const ring of rings) {
      ring.forEach(([lon, lat], i) => {
        const x = ((lon + 180) / 360) * MASK_WIDTH
        const y = ((90 - lat) / 180) * MASK_HEIGHT
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
    }
    // "evenodd" so a polygon's inner rings (inland seas) stay water
    ctx.fill('evenodd')
  }

  const { data } = ctx.getImageData(0, 0, MASK_WIDTH, MASK_HEIGHT)
  const mask = new Uint8Array(MASK_WIDTH * MASK_HEIGHT)
  for (let i = 0; i < mask.length; i++) {
    mask[i] = data[i * 4 + 3] > 127 ? 1 : 0
  }
  return mask
}

function getMask() {
  if (!maskData) maskData = buildLandMask()
  return maskData
}

export function isLand(lon, lat) {
  const mask = getMask()
  const x = Math.min(MASK_WIDTH - 1, Math.max(0, Math.floor(((lon + 180) / 360) * MASK_WIDTH)))
  const y = Math.min(MASK_HEIGHT - 1, Math.max(0, Math.floor(((90 - lat) / 180) * MASK_HEIGHT)))
  return mask[y * MASK_WIDTH + x] === 1
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

// Evenly spaced points over the whole sphere (Fibonacci lattice), keeping the
// ones that fall on land. Even spacing is what makes the dot field read as
// coastlines — a grid in lat/lon bunches up towards the poles, and a random
// subsample clumps and leaves holes.
export function generateLandDots(count = 60000) {
  const points = []
  for (let i = 0; i < count; i++) {
    const z = 1 - (2 * i + 1) / count
    const lat = (Math.asin(z) * 180) / Math.PI
    const theta = (i * GOLDEN_ANGLE) % (Math.PI * 2)
    const lon = (theta * 180) / Math.PI - 180
    if (isLand(lon, lat)) points.push([lon, lat])
  }
  return points
}
