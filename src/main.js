import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const container = document.getElementById('app');

if (!container) {
  throw new Error('Missing #app container.');
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = prefersReducedMotion.matches;

// ---------- Scene ----------
const scene = new THREE.Scene();

// ---------- Sizing ----------
function getContainerSize() {
  const width = Math.max(container.clientWidth, 1);
  const height = Math.max(container.clientHeight, 1);
  return { width, height };
}

const frustumHeight = 6;

function getFrustumWidth(aspect) {
  return frustumHeight * aspect;
}

const { width: initialWidth, height: initialHeight } = getContainerSize();
const initialAspect = initialWidth / initialHeight;
const initialFrustumWidth = getFrustumWidth(initialAspect);

// ---------- Camera ----------
const camera = new THREE.OrthographicCamera(
  -initialFrustumWidth / 2,
  initialFrustumWidth / 2,
  frustumHeight / 2,
  -frustumHeight / 2,
  0.1,
  100
);

camera.position.set(10, 0, 10);
camera.lookAt(0, 0, 0);

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(initialWidth, initialHeight);
renderer.setClearColor(0x000000, 0);

renderer.domElement.setAttribute('role', 'img');
renderer.domElement.setAttribute('aria-label', 'Interactive Morehead Montessori 3D logo');
renderer.domElement.setAttribute('tabindex', '0');

container.appendChild(renderer.domElement);

// ---------- Controls ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.enableRotate = true;
controls.rotateSpeed = 0.8;
controls.zoomToCursor = false;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;
controls.minAzimuthAngle = -Infinity;
controls.maxAzimuthAngle = Infinity;

controls.saveState();

// Keyboard rotation support
const keyboardRotationStep = 0.12;

renderer.domElement.addEventListener('keydown', (event) => {
  let handled = true;

  switch (event.key) {
    case 'ArrowLeft':
      logoGroup.rotation.y -= keyboardRotationStep;
      break;

    case 'ArrowRight':
      logoGroup.rotation.y += keyboardRotationStep;
      break;

    case 'ArrowUp':
      logoGroup.rotation.x -= keyboardRotationStep;
      break;

    case 'ArrowDown':
      logoGroup.rotation.x += keyboardRotationStep;
      break;

    case 'Home':
      // reset camera orbit
      controls.reset();

      // reset logo orientation
      logoGroup.rotation.set(0, 0, 0);
      break;

    default:
      handled = false;
      break;
  }

  if (handled) {
    event.preventDefault();
  }
});

// ---------- Colors ----------
const colors = {
  red: '#ed1e24',
  blue: '#01aeec',
  yellow: '#ffff00',
  orange: '#ffa500',
  green: '#39b54a',
  purple: '#bc5e91',
};

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const bigint = Number.parseInt(normalized, 16);

  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((value) => {
        const hex = value.toString(16);
        return hex.length === 1 ? `0${hex}` : hex;
      })
      .join('')
  );
}

function interpolateColors(color1, color2, alpha) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const r = Math.round(rgb1.r * (1 - alpha) + rgb2.r * alpha);
  const g = Math.round(rgb1.g * (1 - alpha) + rgb2.g * alpha);
  const b = Math.round(rgb1.b * (1 - alpha) + rgb2.b * alpha);

  return rgbToHex(r, g, b);
}

// ---------- Geometry groups ----------
const logoGroup = new THREE.Group();
scene.add(logoGroup);

function createMaterial(color, side) {
  return new THREE.MeshBasicMaterial({
    color,
    side,
    toneMapped: false,
  });
}

function createMesh(vertices, indices, frontColor, backColor) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const frontMesh = new THREE.Mesh(
    geometry,
    createMaterial(frontColor, THREE.FrontSide)
  );

  const backMesh = new THREE.Mesh(
    geometry,
    createMaterial(backColor, THREE.BackSide)
  );

  logoGroup.add(frontMesh);
  logoGroup.add(backMesh);
}

function straightPart(frontColors, backColors, colorBeta, x, startY, endY, z1, z2) {
  const numSteps = 100;
  const step = (endY - startY) / numSteps;
  let lastY = startY;

  for (let i = 1; i <= numSteps; i += 1) {
    const thisY = startY + i * step;
    const alpha = i / numSteps;

    const frontColor = interpolateColors(
      frontColors[0],
      frontColors[1],
      alpha * colorBeta
    );

    const backColor = interpolateColors(
      backColors[0],
      backColors[1],
      alpha * colorBeta
    );

    const vertices = new Float32Array([
      x, lastY, z1,
      x, lastY, z2,
      x, thisY, z1,
      x, thisY, z2,
    ]);

    const indices = [0, 1, 2, 2, 1, 3];

    createMesh(vertices, indices, frontColor, backColor);
    lastY = thisY;
  }
}

