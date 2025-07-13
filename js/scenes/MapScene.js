class MapScene {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1000);
        this.controls = null;
        this.mapTerrain = null;
        this.buildings = [];
    }
    
    init() {
        this.setupCamera();
        this.setupLights();
        this.createTerrain();
        this.createGangnamBuildings();
        this.createRoads();
        this.setupControls();
        this.setupBackground();
    }
    
    setupCamera() {
        this.camera.position.set(0, 20, 0);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }
    
    createTerrain() {
        const geometry = new THREE.PlaneGeometry(20, 20, 32, 32);
        
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#90EE90');
        gradient.addColorStop(0.3, '#98FB98');
        gradient.addColorStop(0.7, '#9ACD32');
        gradient.addColorStop(1, '#228B22');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(100, 400, 300, 20);
        ctx.fillRect(200, 50, 20, 200);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        const material = new THREE.MeshLambertMaterial({ 
            map: texture,
            side: THREE.DoubleSide
        });
        
        this.mapTerrain = new THREE.Mesh(geometry, material);
        this.mapTerrain.rotation.x = -Math.PI / 2;
        this.mapTerrain.receiveShadow = true;
        this.scene.add(this.mapTerrain);
    }
    
    createGangnamBuildings() {
        const buildingData = [
            { x: -6, z: -6, width: 1.5, height: 8, depth: 1.5, color: 0x4169E1 },
            { x: -3, z: -7, width: 2, height: 12, depth: 2, color: 0x1E90FF },
            { x: 0, z: -6, width: 1.8, height: 15, depth: 1.8, color: 0x00BFFF },
            { x: 3, z: -5, width: 2.2, height: 18, depth: 2.2, color: 0x87CEEB },
            { x: 6, z: -6, width: 1.6, height: 10, depth: 1.6, color: 0x4682B4 },
            
            { x: -5, z: -2, width: 1.2, height: 6, depth: 1.2, color: 0x708090 },
            { x: -2, z: -1, width: 1.5, height: 9, depth: 1.5, color: 0x778899 },
            { x: 1, z: -2, width: 1.8, height: 11, depth: 1.8, color: 0x696969 },
            { x: 4, z: -1, width: 2, height: 14, depth: 2, color: 0x2F4F4F },
            
            { x: -7, z: 2, width: 1.3, height: 7, depth: 1.3, color: 0xCD853F },
            { x: -4, z: 3, width: 1.7, height: 10, depth: 1.7, color: 0xD2691E },
            { x: -1, z: 2, width: 2, height: 13, depth: 2, color: 0xA0522D },
            { x: 2, z: 3, width: 1.6, height: 8, depth: 1.6, color: 0x8B4513 },
            { x: 5, z: 2, width: 1.9, height: 16, depth: 1.9, color: 0xDAA520 },
            
            { x: -6, z: 6, width: 1.4, height: 5, depth: 1.4, color: 0xDC143C },
            { x: -3, z: 7, width: 1.8, height: 8, depth: 1.8, color: 0xFF6347 },
            { x: 0, z: 6, width: 2.1, height: 12, depth: 2.1, color: 0xFF4500 },
            { x: 3, z: 7, width: 1.5, height: 9, depth: 1.5, color: 0xFF8C00 },
            { x: 6, z: 6, width: 1.7, height: 11, depth: 1.7, color: 0xFFA500 }
        ];
        
        buildingData.forEach(building => {
            this.createBuilding(building);
        });
    }
    
    createBuilding(data) {
        const geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
        const material = new THREE.MeshLambertMaterial({ color: data.color });
        
        const building = new THREE.Mesh(geometry, material);
        building.position.set(data.x, data.height / 2, data.z);
        building.castShadow = true;
        
        this.buildings.push(building);
        this.scene.add(building);
        
        const windowGeometry = new THREE.PlaneGeometry(0.2, 0.3);
        const windowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFF88,
            transparent: true,
            opacity: 0.8
        });
        
        const windowsPerFloor = Math.floor(data.width * 2);
        const floors = Math.floor(data.height / 2);
        
        for (let floor = 0; floor < floors; floor++) {
            for (let window = 0; window < windowsPerFloor; window++) {
                if (Math.random() > 0.3) {
                    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                    windowMesh.position.set(
                        -data.width/2 + (window + 0.5) * (data.width / windowsPerFloor),
                        floor * 2 + 1,
                        data.depth/2 + 0.01
                    );
                    building.add(windowMesh);
                }
            }
        }
    }
    
    createRoads() {
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        const mainRoadGeometry = new THREE.PlaneGeometry(20, 1);
        const mainRoad = new THREE.Mesh(mainRoadGeometry, roadMaterial);
        mainRoad.rotation.x = -Math.PI / 2;
        mainRoad.position.y = 0.01;
        this.scene.add(mainRoad);
        
        const sideRoadGeometry = new THREE.PlaneGeometry(1, 20);
        const sideRoad = new THREE.Mesh(sideRoadGeometry, roadMaterial);
        sideRoad.rotation.x = -Math.PI / 2;
        sideRoad.position.y = 0.01;
        this.scene.add(sideRoad);
        
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        for (let i = -9; i <= 9; i += 2) {
            const lineGeometry = new THREE.PlaneGeometry(0.8, 0.1);
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(i, 0.02, 0);
            this.scene.add(line);
        }
    }
    
    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minZoom = 0.5;
        this.controls.maxZoom = 3;
        this.controls.enableRotation = true;
        this.controls.maxPolarAngle = Math.PI / 2;
    }
    
    setupBackground() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#E0F6FF');
        gradient.addColorStop(1, '#F0F8FF');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * 200;
            const size = 20 + Math.random() * 40;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        this.scene.background = texture;
    }
    
    update(delta) {
        if (this.controls) {
            this.controls.update();
        }
        
        this.buildings.forEach((building, index) => {
            building.children.forEach(window => {
                if (window.material && window.material.opacity !== undefined) {
                    window.material.opacity = 0.5 + Math.sin(Date.now() * 0.001 + index) * 0.3;
                }
            });
        });
    }
    
    cleanup() {
        if (this.controls) {
            this.controls.dispose();
        }
    }
}