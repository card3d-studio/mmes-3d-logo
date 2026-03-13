import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = document.getElementById('app')

if (!container) {
  throw new Error('Missing #app container.')
}

const fallbackImage = container.querySelector('.logo-fallback')
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
let reduceMotion = prefersReducedMotion.matches

// ---------- Scene ----------
const scene = new THREE.Scene()

// ---------- Presentation / sizing ----------
// Keep a fixed presentation aspect so the logo does not seem to morph
// as the container changes shape.
const DESIGN_ASPECT = 4 / 3

// Old camera feel
const FRUSTUM_HEIGHT = 6
const FRUSTUM_WIDTH = FRUSTUM_HEIGHT * DESIGN_ASPECT

// Cap the standalone canvas so it does not become ridiculously large.
// These caps do NOT force overflow in small embeds; they only cap growth.
const MAX_CANVAS_WIDTH = 900
const MAX_CANVAS_HEIGHT = 700

function getContainerSize() {
  const width = Math.max(container.clientWidth, 1)
  const height = Math.max(container.clientHeight, 1)
  return { width, height }
}

// ---------- Camera ----------
const camera = new THREE.OrthographicCamera(
  -FRUSTUM_WIDTH / 2,
  FRUSTUM_WIDTH / 2,
  FRUSTUM_HEIGHT / 2,
  -FRUSTUM_HEIGHT / 2,
  0.1,
  100
)

camera.position.set(10, 0, 10)
camera.lookAt(0, 0, 0)

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
})

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
renderer.setClearColor(0x000000, 0)

renderer.domElement.setAttribute('role', 'img')
renderer.domElement.setAttribute(
  'aria-label',
  'Interactive Morehead Montessori 3D logo'
)
renderer.domElement.setAttribute('tabindex', '0')

renderer.domElement.style.position = 'absolute'
renderer.domElement.style.display = 'block'
renderer.domElement.style.background = 'transparent'

container.appendChild(renderer.domElement)
container.dataset.ready = 'true'

// ---------- Controls ----------
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.enablePan = false
controls.enableZoom = false
controls.enableRotate = true
controls.rotateSpeed = 0.8
controls.target.set(0, 0, 0)
controls.saveState()

// ---------- Geometry container ----------
const logoGroup = new THREE.Group()
scene.add(logoGroup)

// ---------- Reduced motion / fallback ----------
function applyMotionPreference() {
  reduceMotion = prefersReducedMotion.matches

  if (reduceMotion) {
    controls.enabled = false
    renderer.domElement.style.opacity = '0'
    renderer.domElement.style.pointerEvents = 'none'

    if (fallbackImage) {
      fallbackImage.style.display = 'block'
      fallbackImage.style.opacity = '1'
      fallbackImage.style.pointerEvents = 'auto'
    }
  } else {
    controls.enabled = true
    renderer.domElement.style.opacity = '1'
    renderer.domElement.style.pointerEvents = 'auto'

    if (fallbackImage) {
      fallbackImage.style.display = 'block'
      fallbackImage.style.opacity = '0'
      fallbackImage.style.pointerEvents = 'none'
    }
  }
}

if (typeof prefersReducedMotion.addEventListener === 'function') {
  prefersReducedMotion.addEventListener('change', applyMotionPreference)
} else if (typeof prefersReducedMotion.addListener === 'function') {
  prefersReducedMotion.addListener(applyMotionPreference)
}

// ---------- Keyboard rotation ----------
const keyboardRotationStep = 0.12

renderer.domElement.addEventListener('keydown', (event) => {
  if (reduceMotion) return

  let handled = true

  switch (event.key) {
    case 'ArrowLeft':
      logoGroup.rotation.y -= keyboardRotationStep
      break

    case 'ArrowRight':
      logoGroup.rotation.y += keyboardRotationStep
      break

    case 'ArrowUp':
      logoGroup.rotation.x -= keyboardRotationStep
      break

    case 'ArrowDown':
      logoGroup.rotation.x += keyboardRotationStep
      break

    case 'Home':
      controls.reset()
      logoGroup.rotation.set(0, 0, 0)
      break

    default:
      handled = false
  }

  if (handled) event.preventDefault()
})