function curvedPart(insideColors, outsideColors, colorBeta, centerX, centerY, radius, z1, z2) {
  const numSteps = 100;
  const step = (Math.PI * 0.5) / numSteps;

  for (let i = 0; i < numSteps; i += 1) {
    const alpha = i / numSteps;
    const angle1 = i * step;
    const angle2 = (i + 1) * step;

    const frontColor = interpolateColors(
      outsideColors[0],
      outsideColors[1],
      alpha * colorBeta + (1 - colorBeta)
    );

    const backColor = interpolateColors(
      insideColors[0],
      insideColors[1],
      alpha * colorBeta + (1 - colorBeta)
    );

    const vertices = new Float32Array([
      centerX + radius * Math.cos(angle1), centerY + radius * Math.sin(angle1), z1,
      centerX + radius * Math.cos(angle1), centerY + radius * Math.sin(angle1), z2,
      centerX + radius * Math.cos(angle2), centerY + radius * Math.sin(angle2), z1,
      centerX + radius * Math.cos(angle2), centerY + radius * Math.sin(angle2), z2,

      centerX - radius * Math.cos(angle1), centerY + radius * Math.sin(angle1), z2,
      centerX - radius * Math.cos(angle1), centerY + radius * Math.sin(angle1), z1,
      centerX - radius * Math.cos(angle2), centerY + radius * Math.sin(angle2), z2,
      centerX - radius * Math.cos(angle2), centerY + radius * Math.sin(angle2), z1,
    ]);

    const indices = [
      0, 1, 2, 2, 1, 3,
      4, 5, 6, 6, 5, 7,
    ];

    createMesh(vertices, indices, frontColor, backColor);
  }
}

// ---------- Build logo ----------
const xGap = 2;
const betaStraight = 0.6;
const betaCurved = 0.4;
const botY = -0.7;

straightPart([colors.blue, colors.green], [colors.red, colors.orange], betaStraight, -xGap, botY, 1, 0.3, 0.9);
straightPart([colors.blue, colors.purple], [colors.yellow, colors.orange], betaStraight, -xGap, botY, 1, -0.3, 0.3);
straightPart([colors.red, colors.purple], [colors.yellow, colors.green], betaStraight, -xGap, botY, 1, -0.9, -0.3);

straightPart([colors.red, colors.orange], [colors.red, colors.orange], betaStraight, 0, botY, 1, 0.3, 0.9);
straightPart([colors.yellow, colors.orange], [colors.yellow, colors.orange], betaStraight, 0, botY, 1, -0.3, 0.3);
straightPart([colors.yellow, colors.green], [colors.yellow, colors.green], betaStraight, 0, botY, 1, -0.9, -0.3);

straightPart([colors.red, colors.orange], [colors.blue, colors.green], betaStraight, xGap, botY, 1, 0.3, 0.9);
straightPart([colors.yellow, colors.orange], [colors.blue, colors.purple], betaStraight, xGap, botY, 1, -0.3, 0.3);
straightPart([colors.yellow, colors.green], [colors.red, colors.purple], betaStraight, xGap, botY, 1, -0.9, -0.3);

curvedPart([colors.blue, colors.green], [colors.red, colors.orange], betaCurved, -xGap / 2, 1, xGap / 2, 0.3, 0.9);
curvedPart([colors.blue, colors.purple], [colors.yellow, colors.orange], betaCurved, -xGap / 2, 1, xGap / 2, -0.3, 0.3);
curvedPart([colors.red, colors.purple], [colors.yellow, colors.green], betaCurved, -xGap / 2, 1, xGap / 2, -0.9, -0.3);

curvedPart([colors.blue, colors.green], [colors.red, colors.orange], betaCurved, xGap / 2, 1, xGap / 2, 0.3, 0.9);
curvedPart([colors.blue, colors.purple], [colors.yellow, colors.orange], betaCurved, xGap / 2, 1, xGap / 2, -0.3, 0.3);
curvedPart([colors.red, colors.purple], [colors.yellow, colors.green], betaCurved, xGap / 2, 1, xGap / 2, -0.9, -0.3);

// ---------- Fit / resize ----------
function updateCameraForContainer() {
  const { width, height } = getContainerSize();
  const aspect = width / height;
  const frustumWidth = getFrustumWidth(aspect);

  camera.left = -frustumWidth / 2;
  camera.right = frustumWidth / 2;
  camera.top = frustumHeight / 2;
  camera.bottom = -frustumHeight / 2;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
}

window.addEventListener('resize', updateCameraForContainer);

if (typeof prefersReducedMotion.addEventListener === 'function') {
  prefersReducedMotion.addEventListener('change', (event) => {
    reduceMotion = event.matches;
  });
} else if (typeof prefersReducedMotion.addListener === 'function') {
  prefersReducedMotion.addListener((event) => {
    reduceMotion = event.matches;
  });
}

// ---------- Initial state ----------
logoGroup.rotation.set(0, 0, 0);

updateCameraForContainer();
container.setAttribute('data-ready', 'true');

// ---------- Animation ----------
function animate() {
  window.requestAnimationFrame(animate);

  if (!reduceMotion) {
    controls.update();
  }

  renderer.render(scene, camera);
}

animate();