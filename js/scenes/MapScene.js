class MapScene {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            55,
            window.innerWidth / window.innerHeight,
            0.1,
            400
        );

        this.controls = null;
        this.raycaster = null;
        this.mouse = null;

        this.cityData = null;
        this.mapTerrain = null;

        this.mapGroup = new THREE.Group();
        this.roadGroup = new THREE.Group();
        this.buildingGroup = new THREE.Group();
        this.trafficGroup = new THREE.Group();

        this.metaverseFactory = null;

        this.trafficRoutes = [];
        this.trafficVehicles = [];

        this.materialCache = new Map();

        this.isInitialized = false;
        this.time = 0;

        this.tileInfo = {
            zoom: 16,
            xRange: [55882, 55884],
            yRange: [25377, 25379],
        };

        this.scene.add(this.mapGroup);
        this.mapGroup.add(this.roadGroup);
        this.mapGroup.add(this.buildingGroup);
        this.mapGroup.add(this.trafficGroup);
    }

    async init() {
        if (!this.isInitialized) {
            this.setupCamera();
            this.setupLights();
            this.setupBackground();

            await this.loadCityData();
            await this.createTerrain();
            this.createBuildings();
            this.createRoadOverlay();
            this.createMetaverseFactory();
            this.createTraffic();

            this.scene.fog = new THREE.FogExp2(0x02040a, 0.028);
            this.isInitialized = true;
        }

        this.setupControls();
        this.setupRaycaster();
    }

    setupCamera() {
        this.camera.position.set(-12, 16, 18);
        this.camera.lookAt(0, 0, 0);
    }

    setupLights() {
        const hemi = new THREE.HemisphereLight(0x6a8cbc, 0x1b1f29, 0.75);
        this.scene.add(hemi);

        const sunLight = new THREE.DirectionalLight(0xfff1d4, 1.35);
        sunLight.position.set(12, 25, 8);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 120;
        sunLight.shadow.camera.left = -40;
        sunLight.shadow.camera.right = 40;
        sunLight.shadow.camera.top = 40;
        sunLight.shadow.camera.bottom = -40;
        this.scene.add(sunLight);

        const rimLight = new THREE.DirectionalLight(0x6bdfff, 0.35);
        rimLight.position.set(-18, 12, -20);
        this.scene.add(rimLight);

        const fillLight = new THREE.PointLight(0x446caa, 1.2, 120, 2);
        fillLight.position.set(5, 6, -8);
        this.scene.add(fillLight);
    }

    setupBackground() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#060b1b');
        gradient.addColorStop(0.5, '#0f1b33');
        gradient.addColorStop(1, '#151c26');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 120; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height * 0.6;
            const size = Math.random() * 1.5;
            ctx.fillRect(x, y, size, size);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        this.scene.background = texture;
    }

    async loadCityData() {
        if (this.cityData) {
            return this.cityData;
        }

        const response = await fetch('data/seoul_city.json');
        if (!response.ok) {
            throw new Error(`Failed to load city data: ${response.status}`);
        }
        this.cityData = await response.json();
        return this.cityData;
    }

    async createTerrain() {
        const [minX, maxX] = this.tileInfo.xRange;
        const [minY, maxY] = this.tileInfo.yRange;
        const tileCountX = maxX - minX + 1;
        const tileCountY = maxY - minY + 1;
        const tileSize = 256;

        const canvas = document.createElement('canvas');
        canvas.width = tileCountX * tileSize;
        canvas.height = tileCountY * tileSize;
        const ctx = canvas.getContext('2d');

        const loader = new THREE.ImageLoader();
        const loadImage = (url) =>
            new Promise((resolve, reject) => {
                loader.load(url, resolve, undefined, reject);
            });

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const image = await loadImage(`textures/tiles/${this.tileInfo.zoom}/${x}/${y}.png`);
                const px = (x - minX) * tileSize;
                const py = (y - minY) * tileSize;
                ctx.drawImage(image, px, py, tileSize, tileSize);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        const geometry = new THREE.PlaneGeometry(this.cityData.size, this.cityData.size, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.95,
            metalness: 0.05,
        });

        this.mapTerrain = new THREE.Mesh(geometry, material);
        this.mapTerrain.rotation.x = -Math.PI / 2;
        this.mapTerrain.receiveShadow = true;
        this.mapGroup.add(this.mapTerrain);
    }

    getMaterial(colorHex) {
        if (!this.materialCache.has(colorHex)) {
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(colorHex),
                roughness: 0.6,
                metalness: 0.1,
                emissive: new THREE.Color(0x0d121c),
                emissiveIntensity: 0.2,
            });
            this.materialCache.set(colorHex, material);
        }
        return this.materialCache.get(colorHex);
    }

    createBuildings() {
        const extrudeSettings = {
            steps: 1,
            depth: 1,
            bevelEnabled: false,
        };
        const heightScale = 0.01;

        this.cityData.buildings.forEach((building, index) => {
            if (building.footprint.length < 3) {
                return;
            }

            const shape = new THREE.Shape();
            building.footprint.forEach((point, idx) => {
                const [x, z] = point;
                if (idx === 0) {
                    shape.moveTo(x, z);
                } else {
                    shape.lineTo(x, z);
                }
            });

            const scaledHeight = Math.max(0.02, building.height * heightScale);
            const scaledMinHeight = Math.max(0, (building.minHeight || 0) * heightScale);

            extrudeSettings.depth = scaledHeight;
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            geometry.rotateX(-Math.PI / 2);
            geometry.translate(0, scaledMinHeight, 0);

            const material = this.getMaterial(building.color);
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = {
                baseEmissive: material.emissiveIntensity,
                flickerOffset: (index % 10) * 0.37,
            };
            this.buildingGroup.add(mesh);

            const edges = new THREE.EdgesGeometry(geometry, 15);
            const edgeMaterial = new THREE.LineBasicMaterial({
                color: 0x0f1725,
                linewidth: 1,
            });
            const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
            mesh.add(edgeLines);
        });
    }

    createRoadOverlay() {
        const elevation = 0.02;
        const highlightTypes = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary']);

        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x1f232e,
            emissive: new THREE.Color(0x050607),
            emissiveIntensity: 0.08,
            roughness: 0.85,
            metalness: 0.05,
        });

        const laneMaterial = new THREE.LineDashedMaterial({
            color: 0xf8d68d,
            dashSize: 0.35,
            gapSize: 0.2,
            linewidth: 1,
        });

        this.cityData.roads.forEach((road) => {
            if (road.points.length < 2) {
                return;
            }

            if (highlightTypes.has(road.type)) {
                const mesh = this.buildRoadRibbon(road.points, road.width * 2.5, elevation);
                if (mesh) {
                    mesh.material = roadMaterial;
                    this.roadGroup.add(mesh);
                }

                const centerLinePoints = road.points.map(([x, z]) => new THREE.Vector3(x, elevation + 0.005, z));
                const centerGeometry = new THREE.BufferGeometry().setFromPoints(centerLinePoints);
                const centerLine = new THREE.Line(centerGeometry, laneMaterial.clone());
                centerLine.computeLineDistances();
                this.roadGroup.add(centerLine);
            } else if (road.type === 'residential') {
                const mesh = this.buildRoadRibbon(road.points, road.width * 1.6, elevation);
                if (mesh) {
                    mesh.material = roadMaterial;
                    mesh.material.emissiveIntensity = 0.03;
                    this.roadGroup.add(mesh);
                }
            }
        });
    }

    buildRoadRibbon(points, halfWidth, elevation) {
        if (points.length < 2) {
            return null;
        }

        const leftVertices = [];
        const rightVertices = [];
        const distances = [0];

        const vectorPoints = points.map(([x, z]) => new THREE.Vector2(x, z));

        for (let i = 0; i < vectorPoints.length; i++) {
            const current = vectorPoints[i];
            const prev = vectorPoints[i - 1] || current;
            const next = vectorPoints[i + 1] || current;
            const dir = next.clone().sub(prev).normalize();
            const normal = new THREE.Vector2(-dir.y, dir.x);
            const left = current.clone().addScaledVector(normal, halfWidth);
            const right = current.clone().addScaledVector(normal, -halfWidth);
            leftVertices.push(left);
            rightVertices.push(right);

            if (i > 0) {
                const segment = current.distanceTo(prev);
                distances.push(distances[i - 1] + segment);
            }
        }

        const positions = [];
        const uvs = [];
        const indices = [];

        for (let i = 0; i < leftVertices.length; i++) {
            const left = leftVertices[i];
            const right = rightVertices[i];
            positions.push(left.x, elevation, left.y);
            positions.push(right.x, elevation, right.y);

            const v = distances[i] * 0.35;
            uvs.push(0, v);
            uvs.push(1, v);
        }

        for (let i = 0; i < leftVertices.length - 1; i++) {
            const a = i * 2;
            const b = a + 1;
            const c = a + 2;
            const d = a + 3;
            indices.push(a, c, b);
            indices.push(c, d, b);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
    }

    createMetaverseFactory() {
        const group = new THREE.Group();

        const padGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 48);
        const padMaterial = new THREE.MeshStandardMaterial({
            color: 0x1c2340,
            emissive: new THREE.Color(0x0b122a),
            emissiveIntensity: 0.3,
            metalness: 0.4,
            roughness: 0.4,
        });
        const pad = new THREE.Mesh(padGeometry, padMaterial);
        pad.receiveShadow = true;
        group.add(pad);

        const baseGeometry = new THREE.CylinderGeometry(0.8, 0.9, 1.4, 32);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x4bb7ff,
            emissive: new THREE.Color(0x1f81ff),
            emissiveIntensity: 0.8,
            metalness: 0.7,
            roughness: 0.3,
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.8;
        base.castShadow = true;
        group.add(base);

        const crownGeometry = new THREE.TorusGeometry(0.9, 0.08, 16, 64);
        const crownMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff7d6,
            emissive: new THREE.Color(0xffc76b),
            emissiveIntensity: 0.6,
            metalness: 0.8,
            roughness: 0.2,
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.rotation.x = Math.PI / 2;
        crown.position.y = 1.5;
        crown.castShadow = true;
        group.add(crown);

        const beaconGeometry = new THREE.ConeGeometry(0.2, 0.6, 24);
        const beaconMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6b6b,
            emissive: new THREE.Color(0xff2f2f),
            emissiveIntensity: 0.9,
            metalness: 0.6,
            roughness: 0.25,
        });
        const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beacon.position.y = 1.95;
        beacon.castShadow = true;
        group.add(beacon);

        const ringGeometry = new THREE.RingGeometry(1.1, 1.3, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x58fffc,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.21;
        group.add(ring);

        group.position.set(0.6, 0.1, -0.4);
        this.metaverseFactory = group;
        this.mapGroup.add(group);
    }

    createTraffic() {
        const candidateRoads = this.cityData.roads.filter((road) =>
            ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'].includes(road.type)
        );

        this.trafficRoutes = candidateRoads
            .map((road) => {
                if (road.points.length < 3) {
                    return null;
                }
                const vectors = road.points.map(
                    ([x, z]) => new THREE.Vector3(x, 0.04, z)
                );
                const curve = new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.05);
                return {
                    road,
                    curve,
                    length: curve.getLength(),
                };
            })
            .filter(Boolean);

        const carPalette = [0xff5e5e, 0x62a9ff, 0x55ffb0, 0xffd166, 0xffffff, 0xb388ff];

        const maxCars = Math.min(40, this.trafficRoutes.length * 2);
        for (let i = 0; i < maxCars; i++) {
            const route = this.trafficRoutes[i % this.trafficRoutes.length];
            if (!route) continue;

            const color = carPalette[i % carPalette.length];
            const carMesh = this.createCarMesh(color);
            this.trafficGroup.add(carMesh);

            const laneOffset = (i % 2 === 0 ? 1 : -1) * (route.road.width * 0.4 + Math.random() * 0.08);
            const distance = Math.random() * route.length;
            const speed = (6 + Math.random() * 4) * 0.15;

            this.trafficVehicles.push({
                mesh: carMesh,
                route,
                distance,
                speed,
                laneOffset,
            });
        }
    }

    createCarMesh(colorHex) {
        const group = new THREE.Group();

        const bodyGeometry = new THREE.BoxGeometry(0.42, 0.16, 0.9);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(colorHex),
            roughness: 0.35,
            metalness: 0.4,
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.14;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const cabinGeometry = new THREE.BoxGeometry(0.36, 0.18, 0.42);
        const cabinMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x1f2430,
            roughness: 0.1,
            metalness: 0.8,
            transmission: 0.4,
            opacity: 0.8,
            transparent: true,
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(0, 0.24, -0.05);
        group.add(cabin);

        const lightGeometry = new THREE.BoxGeometry(0.1, 0.04, 0.02);
        const frontLightMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff8b5,
            emissive: 0xfff6a4,
            emissiveIntensity: 1.5,
        });
        const rearLightMaterial = new THREE.MeshStandardMaterial({
            color: 0xff5e5e,
            emissive: 0xff3b3b,
            emissiveIntensity: 2.2,
        });
        const headlightLeft = new THREE.Mesh(lightGeometry, frontLightMaterial);
        headlightLeft.position.set(-0.12, 0.12, 0.47);
        const headlightRight = headlightLeft.clone();
        headlightRight.position.x = 0.12;
        const taillightLeft = new THREE.Mesh(lightGeometry, rearLightMaterial);
        taillightLeft.position.set(-0.12, 0.12, -0.47);
        const taillightRight = taillightLeft.clone();
        taillightRight.position.x = 0.12;
        group.add(headlightLeft, headlightRight, taillightLeft, taillightRight);

        const wheelGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 18);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x0c0c0f,
            roughness: 0.3,
            metalness: 0.3,
        });

        const wheelPositions = [
            [-0.2, 0.06, 0.3],
            [0.2, 0.06, 0.3],
            [-0.2, 0.06, -0.3],
            [0.2, 0.06, -0.3],
        ];

        wheelPositions.forEach(([x, y, z]) => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, y, z);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            group.add(wheel);
        });

        group.scale.setScalar(0.6);
        return group;
    }

    setupControls() {
        if (this.controls) {
            this.controls.dispose();
        }

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.07;
        this.controls.minDistance = 6;
        this.controls.maxDistance = 50;
        this.controls.minPolarAngle = 0.2;
        this.controls.maxPolarAngle = Math.PI / 2.1;
        this.controls.enablePan = false;
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    setupRaycaster() {
        if (!this.raycaster) {
            this.raycaster = new THREE.Raycaster();
            this.mouse = new THREE.Vector2();
        }

        if (this.onMouseClick) {
            this.renderer.domElement.removeEventListener('click', this.onMouseClick);
        }

        this.onMouseClick = (event) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.metaverseFactory, true);

            if (intersects.length > 0) {
                console.log('Factory clicked! Switching to FactoryScene...');
                if (window.sceneManager) {
                    window.sceneManager.switchScene('factory');
                } else {
                    console.error('SceneManager not found on window object');
                }
            }
        };

        this.renderer.domElement.addEventListener('click', this.onMouseClick);
    }

    update(delta) {
        if (this.controls) {
            this.controls.update();
        }

        if (!this.isInitialized) {
            return;
        }

        this.time += delta;

        this.trafficVehicles.forEach((vehicle) => {
            const { mesh, route } = vehicle;
            vehicle.distance = (vehicle.distance + vehicle.speed * delta) % route.length;
            const t = vehicle.distance / route.length;
            const position = route.curve.getPointAt(t);
            const tangent = route.curve.getTangentAt(t).normalize();
            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(up, tangent).normalize();

            mesh.position.copy(position);
            mesh.position.addScaledVector(right, vehicle.laneOffset);

            const matrix = new THREE.Matrix4().makeBasis(right, up, tangent);
            mesh.quaternion.setFromRotationMatrix(matrix);
        });

        this.buildingGroup.children.forEach((building) => {
            if (building.material && building.userData) {
                const flicker =
                    building.userData.baseEmissive +
                    0.04 * Math.sin(this.time * 1.7 + building.userData.flickerOffset);
                building.material.emissiveIntensity = Math.max(0.1, flicker);
            }
        });

        if (this.metaverseFactory) {
            this.metaverseFactory.rotation.y += delta * 0.4;
            const beacon = this.metaverseFactory.children.find(
                (child) => child.material && child.material.emissiveIntensity
            );
            if (beacon && beacon.material && beacon.material.emissive) {
                beacon.material.emissiveIntensity = 0.7 + Math.sin(this.time * 3) * 0.3;
            }
        }
    }

    cleanup() {
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }

        if (this.onMouseClick) {
            this.renderer.domElement.removeEventListener('click', this.onMouseClick);
            this.onMouseClick = null;
        }
    }
}
