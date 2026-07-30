// Rough continent outlines (lon, lat) used to build the dotted-earth texture
// on the globe. These are stylized approximations, not survey-accurate
// coastlines — good enough to read as recognizable landmasses when rendered
// as a dot field, in the style of the reference globe.
export const LANDMASSES = [
  // North America
  [[-165,68],[-165,60],[-155,58],[-135,55],[-125,49],[-124,40],[-117,32],
   [-105,20],[-97,18],[-90,16],[-84,9],[-79,8],[-81,25],[-80,31],[-75,35],
   [-70,41],[-67,45],[-60,47],[-64,50],[-75,58],[-85,65],[-100,70],
   [-120,71],[-140,70],[-155,70],[-165,68]],
  // Greenland
  [[-55,60],[-45,60],[-35,65],[-25,70],[-30,75],[-45,78],[-55,75],
   [-60,68],[-58,63],[-55,60]],
  // South America
  [[-79,9],[-77,1],[-80,-5],[-81,-15],[-75,-20],[-70,-30],[-71,-40],
   [-68,-52],[-65,-55],[-62,-50],[-58,-38],[-48,-25],[-40,-15],[-35,-8],
   [-45,0],[-52,4],[-60,8],[-70,10],[-79,9]],
  // Africa
  [[-17,15],[-16,7],[-10,5],[3,5],[9,4],[13,-5],[12,-15],[13,-22],
   [17,-28],[20,-34],[25,-34],[30,-29],[33,-22],[35,-15],[40,-5],[42,2],
   [47,10],[43,12],[38,15],[35,20],[33,27],[25,31],[15,32],[5,35],
   [-6,35],[-10,30],[-17,20],[-17,15]],
  // Madagascar
  [[43,-12],[46,-14],[50,-16],[50,-22],[47,-25],[44,-22],[43,-17],[43,-12]],
  // Europe
  [[-9,36],[-9,43],[-5,48],[0,51],[8,54],[15,55],[24,60],[30,60],
   [28,50],[24,44],[18,40],[12,38],[3,40],[-4,37],[-9,36]],
  // Russia / North Asia
  [[30,50],[35,55],[45,60],[55,65],[65,68],[80,72],[95,75],[110,75],
   [125,73],[140,70],[160,65],[175,65],[178,60],[165,58],[150,55],
   [135,45],[120,42],[105,45],[90,45],[75,45],[60,45],[45,45],[35,48],[30,50]],
  // China / Mongolia
  [[75,42],[80,45],[90,48],[105,50],[120,48],[130,42],[125,35],[118,32],
   [110,25],[100,25],[92,28],[85,32],[78,35],[75,42]],
  // Middle East
  [[35,37],[45,38],[50,30],[55,25],[60,25],[58,15],[50,15],[45,12],
   [40,15],[36,30],[35,37]],
  // India
  [[68,24],[70,30],[75,33],[80,30],[85,26],[88,22],[92,25],[95,26],
   [92,15],[85,10],[80,8],[76,8],[72,15],[68,24]],
  // Southeast Asia mainland
  [[92,25],[98,25],[104,23],[107,20],[108,10],[105,8],[100,6],[98,8],
   [95,15],[92,20],[92,25]],
  // Japan
  [[130,31],[132,34],[136,35],[140,36],[141,40],[143,43],[145,44],
   [140,45],[135,40],[132,36],[130,31]],
  // Indonesia / Philippines
  [[95,5],[100,0],[105,-3],[110,-7],[118,-8],[120,-4],[125,0],[125,5],
   [122,10],[118,10],[110,5],[105,3],[100,5],[95,5]],
  // Australia
  [[113,-22],[115,-33],[122,-34],[130,-32],[136,-35],[142,-38],[148,-38],
   [150,-33],[153,-27],[150,-20],[145,-15],[142,-11],[135,-12],[128,-14],
   [122,-18],[113,-22]],
  // New Zealand
  [[166,-45],[168,-40],[174,-37],[178,-38],[176,-42],[172,-46],[166,-45]],
]

function pointInPolygon(lon, lat, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    const intersects =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

export function isLand(lon, lat) {
  for (const polygon of LANDMASSES) {
    if (pointInPolygon(lon, lat, polygon)) return true
  }
  return false
}

// Generates lat/lon points that fall on land, on a fine grid — this is what
// gets rendered as the dotted-earth texture.
export function generateLandPoints(step = 1.6) {
  const points = []
  for (let lat = -80; lat <= 82; lat += step) {
    // Slightly denser near the equator, sparser near poles, like the reference
    const lonStep = step / Math.max(0.15, Math.cos((lat * Math.PI) / 180))
    for (let lon = -180; lon <= 180; lon += lonStep) {
      if (isLand(lon, lat)) points.push([lon, lat])
    }
  }
  return points
}