// ---------- Canvas layout inside container ----------
// This keeps the logo presentation stable. The container can be any shape,
// but the canvas itself stays in a fixed aspect ratio and is centered.
function updateRendererLayout() {
  const { width, height } = getContainerSize()
  const containerAspect = width / Math.max(height, 1)

  let drawWidth
  let drawHeight

  if (containerAspect > DESIGN_ASPECT) {
    drawHeight = height
    drawWidth = Math.round(drawHeight * DESIGN_ASPECT)
  } else {
    drawWidth = width
    drawHeight = Math.round(drawWidth / DESIGN_ASPECT)
  }

  const capScale = Math.min(
    1,
    MAX_CANVAS_WIDTH / Math.max(drawWidth, 1),
    MAX_CANVAS_HEIGHT / Math.max(drawHeight, 1)
  )

  drawWidth = Math.max(1, Math.round(drawWidth * capScale))
  drawHeight = Math.max(1, Math.round(drawHeight * capScale))

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(drawWidth, drawHeight, false)

  const canvas = renderer.domElement
  canvas.style.width = `${drawWidth}px`
  canvas.style.height = `${drawHeight}px`
  canvas.style.left = `${Math.round((width - drawWidth) / 2)}px`
  canvas.style.top = `${Math.round((height - drawHeight) / 2)}px`
}

// ---------- Logo colors / geometry ----------
const colors = {
  red: '#ed1e24',
  blue: '#01aeec',
  yellow: '#ffff00',
  orange: '#ffa500',
  green: '#39b54a',
  purple: '#bc5e91',
}

function interpolateColors(color1, color2, alpha) {
  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.slice(1), 16)
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    }
  }

  const rgbToHex = (r, g, b) =>
    `#${[r, g, b]
      .map((x) => {
        const hx = x.toString(16)
        return hx.length === 1 ? `0${hx}` : hx
      })
      .join('')}`

  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  const r = Math.round(rgb1.r * (1 - alpha) + rgb2.r * alpha)
  const g = Math.round(rgb1.g * (1 - alpha) + rgb2.g * alpha)
  const b = Math.round(rgb1.b * (1 - alpha) + rgb2.b * alpha)

  return rgbToHex(r, g, b)
}

function straightPart(frontColors, backColors, colorBeta, x, startY, endY, z1, z2) {
  const numSteps = 100
  const step = (endY - startY) / numSteps
  let lastY = startY

  for (let i = 1; i <= numSteps; i += 1) {
    const thisY = startY + i * step
    const alpha = i / numSteps

    const frontColor = interpolateColors(
      frontColors[0],
      frontColors[1],
      alpha * colorBeta
    )

    const backColor = interpolateColors(
      backColors[0],
      backColors[1],
      alpha * colorBeta
    )

    const vertices = new Float32Array([
      x, lastY, z1,
      x, lastY, z2,
      x, thisY, z1,
      x, thisY, z2,
    ])

    const indices = [0, 1, 2, 2, 1, 3]

    const frontMaterial = new THREE.MeshBasicMaterial({
      color: frontColor,
      side: THREE.FrontSide,
    })

    const backMaterial = new THREE.MeshBasicMaterial({
      color: backColor,
      side: THREE.BackSide,
    })

    lastY = thisY

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    const frontMesh = new THREE.Mesh(geometry, frontMaterial)
    const backMesh = new THREE.Mesh(geometry, backMaterial)

    logoGroup.add(frontMesh)
    logoGroup.add(backMesh)
  }
}

