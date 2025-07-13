# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Citiverse is a Three.js-based browser application showcasing three interactive 3D scenes:
- **Earth Scene**: NASA satellite imagery with realistic day/night cycles, moving clouds, and atmospheric effects
- **Seoul Map Scene**: Top-down view of Gangnam-gu district with buildings and animated city lights
- **Metaverse Factory Scene**: Industrial environment with animated workers, machines, and particle systems

## Development Commands

**Start Local Server:**
```bash
python3 server.py
```
Then open: http://localhost:8000

**Alternative Servers:**
```bash
npx http-server -p 8000 --cors
```

**Why Local Server Required:**
Local file access (`file://`) blocks NASA texture loading due to CORS policy. The included `server.py` resolves this.

## Architecture

**Scene Management System:**
- `SceneManager.js`: Central controller that manages Three.js renderer, scene switching, and animation loop
- `main.js`: Entry point that initializes SceneManager and registers all scenes
- Scene classes follow a consistent interface: `init()`, `update(delta)`, `cleanup()`

**Scene Structure:**
Each scene class (EarthScene, MapScene, FactoryScene) is self-contained with:
- Constructor receives shared renderer instance
- `init()` method sets up cameras, lights, geometry, and materials
- `update(delta)` method handles per-frame animations
- `cleanup()` method disposes of resources when switching scenes

**NASA Texture Integration:**
- Real satellite imagery stored in `/textures/` directory (2.5MB total)
- EarthScene uses advanced shader material combining day/night textures, clouds, normal maps, and specular maps
- Cloud animation speed controlled by `time * 0.00003` in fragment shader for realistic movement

**UI System:**
- Scene switching via buttons with CSS transitions
- Real-time debug info showing FPS, object count, and current scene
- Responsive design with OrbitControls for camera interaction

## Key Technical Details

**Earth Scene Shader:**
- Combines 5 NASA texture maps: day, night, clouds, normal, specular
- Dynamic day/night transitions based on lighting direction
- Cloud UV offset animation for realistic atmospheric movement
- Fresnel-based atmospheric scattering effect

**Performance Considerations:**
- High-resolution geometry (128x64 segments for Earth sphere)
- Shadow mapping enabled with PCF soft shadows
- Texture wrapping configured for seamless UV mapping
- FPS monitoring and object count tracking in debug overlay

**File Dependencies:**
- Three.js r128 loaded from CDN
- OrbitControls loaded separately for camera interaction
- Scene files must be loaded in dependency order (SceneManager before scene classes)

## Common Tasks

**Adding New Scenes:**
1. Create new scene class in `js/scenes/` following existing pattern
2. Add script tag to `index.html`
3. Register scene in `main.js` with `sceneManager.addScene()`
4. Add corresponding UI button in HTML

**Texture Management:**
- Place texture files in `/textures/` directory
- Use TextureLoader with relative paths (`textures/filename.jpg`)
- Configure texture wrapping for seamless tiling if needed

**Shader Modifications:**
- Earth scene uses custom ShaderMaterial with vertex/fragment shaders
- Uniform values updated in `update()` method for animations
- Cloud speed controlled by multiplier in fragment shader UV offset