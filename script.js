// ===================================================
// BASIC SETUP
// ===================================================
console.log("3D Asteroid Tracker running...");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 100, 400);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = true;
controls.enableZoom = true;
controls.enableRotate = true;

// Keep a list of asteroids
const asteroids = [];

// ===================================================
// TEXTURES
// ===================================================
const textureLoader = new THREE.TextureLoader();
const earthDayMap   = textureLoader.load("textures/earth_daymap.jpg");
const earthBump     = textureLoader.load("textures/earth_bump.jpg");
const earthSpecular = textureLoader.load("textures/earth_specular.jpg");
const earthNight    = textureLoader.load("textures/earth_night.jpg");
const cloudTexture  = textureLoader.load("textures/earth_clouds.png");
const moonTexture   = textureLoader.load("textures/moon.jpg");
const sunTexture    = textureLoader.load("textures/sun.jpg");
const spaceTexture  = textureLoader.load("textures/milkyway.jpg");
const asteroidTexture = textureLoader.load("textures/asteroid.jpg");

scene.background = spaceTexture;

// ===================================================
// HELPER: Irregular asteroid geometry
// ===================================================
function createIrregularAsteroidGeometry(radius, detail = 32, noiseStrength = 0.6) {
  const geometry = new THREE.SphereGeometry(radius, detail, detail);
  const position = geometry.attributes.position;
  const tmp = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    tmp.fromBufferAttribute(position, i);
    const noise = (Math.random() - 0.5) * noiseStrength;
    tmp.addScaledVector(tmp.clone().normalize(), noise);
    position.setXYZ(i, tmp.x, tmp.y, tmp.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// ===================================================
// OBJECTS
// ===================================================
// Sun with animated shader
const sunUniforms = { time: { value: 0 }, sunTexture: { value: sunTexture } };
const sunMaterial = new THREE.ShaderMaterial({
  uniforms: sunUniforms,
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform float time; uniform sampler2D sunTexture; varying vec2 vUv;
    void main(){ vec2 uv=vUv;
      uv.x+=0.02*sin(uv.y*20.0+time*2.0);
      uv.y+=0.02*cos(uv.x*20.0+time*2.0);
      vec4 tex=texture2D(sunTexture,uv);
      gl_FragColor=vec4(tex.rgb*1.5,1.0);
    }`,
  side: THREE.DoubleSide
});
const sun = new THREE.Mesh(new THREE.SphereGeometry(30, 64, 64), sunMaterial);
sun.userData.name = "Sun";
sun.position.set(0, 0, 0);
scene.add(sun);

// Earth
const earthMaterial = new THREE.MeshPhongMaterial({
  map: earthDayMap,
  bumpMap: earthBump,
  bumpScale: 0.05,
  specularMap: earthSpecular,
  specular: new THREE.Color(0x222222),
  shininess: 10
});
const earth = new THREE.Mesh(new THREE.SphereGeometry(15, 128, 128), earthMaterial);
earth.rotation.z = THREE.MathUtils.degToRad(23.5);
earth.userData.name = "Earth";
scene.add(earth);

// Earth overlays
const earthNightMesh = new THREE.Mesh(
  new THREE.SphereGeometry(15.01, 128, 128),
  new THREE.MeshBasicMaterial({
    map: earthNight,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  })
);
scene.add(earthNightMesh);

const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(15.2, 128, 128),
  new THREE.MeshPhongMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
  })
);
scene.add(clouds);

// Moon
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(4, 64, 64),
  new THREE.MeshPhongMaterial({ map: moonTexture })
);
moon.userData.name = "Moon";
scene.add(moon);

// ===================================================
// ASTEROIDS
// ===================================================
function createAsteroid(name, radius, color, realisticScale) {
  const mat = new THREE.MeshStandardMaterial({
    map: asteroidTexture,
    color,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.6,
    metalness: 0.2,
    roughness: 0.95
  });
  const geometry = createIrregularAsteroidGeometry(radius, 32, 0.6);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.userData = {
    name,
    baseEmissive: color,
    realisticScale,
    exaggeratedScale: realisticScale * 10,
    currentScale: realisticScale,
    danger: false,
    velocity: null,         // km/s
    missDistance: null,     // km
    sizeMeters: null,       // meters
    dangerLevel: "Unknown", // Low | Medium | High
    spin: {
      x: (Math.random() - 0.5) * 0.01,
      y: (Math.random() - 0.5) * 0.01,
      z: (Math.random() - 0.5) * 0.01
    }
  };
  return mesh;
}

// Demo asteroids (motion variety)
const asteroidTC = createAsteroid("2025 TC", 1.0, 0x888888, 1.0);
asteroids.push(asteroidTC);
scene.add(asteroidTC);

const asteroidSZ27 = createAsteroid("2025 SZ27", 2.5, 0x666666, 2.5);
asteroids.push(asteroidSZ27);
scene.add(asteroidSZ27);

// ===================================================
// HUD + POPUP
// ===================================================
const hud = document.createElement("div");
hud.style.position = "fixed";
hud.style.top = "10px";
hud.style.left = "10px";
hud.style.padding = "6px 10px";
hud.style.background = "rgba(0,0,0,0.6)";
hud.style.color = "#0f0";
hud.style.fontFamily = "monospace";
hud.style.fontSize = "14px";
hud.style.borderRadius = "4px";
hud.style.zIndex = "1000";
hud.innerHTML = `
  <div id="hud-size">Asteroid Size: Exaggerated (press T to toggle)</div>
  <div id="hud-focus">Focused: Earth</div>
`;
document.body.appendChild(hud);

const hudSize = document.getElementById("hud-size");
const hudFocus = document.getElementById("hud-focus");

const infoBox = document.createElement("div");
infoBox.style.position = "fixed";
infoBox.style.top = "50px";
infoBox.style.right = "10px";
infoBox.style.width = "300px";
infoBox.style.padding = "12px 12px 10px 12px";
infoBox.style.background = "rgba(0,0,0,0.85)";
infoBox.style.color = "#fff";
infoBox.style.fontFamily = "monospace";
infoBox.style.fontSize = "13px";
infoBox.style.border = "1px solid #0f0";
infoBox.style.borderRadius = "6px";
infoBox.style.display = "none";
infoBox.style.zIndex = "1001";
document.body.appendChild(infoBox);

const closeBtn = document.createElement("button");
closeBtn.textContent = "✖";
closeBtn.style.position = "absolute";
closeBtn.style.top = "4px";
closeBtn.style.right = "6px";
closeBtn.style.background = "transparent";
closeBtn.style.color = "#fff";
closeBtn.style.border = "none";
closeBtn.style.cursor = "pointer";
closeBtn.style.fontSize = "14px";
infoBox.appendChild(closeBtn);

closeBtn.addEventListener("click", () => {
  infoBox.style.display = "none";
});

function showAsteroidInfo(ast) {
  const name = ast.userData.name || "Asteroid";
  const vel = ast.userData.velocity != null ? Number(ast.userData.velocity).toFixed(2) : "No data";
  const size = ast.userData.sizeMeters != null ? Number(ast.userData.sizeMeters).toFixed(1) : "No data";
  const miss = ast.userData.missDistance != null ? Number(ast.userData.missDistance).toFixed(0) : "No data";
  const danger = ast.userData.dangerLevel || "Unknown";
  const dangerColor = danger === "High" ? "red" : danger === "Medium" ? "orange" : "lime";

  infoBox.innerHTML = `
    <div style="padding-right:20px">
      <div style="margin-bottom:6px"><b>${name}</b></div>
      <div>Velocity: ${vel} km/s</div>
      <div>Size: ${size} m</div>
      <div>Miss Distance: ${miss} km</div>
      <div>Impact Danger: <span style="color:${dangerColor}">${danger}</span></div>
    </div>
  `;
  infoBox.appendChild(closeBtn);
  infoBox.style.display = "block";
}

// ===================================================
// ASTEROID SIZE TOGGLE
// ===================================================
let showExaggerated = true;
function applyScale(ast) {
  const s = showExaggerated ? ast.userData.exaggeratedScale : ast.userData.realisticScale;
  ast.scale.setScalar(s);
  ast.userData.currentScale = s;
}
function setAsteroidSizes() {
  asteroids.forEach(applyScale);
  hudSize.textContent = `Asteroid Size: ${showExaggerated ? "Exaggerated" : "Realistic"} (press T to toggle)`;
}
setAsteroidSizes();

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "t") {
    showExaggerated = !showExaggerated;
    setAsteroidSizes();
  }
});

// ===================================================
// LIGHTING
// ===================================================
const sunLight = new THREE.PointLight(0xffffff, 2, 8000);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.1));

// ===================================================
// HOVER + CLICK + TOOLTIP
// ===================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoverTarget = null;

const tooltip = document.createElement("div");
tooltip.style.position = "fixed";
tooltip.style.padding = "6px 10px";
tooltip.style.background = "rgba(20,20,20,0.85)";
tooltip.style.color = "#fff";
tooltip.style.fontFamily = "system-ui, sans-serif";
tooltip.style.fontSize = "12px";
tooltip.style.borderRadius = "6px";
tooltip.style.pointerEvents = "none";
tooltip.style.whiteSpace = "nowrap";
tooltip.style.transform = "translate(10px, 10px)";
tooltip.style.display = "none";
tooltip.style.zIndex = "1002";
document.body.appendChild(tooltip);

function clickableBodies() {
  return [...asteroids, earth, moon, sun];
}

function onMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableBodies(), false);

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    if (hoverTarget !== obj) {
      if (hoverTarget) {
        const m = hoverTarget.material;
        if (m && m.emissiveIntensity !== undefined) {
          m.emissiveIntensity = hoverTarget.userData.danger ? 2.0 : 0.6;
        }
        if (hoverTarget.userData && hoverTarget.userData.currentScale) {
          hoverTarget.scale.setScalar(hoverTarget.userData.currentScale);
        }
      }
      hoverTarget = obj;
      document.body.style.cursor = "pointer";
    }

    // Tooltip content
    const dist = obj.position.distanceTo(earth.position);
    const name = obj.userData?.name ?? "Body";
    const vel = obj.userData?.velocity;
    const velText = vel != null ? ` • Velocity: ${Number(vel).toFixed(2)} km/s` : "";

    tooltip.textContent = `${name} • Distance to Earth: ${dist.toFixed(1)} units${velText}`;
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
    tooltip.style.display = "block";

    // Visual feedback
    if (obj.material && obj.material.emissiveIntensity !== undefined) {
      obj.material.emissiveIntensity = 3.0;
    }
    if (obj.userData && obj.userData.currentScale) {
      obj.scale.setScalar(obj.userData.currentScale * 1.2);
    }
  } else {
    if (hoverTarget) {
      const m = hoverTarget.material;
      if (m && m.emissiveIntensity !== undefined) {
        m.emissiveIntensity = hoverTarget.userData.danger ? 2.0 : 0.6;
      }
      if (hoverTarget.userData && hoverTarget.userData.currentScale) {
        hoverTarget.scale.setScalar(hoverTarget.userData.currentScale);
      }
    }
    hoverTarget = null;
    document.body.style.cursor = "default";
    tooltip.style.display = "none";
  }
}
renderer.domElement.addEventListener("mousemove", onMouseMove);

// Smooth click-to-focus camera
function focusOnObject(obj) {
  const target = obj.position.clone();
  const duration = 800;
  const start = controls.target.clone();
  const startTime = performance.now();

  function animateFocus() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    controls.target.lerpVectors(start, target, t);
    if (t < 1) requestAnimationFrame(animateFocus);
  }
  animateFocus();

  const name = obj.userData?.name ?? "Unknown";
  hudFocus.textContent = `Focused: ${name}`;
}

// Click handler (focus + popup for asteroids)
renderer.domElement.addEventListener("click", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableBodies(), false);
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    focusOnObject(obj);

    // If asteroid, show popup; else hide it
    if (asteroids.includes(obj)) {
      showAsteroidInfo(obj);
    } else {
      infoBox.style.display = "none";
    }
  }
});

// ===================================================
// NASA NEO API FETCH (adds asteroids with details)
// ===================================================
const NASA_API_KEY = "n4XWNpBqtNGmu1n3EZH9pPA4EoHIQK34wF9f2cn9"; // your key

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const today = new Date();
const startDate = formatDate(today);
const endDate = formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));

async function loadAsteroidsFromAPI() {
  try {
    const res = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${NASA_API_KEY}`
    );
    const data = await res.json();
    const allDates = Object.keys(data.near_earth_objects || {});
    const neos = allDates.flatMap(date => data.near_earth_objects[date] || []);

    const kmToUnits = 15 / 6371; // Earth radius 15 units ≈ 6371 km

    neos.forEach((neo, i) => {
      const name = neo.name || `NEO-${i}`;

      // Estimated diameter (meters)
      const estM = neo.estimated_diameter?.meters?.estimated_diameter_max;
      const sizeMeters = Number.isFinite(estM) ? estM : null;

      // Safely read close approach data
      const approach = Array.isArray(neo.close_approach_data) && neo.close_approach_data.length > 0
        ? neo.close_approach_data[0]
        : null;

      const velStr = approach?.relative_velocity?.kilometers_per_second;
      const missStr = approach?.miss_distance?.kilometers;

      const velocity = velStr != null ? parseFloat(velStr) : null;
      const missKm = missStr != null ? parseFloat(missStr) : null;

      // Visibility-friendly radius: meters -> km -> units, then exaggerate
      const radiusUnits = sizeMeters != null
        ? Math.max((sizeMeters / 1000) * kmToUnits * 100, 0.4)
        : 0.6;

      const asteroid = createAsteroid(name, radiusUnits, 0x777777, radiusUnits);
      asteroid.userData.velocity = Number.isFinite(velocity) ? velocity : null;
      asteroid.userData.missDistance = Number.isFinite(missKm) ? missKm : null;
      asteroid.userData.sizeMeters = Number.isFinite(sizeMeters) ? sizeMeters : null;

      // Simple impact danger heuristic (velocity × size)
      const impactEnergy = (asteroid.userData.velocity ?? 0) * (asteroid.userData.sizeMeters ?? 0);
      asteroid.userData.dangerLevel =
        impactEnergy > 1500 ? "High" : impactEnergy > 500 ? "Medium" : "Low";

      asteroids.push(asteroid);
      scene.add(asteroid);

      // Place around Earth at miss distance (clamped to keep in scene)
      const missUnits = Math.min(((asteroid.userData.missDistance ?? 100000) * kmToUnits), 1500);
      const angle = i * (Math.PI * 2 / Math.max(neos.length, 1));
      const y = ((i % 3) - 1) * 60; // spread vertically
      asteroid.position.set(Math.cos(angle) * missUnits, y, Math.sin(angle) * missUnits);

      // Random spin for variety
      asteroid.userData.spin = {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01
      };
    });

    setAsteroidSizes(); // apply current toggle to new asteroids
    console.log(`Loaded ${neos.length} asteroids from NASA NeoWs`);
  } catch (err) {
    console.error("Error fetching asteroid data:", err);
  }
}
loadAsteroidsFromAPI();

// ===================================================
// ANIMATION
// ===================================================
let earthAngle = 0;
let moonAngle = 0;
let tcAngle = 0;
let szAngle = 0;

function animate() {
  requestAnimationFrame(animate);

  // Animate Sun shader
  sunMaterial.uniforms.time.value = performance.now() / 1000;

  // Earth revolution around Sun
  earthAngle += 0.0005;
  const earthDistance = 200;
  earth.position.set(Math.cos(earthAngle) * earthDistance, 0, Math.sin(earthAngle) * earthDistance);

  // Rotate Earth on its axis
  earth.rotation.y += 0.002;

  // Keep overlays aligned with Earth
  earthNightMesh.position.copy(earth.position);
  earthNightMesh.rotation.y += 0.002;
  clouds.position.copy(earth.position);
  clouds.rotation.y += 0.0025;

  // Moon orbit around Earth
  moonAngle += 0.002;
  const moonDistance = 40;
  moon.position.set(
    earth.position.x + Math.cos(moonAngle) * moonDistance,
    0,
    earth.position.z + Math.sin(moonAngle) * moonDistance
  );
  moon.lookAt(earth.position);

  // Demo asteroids orbits (for motion variety)
  tcAngle += 0.002;
  asteroidTC.position.set(Math.cos(tcAngle) * 220, 20, Math.sin(tcAngle) * 220);
  szAngle += 0.001;
  asteroidSZ27.position.set(Math.cos(szAngle) * 600, -30, Math.sin(szAngle) * 600);

  // Tumbling rotation for all asteroids
  asteroids.forEach(ast => {
    ast.rotation.x += ast.userData.spin.x;
    ast.rotation.y += ast.userData.spin.y;
    ast.rotation.z += ast.userData.spin.z;
  });

  // Danger zone check (hover has priority)
  const dangerThreshold = 100; // units (visual)
  asteroids.forEach((asteroid) => {
    const dist = asteroid.position.distanceTo(earth.position);
    const mat = asteroid.material;
    const isDanger = dist < dangerThreshold;
    asteroid.userData.danger = isDanger;

    if (hoverTarget !== asteroid) {
      if (isDanger) {
        mat.emissive.setHex(0xff0000);
        mat.emissiveIntensity = 2.0 + Math.sin(performance.now() * 0.02) * 1.0;
        asteroid.scale.setScalar(asteroid.userData.currentScale * 1.1); // pulse
      } else {
        mat.emissive.setHex(asteroid.userData.baseEmissive);
        mat.emissiveIntensity = 0.6;
        asteroid.scale.setScalar(asteroid.userData.currentScale);
      }
    }
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

// ===================================================
// RESIZE HANDLER
// ===================================================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});