function curvedPart(insideColors, outsideColors, colorBeta, centerX, centerY, radius, z1, z2) {
  const numSteps = 100
  const step = (Math.PI * 0.5) / numSteps

  for (let i = 0; i < numSteps; i += 1) {
    const alpha = i / numSteps
    const angle1 = i * step
    const angle2 = (i + 1) * step

    const frontColor = interpolateColors(
      outsideColors[0],
      outsideColors[1],
      alpha * colorBeta + 1 - colorBeta
    )

    const backColor = interpolateColors(
      insideColors[0],
      insideColors[1],
      alpha * colorBeta + 1 - colorBeta
    )

    const vertices = new Float32Array([
      centerX + radius * Math.cos(angle1), centerY + radius * Math.sin(angle1), z1,
      centerX + radius * Math.cos(angle1), centerY + radius * Math.sin(angle1), z2,
      centerX + radius * Math.cos(angle2), centerY + radius * Math.sin(angle2), z1,
      centerX + radius * Math.cos(angle2), centerY + radius * Math.sin(angle2), z2,

      centerX - radius * Math.cos(angle1), centerY + radius * Math.sin(angle1), z2,
      centerX - radius * Math.cos(angle1), centerY + radius * Math.sin(angle1), z1,
      centerX - radius * Math.cos(angle2), centerY + radius * Math.sin(angle2), z2,
      centerX - radius * Math.cos(angle2), centerY + radius * Math.sin(angle2), z1,
    ])

    const indices = [
      0, 1, 2, 2, 1, 3,
      4, 5, 6, 6, 5, 7,
    ]

    const frontMaterial = new THREE.MeshBasicMaterial({
      color: frontColor,
      side: THREE.FrontSide,
    })

    const backMaterial = new THREE.MeshBasicMaterial({
      color: backColor,
      side: THREE.BackSide,
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    const frontMesh = new THREE.Mesh(geometry, frontMaterial)
    const backMesh = new THREE.Mesh(geometry, backMaterial)

    logoGroup.add(frontMesh)
    logoGroup.add(backMesh)
  }
}

const xGap = 2
const betaStraight = 0.6
const botY = -0.7

straightPart([colors.blue, colors.green], [colors.red, colors.orange], betaStraight, -xGap, botY, 1, 0.3, 0.9)
straightPart([colors.blue, colors.purple], [colors.yellow, colors.orange], betaStraight, -xGap, botY, 1, -0.3, 0.3)
straightPart([colors.red, colors.purple], [colors.yellow, colors.green], betaStraight, -xGap, botY, 1, -0.9, -0.3)

straightPart([colors.red, colors.orange], [colors.red, colors.orange], betaStraight, 0, botY, 1, 0.3, 0.9)
straightPart([colors.yellow, colors.orange], [colors.yellow, colors.orange], betaStraight, 0, botY, 1, -0.3, 0.3)
straightPart([colors.yellow, colors.green], [colors.yellow, colors.green], betaStraight, 0, botY, 1, -0.9, -0.3)

straightPart([colors.red, colors.orange], [colors.blue, colors.green], betaStraight, xGap, botY, 1, 0.3, 0.9)
straightPart([colors.yellow, colors.orange], [colors.blue, colors.purple], betaStraight, xGap, botY, 1, -0.3, 0.3)
straightPart([colors.yellow, colors.green], [colors.red, colors.purple], betaStraight, xGap, botY, 1, -0.9, -0.3)

const betaCurved = 0.4
curvedPart([colors.blue, colors.green], [colors.red, colors.orange], betaCurved, -xGap / 2, 1, xGap / 2, 0.3, 0.9)
curvedPart([colors.blue, colors.purple], [colors.yellow, colors.orange], betaCurved, -xGap / 2, 1, xGap / 2, -0.3, 0.3)
curvedPart([colors.red, colors.purple], [colors.yellow, colors.green], betaCurved, -xGap / 2, 1, xGap / 2, -0.9, -0.3)

curvedPart([colors.blue, colors.green], [colors.red, colors.orange], betaCurved, xGap / 2, 1, xGap / 2, 0.3, 0.9)
curvedPart([colors.blue, colors.purple], [colors.yellow, colors.orange], betaCurved, xGap / 2, 1, xGap / 2, -0.3, 0.3)
curvedPart([colors.red, colors.purple], [colors.yellow, colors.green], betaCurved, xGap / 2, 1, xGap / 2, -0.9, -0.3)

// ---------- Initial layout ----------
applyMotionPreference()
updateRendererLayout()

// ---------- Resize support ----------
window.addEventListener('resize', updateRendererLayout)

const resizeObserver = new ResizeObserver(() => {
  updateRendererLayout()
})
resizeObserver.observe(container)

// ---------- Animate ----------
function renderFrame() {
  controls.update()
  renderer.render(scene, camera)
}

function animate() {
  requestAnimationFrame(animate)

  if (!reduceMotion) {
    renderFrame()
  }
}

renderFrame()
animate()