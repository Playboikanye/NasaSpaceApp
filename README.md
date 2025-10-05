

## 🌍 Visualizing Near-Earth Asteroids in 3D  
**Real-time asteroid tracker using Three.js and NASA’s NeoWs API**

### 🚀 Overview  
This project simulates near-Earth asteroid flybys using real NASA data and interactive 3D graphics. Built with Three.js, it visualizes the Earth-Moon-Sun system and displays asteroids orbiting Earth with velocity, size, and impact danger indicators. It’s designed for education, awareness, and scientific curiosity.

### 🧰 Technologies Used  
- **Three.js** — WebGL-based 3D rendering  
- **NASA NeoWs API** — Near-Earth Object Web Service  
- **JavaScript** — Core logic and interactivity  
- **Custom shaders** — Animated Sun surface  
- **Textures** — Earth, Moon, Sun, space background, asteroid surface

### 🌌 Features  
- 🌍 Earth with axial tilt, bump mapping, night lights, and cloud layers  
- 🌕 Moon orbiting Earth  
- ☀️ Sun with animated shader  
- 🪨 Irregular tumbling asteroids with realistic and exaggerated size toggle  
- 📡 Live asteroid data: velocity, miss distance, estimated diameter  
- 🚨 Danger zone detection with pulsing red glow  
- 🖱️ Hover tooltips and click-to-focus camera  
- 📋 Info panel with full asteroid details  
- 🎛️ HUD overlay for asteroid size mode and focus target

### 📡 NASA API Integration  
Asteroids are fetched using the [NeoWs API](https://api.nasa.gov/) with your personal key. For each asteroid, the app displays:
- Name  
- Estimated diameter (meters)  
- Relative velocity (km/s)  
- Miss distance (km)  
- Impact danger level (Low / Medium / High)

### 📦 Installation  
```bash
git clone https://github.com/your-username/asteroid-tracker.git
cd asteroid-tracker
```

Make sure to replace the NASA API key in `script.js`:
```js
const NASA_API_KEY = "your_personal_key_here";
```

Then open `index.html` in your browser.

### 🧠 Future Enhancements  
- Satellite overlays and orbital paths  
- Historical asteroid flybys  
- Impact simulation and heatmaps  
- Date selector and time travel mode  
- Exportable reports and screenshots
