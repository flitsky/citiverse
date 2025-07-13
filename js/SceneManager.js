class SceneManager {
    constructor(container) {
        this.container = container;
        this.currentScene = null;
        this.scenes = {};
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        this.clock = new THREE.Clock();
        this.frameCount = 0;
        this.lastTime = 0;
        
        this.setupEventListeners();
        this.animate();
    }
    
    addScene(name, sceneClass) {
        this.scenes[name] = new sceneClass(this.renderer);
        console.log(`Added scene: ${name}`);
    }
    
    switchScene(name) {
        if (this.scenes[name]) {
            if (this.currentScene) {
                this.currentScene.cleanup();
            }
            this.currentScene = this.scenes[name];
            this.currentScene.init();
            console.log(`Switched to scene: ${name}`);
            
            document.getElementById('current-scene').textContent = name;
            
            document.querySelectorAll('.scene-button').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.scene === name) {
                    btn.classList.add('active');
                }
            });
        }
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        
        document.querySelectorAll('.scene-button').forEach(button => {
            button.addEventListener('click', () => {
                this.switchScene(button.dataset.scene);
            });
        });
    }
    
    onWindowResize() {
        if (this.currentScene && this.currentScene.camera) {
            this.currentScene.camera.aspect = window.innerWidth / window.innerHeight;
            this.currentScene.camera.updateProjectionMatrix();
        }
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        if (this.currentScene) {
            this.currentScene.update(delta);
            this.renderer.render(this.currentScene.scene, this.currentScene.camera);
        }
        
        this.updateDebugInfo();
    }
    
    updateDebugInfo() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            document.getElementById('fps').textContent = fps;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
        
        if (this.currentScene && this.currentScene.scene) {
            let objectCount = 0;
            this.currentScene.scene.traverse(() => objectCount++);
            document.getElementById('object-count').textContent = objectCount;
        }
    }
}