import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

function toLatLon(x, y, z) {
  const radius = Math.hypot(x, y, z)
  const lat = Math.asin(y / radius) * 180 / Math.PI
  const theta = Math.atan2(z, -x) * 180 / Math.PI
  let lon = theta - 180
  while (lon < -180) lon += 360
  while (lon >= 180) lon -= 360
  return { lat, lon }
}

test('globe geometry keeps Fiji local instead of creating an antimeridian band', async () => {
  const bytes = await readFile(new URL('../public/globe/land-03.bin', import.meta.url))
  const positions = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / Float32Array.BYTES_PER_ELEMENT)
  let falseOceanPoints = 0
  let fijiPoints = 0

  for (let index = 0; index < positions.length; index += 3) {
    const { lat, lon } = toLatLon(positions[index], positions[index + 1], positions[index + 2])
    if (lat > -17 && lat < -16 && lon > 79 && lon < 81) falseOceanPoints += 1
    if (lat > -18.5 && lat < -16 && (lon > 175 || lon < -175)) fijiPoints += 1
  }

  assert.equal(falseOceanPoints, 0)
  assert.ok(fijiPoints > 0)
})

test('globe rotation uses the sphere centre instead of the zoom-shifted camera target', async () => {
  const source = await readFile(new URL('../src/components/Globe.jsx', import.meta.url), 'utf8')

  assert.match(source, /controls\.enableRotate = false/)
  assert.match(source, /globeGroup\.rotateOnWorldAxis\(worldUp,/)
  assert.doesNotMatch(source, /controls\.autoRotate = true/)
})
