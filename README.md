# 🌍 Citiverse

> **Interactive 3D visualization showcasing Earth, Seoul cityscape, and metaverse factory scenes with real NASA satellite imagery**

![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![NASA](https://img.shields.io/badge/NASA-0B3D91?style=for-the-badge&logo=nasa&logoColor=white)

## ✨ Features

### 🌍 Earth Scene
- **Real NASA Blue Marble** satellite imagery (2K resolution)
- **Day/Night cycles** with city lights from space
- **Realistic cloud formations** with animated movement
- **Surface elevation mapping** from NASA data
- **Water reflection effects** with specular mapping
- **Atmospheric scattering** with custom shaders

### 🏙️ Seoul Map Scene  
- **Gangnam-gu district** top-down view
- **Animated building lights** simulating city life
- **Road networks** and urban planning visualization
- **Interactive camera controls** for exploration

### 🏭 Metaverse Factory Scene
- **Industrial environment** with animated workers
- **Moving machinery** and production lines
- **Particle effects** and atmospheric lighting
- **3D worker avatars** with realistic movement patterns

## 🚀 Quick Start

```bash
# Clone the repository
git clone git@github.com:flitsky/citiverse.git
cd citiverse

# Start the development server
npm start

# Open in your browser
# http://localhost:8000
```

## 🎮 Controls

- **Mouse**: Rotate and zoom camera (OrbitControls)
- **Scene Buttons**: Switch between Earth, Seoul Map, and Factory scenes
- **Debug Panel**: Monitor FPS and object count in real-time

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript + Three.js r128
- **3D Graphics**: WebGL with custom shaders
- **Textures**: NASA satellite imagery (2.5MB total)
- **Server**: Node.js HTTP server with CORS support
- **Architecture**: Modular scene management system

## 📁 Project Structure

```
citiverse/
├── index.html              # Main HTML entry point
├── package.json            # Node.js project configuration
├── server.js              # Development server with CORS
├── CLAUDE.md              # AI development guidance
├── js/
│   ├── SceneManager.js        # Core scene management
│   ├── main.js               # Application initialization
│   └── scenes/
│       ├── EarthScene.js         # NASA Earth with shaders
│       ├── FactoryScene.js       # Metaverse factory scene
│       └── MapScene.js          # Seoul cityscape view
└── textures/
    ├── 2k_earth_daymap.jpg      # NASA Blue Marble (452KB)
    ├── 2k_earth_nightmap.jpg    # City lights from space (249KB)
    ├── 2k_earth_clouds.jpg      # Real cloud formations (943KB)
    ├── 2k_earth_normal_map.tif  # Surface elevation data (509KB)
    └── 2k_earth_specular_map.tif # Water reflection mapping (330KB)
```

## 🌟 Highlights

### Advanced Earth Rendering
- **Custom Fragment Shaders** blending day/night textures based on lighting
- **Real-time Cloud Animation** with UV offset calculations
- **Fresnel Atmospheric Effects** for realistic rim lighting
- **NASA-accurate Geography** from Blue Marble dataset

### Performance Optimizations
- **High-resolution Geometry** (128x64 sphere segments)
- **Texture Compression** and efficient loading
- **Shadow Mapping** with PCF soft shadows
- **FPS Monitoring** and debug information

### Interactive Features
- **Smooth Scene Transitions** with proper cleanup
- **Responsive Design** adapting to window size
- **Real-time Animations** with delta-time calculations
- **Intuitive UI Controls** with visual feedback

## 🔧 Development

### Adding New Scenes
1. Create scene class in `js/scenes/` following the pattern:
   ```javascript
   class MyScene {
     constructor(renderer) { /* setup */ }
     init() { /* initialize scene */ }
     update(delta) { /* per-frame updates */ }
     cleanup() { /* resource disposal */ }
   }
   ```

2. Register in `main.js`:
   ```javascript
   sceneManager.addScene('myScene', MyScene);
   ```

3. Add UI button in `index.html`

### Shader Modifications
Earth scene uses custom ShaderMaterial with:
- **Vertex Shader**: UV mapping and normal calculations
- **Fragment Shader**: Texture blending and lighting effects
- **Uniforms**: Real-time values for animations

## 🎯 Future Enhancements

- [ ] **VR/AR Support** for immersive exploration
- [ ] **Real-time Weather Data** integration
- [ ] **Satellite Tracking** with live orbital data
- [ ] **Interactive Seoul Buildings** with detailed interiors
- [ ] **Factory Simulation** with production metrics
- [ ] **Mobile Optimization** with touch controls

## 📜 Attribution

- **NASA Satellite Imagery**: Via [Solar System Scope](https://www.solarsystemscope.com/textures/) (Attribution 4.0 International)
- **Three.js Library**: [three.js.org](https://threejs.org/)
- **Blue Marble Dataset**: NASA Goddard Space Flight Center

## 📞 Support

For questions, suggestions, or collaboration:
- **Repository**: [github.com/flitsky/citiverse](https://github.com/flitsky/citiverse)
- **Issues**: Report bugs or request features via GitHub Issues

---

**Built with ❤️ using Claude Code and NASA's amazing satellite imagery**