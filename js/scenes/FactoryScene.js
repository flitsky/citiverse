class FactoryScene {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.controls = null;
        this.factory = null;
        this.machines = [];
        this.workers = [];
        this.particles = null;
        this.conveyorBelt = null;
        this.boxes = [];
    }

    init() {
        this.setupCamera();
        this.setupLights();
        this.createFactory();
        this.createMachines();
        this.createConveyorBelt();
        this.createWorkers();
        this.createParticleSystem();
        this.setupControls();
        this.setupBackground();
    }

    setupCamera() {
        this.camera.position.set(10, 8, 10);
        this.camera.lookAt(0, 0, 0);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(10, 20, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        this.scene.add(mainLight);

        const factoryLight1 = new THREE.SpotLight(0xff6600, 1, 30, Math.PI / 6);
        factoryLight1.position.set(-5, 10, -5);
        factoryLight1.target.position.set(-5, 0, -5);
        this.scene.add(factoryLight1);
        this.scene.add(factoryLight1.target);

        const factoryLight2 = new THREE.SpotLight(0x0066ff, 1, 30, Math.PI / 6);
        factoryLight2.position.set(5, 10, 5);
        factoryLight2.target.position.set(5, 0, 5);
        this.scene.add(factoryLight2);
        this.scene.add(factoryLight2.target);
    }

    createFactory() {
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        for (let x = -10; x <= 10; x += 2) {
            for (let z = -10; z <= 10; z += 2) {
                if (Math.abs(x) === 10 || Math.abs(z) === 10) {
                    const wallGeometry = new THREE.BoxGeometry(0.2, 4, 0.2);
                    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(x, 2, z);
                    wall.castShadow = true;
                    this.scene.add(wall);
                }
            }
        }

        const ceilingGeometry = new THREE.PlaneGeometry(20, 20);
        const ceilingMaterial = new THREE.MeshLambertMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.8
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 6;
        this.scene.add(ceiling);
    }

    createMachines() {
        const machinePositions = [
            { x: -6, z: -6, type: 'assembler' },
            { x: -6, z: 0, type: 'welder' },
            { x: -6, z: 6, type: 'printer' },
            { x: 0, z: -6, type: 'conveyor' },
            { x: 0, z: 6, type: 'conveyor' },
            { x: 6, z: -6, type: 'packager' },
            { x: 6, z: 0, type: 'scanner' },
            { x: 6, z: 6, type: 'storage' }
        ];

        machinePositions.forEach(pos => {
            this.createMachine(pos.x, pos.z, pos.type);
        });
    }

    createMachine(x, z, type) {
        const machine = new THREE.Group();

        let baseColor, height, features;
        switch (type) {
            case 'assembler':
                baseColor = 0xff4444;
                height = 2;
                features = this.createAssemblerFeatures();
                break;
            case 'welder':
                baseColor = 0x4444ff;
                height = 1.5;
                features = this.createWelderFeatures();
                break;
            case 'printer':
                baseColor = 0x44ff44;
                height = 1.8;
                features = this.createPrinterFeatures();
                break;
            case 'conveyor':
                baseColor = 0xffff44;
                height = 0.5;
                features = this.createConveyorFeatures();
                break;
            case 'packager':
                baseColor = 0xff44ff;
                height = 2.2;
                features = this.createPackagerFeatures();
                break;
            case 'scanner':
                baseColor = 0x44ffff;
                height = 1.2;
                features = this.createScannerFeatures();
                break;
            case 'storage':
                baseColor = 0xffffff;
                height = 3;
                features = this.createStorageFeatures();
                break;
        }

        const baseGeometry = new THREE.BoxGeometry(1.5, height, 1.5);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: baseColor });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = height / 2;
        base.castShadow = true;
        machine.add(base);

        features.forEach(feature => machine.add(feature));

        machine.position.set(x, 0, z);
        machine.userData = { type, animationPhase: Math.random() * Math.PI * 2 };
        this.machines.push(machine);
        this.scene.add(machine);
    }

    createAssemblerFeatures() {
        const features = [];

        const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const arm = new THREE.Mesh(armGeometry, armMaterial);
        arm.position.set(0, 2.5, 0);
        features.push(arm);

        return features;
    }

    createWelderFeatures() {
        const features = [];

        const sparkGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const sparkMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.8
        });

        for (let i = 0; i < 5; i++) {
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            spark.position.set(
                (Math.random() - 0.5) * 0.5,
                1.5 + Math.random() * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            features.push(spark);
        }

        return features;
    }

    createPrinterFeatures() {
        const features = [];

        const headGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 2, 0);
        features.push(head);

        return features;
    }

    createConveyorFeatures() {
        const features = [];

        const beltGeometry = new THREE.PlaneGeometry(1.4, 1.4);
        const beltMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const belt = new THREE.Mesh(beltGeometry, beltMaterial);
        belt.rotation.x = -Math.PI / 2;
        belt.position.y = 0.6;
        features.push(belt);

        return features;
    }

    createPackagerFeatures() {
        const features = [];

        const boxGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(0, 2.5, 0);
        features.push(box);

        return features;
    }

    createScannerFeatures() {
        const features = [];

        const laserGeometry = new THREE.CylinderGeometry(0.01, 0.01, 2);
        const laserMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        const laser = new THREE.Mesh(laserGeometry, laserMaterial);
        laser.position.set(0, 2, 0);
        features.push(laser);

        return features;
    }

    createStorageFeatures() {
        const features = [];

        for (let i = 0; i < 3; i++) {
            const shelfGeometry = new THREE.BoxGeometry(1.2, 0.1, 1.2);
            const shelfMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
            const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
            shelf.position.set(0, 1 + i * 0.8, 0);
            features.push(shelf);
        }

        return features;
    }

    createConveyorBelt() {
        // 메인 컨베이어 벨트 (가운데를 가로지름)
        const beltGroup = new THREE.Group();

        // 컨베이어 베이스
        const baseGeometry = new THREE.BoxGeometry(20, 0.3, 2);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.15;
        base.castShadow = true;
        beltGroup.add(base);

        // 컨베이어 벨트 표면 (움직이는 부분)
        const beltGeometry = new THREE.PlaneGeometry(20, 1.8);
        const beltMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const belt = new THREE.Mesh(beltGeometry, beltMaterial);
        belt.rotation.x = -Math.PI / 2;
        belt.position.y = 0.31;
        beltGroup.add(belt);

        // 컨베이어 측면 가이드
        for (let i = 0; i < 2; i++) {
            const sideGeometry = new THREE.BoxGeometry(20, 0.2, 0.1);
            const sideMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
            const side = new THREE.Mesh(sideGeometry, sideMaterial);
            side.position.y = 0.4;
            side.position.z = i === 0 ? -1 : 1;
            beltGroup.add(side);
        }

        // 컨베이어 롤러들
        for (let x = -9; x <= 9; x += 3) {
            const rollerGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2);
            const rollerMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
            const roller = new THREE.Mesh(rollerGeometry, rollerMaterial);
            roller.rotation.z = Math.PI / 2;
            roller.position.set(x, 0.1, 0);
            beltGroup.add(roller);
        }

        // 컨베이어 지지대
        for (let x = -8; x <= 8; x += 4) {
            const supportGeometry = new THREE.BoxGeometry(0.2, 0.5, 2.5);
            const supportMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
            const support = new THREE.Mesh(supportGeometry, supportMaterial);
            support.position.set(x, -0.25, 0);
            beltGroup.add(support);
        }

        this.conveyorBelt = beltGroup;
        this.conveyorBelt.rotation.y = Math.PI / 2; // 90도 회전 (세로 방향)
        this.scene.add(this.conveyorBelt);

        // 컨베이어 벨트 위의 박스들 생성
        this.createBoxes();
    }

    createBoxes() {
        const boxColors = [0x8B4513, 0xD2691E, 0xCD853F, 0xF4A460, 0xDEB887];

        for (let i = 0; i < 6; i++) {
            const boxGroup = new THREE.Group();

            // 메인 박스
            const boxSize = 0.3 + Math.random() * 0.2;
            const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
            const boxMaterial = new THREE.MeshLambertMaterial({
                color: boxColors[Math.floor(Math.random() * boxColors.length)]
            });
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            box.castShadow = true;
            boxGroup.add(box);

            // 박스 라벨 (작은 평면)
            const labelGeometry = new THREE.PlaneGeometry(boxSize * 0.8, boxSize * 0.3);
            const labelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const label = new THREE.Mesh(labelGeometry, labelMaterial);
            label.position.set(0, 0, boxSize / 2 + 0.01);
            boxGroup.add(label);

            // 박스 위치 설정 (90도 회전된 컨베이어 벨트 위)
            boxGroup.position.set(
                Math.random() * 0.6 - 0.3, // x축으로 약간 랜덤 (벨트 폭 내에서)
                0.3 + boxSize / 2, // 컨베이어 위
                -10 + i * 3.5 // z 위치를 다르게 배치 (벨트 방향)
            );

            this.boxes.push(boxGroup);
            this.scene.add(boxGroup);
        }
    }

    createWorkers() {
        const workerPositions = [
            { x: -3, z: -3 },
            { x: 3, z: 3 },
            { x: -3, z: 3 },
            { x: 3, z: -3 }
        ];

        workerPositions.forEach(pos => {
            this.createWorker(pos.x, pos.z);
        });
    }

    createWorker(x, z) {
        const worker = new THREE.Group();

        const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        worker.add(body);

        const headGeometry = new THREE.SphereGeometry(0.15);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB0 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.65;
        worker.add(head);

        const helmetGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.1);
        const helmetMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 1.75;
        worker.add(helmet);

        worker.position.set(x, 0, z);
        worker.userData = {
            walkDirection: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
            walkSpeed: 0.5 + Math.random() * 0.5
        };
        this.workers.push(worker);
        this.scene.add(worker);
    }

    createParticleSystem() {
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 20;
            positions[i3 + 1] = Math.random() * 6;
            positions[i3 + 2] = (Math.random() - 0.5) * 20;

            colors[i3] = Math.random();
            colors[i3 + 1] = Math.random();
            colors[i3 + 2] = Math.random();
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });

        this.particles = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.particles);
    }

    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 30;
    }

    setupBackground() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2C1810');
        gradient.addColorStop(0.5, '#4A2C17');
        gradient.addColorStop(1, '#1A0F0A');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const texture = new THREE.CanvasTexture(canvas);
        this.scene.background = texture;
    }

    update(delta) {
        if (this.controls) {
            this.controls.update();
        }

        this.machines.forEach(machine => {
            machine.userData.animationPhase += delta;

            if (machine.userData.type === 'assembler') {
                const arm = machine.children[1];
                if (arm) {
                    arm.rotation.y = Math.sin(machine.userData.animationPhase * 2) * 0.5;
                }
            } else if (machine.userData.type === 'welder') {
                machine.children.slice(1).forEach((spark, index) => {
                    spark.material.opacity = 0.5 + Math.sin(machine.userData.animationPhase * 5 + index) * 0.3;
                });
            } else if (machine.userData.type === 'printer') {
                const head = machine.children[1];
                if (head) {
                    head.position.x = Math.sin(machine.userData.animationPhase * 3) * 0.3;
                }
            }
        });

        this.workers.forEach(worker => {
            const speed = worker.userData.walkSpeed * delta;
            worker.position.add(worker.userData.walkDirection.clone().multiplyScalar(speed));

            if (Math.abs(worker.position.x) > 8 || Math.abs(worker.position.z) > 8) {
                worker.userData.walkDirection.multiplyScalar(-1);
            }

            if (Math.random() < 0.01) {
                worker.userData.walkDirection = new THREE.Vector3(
                    Math.random() - 0.5, 0, Math.random() - 0.5
                ).normalize();
            }
        });

        if (this.particles) {
            this.particles.rotation.y += delta * 0.1;
        }

        // 컨베이어 벨트 상자들 움직임
        this.boxes.forEach((box, index) => {
            box.position.z += 2 * delta; // 컨베이어가 세로(z축)로 회전했으므로 z축 이동
            // 상자가 끝에 도달하면 처음으로 이동
            if (box.position.z > 10) {
                box.position.z = -10;
            }

            // 상자 회전 애니메이션
            box.rotation.y += delta;
        });
    }

    cleanup() {
        if (this.controls) {
            this.controls.dispose();
        }
    }
}