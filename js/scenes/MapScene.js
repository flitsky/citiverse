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
        this.createDistricts(); // 구역 시각화
        this.createRoads();
        this.createBuildings(); // 일반 건물(작게)
        this.createMetaverseFactory(); // 중앙 Factory
        this.setupControls();
        this.setupBackground();
        this.setupRaycaster(); // 클릭 이벤트
    }

    setupCamera() {
        this.camera.position.set(10, 15, 10);
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

    createDistricts() {
        // 3km x 3km 구역을 1km 단위로 구분(시각적 구분)
        const districtMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.15 });
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                const geo = new THREE.PlaneGeometry(6.66, 6.66);
                const mesh = new THREE.Mesh(geo, districtMaterial);
                mesh.position.set(x * 6.66, 0.02, z * 6.66);
                mesh.rotation.x = -Math.PI / 2;
                this.scene.add(mesh);
            }
        }
    }

    createBuildings() {
        // 일반 건물: 작고 단순하게 여러 개 배치(Factory 강조를 위해)
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        for (let i = 0; i < 30; i++) {
            const width = 0.5 + Math.random() * 0.7;
            const depth = 0.5 + Math.random() * 0.7;
            const height = 1 + Math.random() * 2;
            // Factory와 겹치지 않게 중앙에서 멀리 배치
            let x, z;
            do {
                x = (Math.random() - 0.5) * 18;
                z = (Math.random() - 0.5) * 18;
            } while (Math.abs(x) < 2.5 && Math.abs(z) < 2.5);
            const geo = new THREE.BoxGeometry(width, height, depth);
            const mesh = new THREE.Mesh(geo, buildingMaterial);
            mesh.position.set(x, height / 2, z);
            mesh.castShadow = true;
            this.scene.add(mesh);
        }
    }

    createMetaverseFactory() {
        // 일반 건물의 3-5배 크기로 조정된 Factory 건물
        const baseGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
        const baseMat = new THREE.MeshPhongMaterial({ color: 0xffd700, shininess: 80 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(0, 0.3, 0);
        base.castShadow = true;
        
        // Factory 타워
        const towerGeo = new THREE.CylinderGeometry(0.15, 0.2, 1, 24);
        const towerMat = new THREE.MeshPhongMaterial({ color: 0xff8c00, shininess: 100 });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(0, 1.1, 0);
        tower.castShadow = true;
        
        // Factory 지붕
        const roofGeo = new THREE.ConeGeometry(0.22, 0.25, 24);
        const roofMat = new THREE.MeshPhongMaterial({ color: 0x8b0000, shininess: 120 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, 1.75, 0);
        roof.castShadow = true;
        
        // 클릭 이벤트용 그룹 (블럭 내 위치로 이동)
        this.metaverseFactory = new THREE.Group();
        this.metaverseFactory.add(base);
        this.metaverseFactory.add(tower);
        this.metaverseFactory.add(roof);
        this.metaverseFactory.position.set(-2, 0, -2); // 대각선 맞은편 블럭으로 이동
        this.scene.add(this.metaverseFactory);
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
        
        // 이벤트 리스너 제거
        if (this.onMouseClick) {
            this.renderer.domElement.removeEventListener('click', this.onMouseClick);
        }
    }

    setupRaycaster() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 클릭 이벤트 핸들러
        this.onMouseClick = (event) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.metaverseFactory.children, true);
            
            if (intersects.length > 0) {
                // Factory 클릭됨: FactoryScene으로 전환
                console.log('Factory clicked! Switching to FactoryScene...');
                
                // SceneManager를 통해 scene 전환
                if (window.sceneManager) {
                    window.sceneManager.switchScene('factory');
                } else {
                    console.error('SceneManager not found on window object');
                }
            }
        };
        
        this.renderer.domElement.addEventListener('click', this.onMouseClick);
    }
}