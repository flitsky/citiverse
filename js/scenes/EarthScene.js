class EarthScene {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.controls = null;
        this.earth = null;
        this.atmosphere = null;
    }
    
    init() {
        this.setupCamera();
        this.setupLights();
        this.createEarth();
        this.createAtmosphere();
        this.setupControls();
        this.setupBackground();
    }
    
    setupCamera() {
        this.camera.position.set(0, 0, 3);
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x202040, 0.2);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 2);
        sunLight.position.set(-5, 3, 5);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
        
        const rimLight = new THREE.DirectionalLight(0x88ccff, 0.5);
        rimLight.position.set(5, 0, -5);
        this.scene.add(rimLight);
    }
    
    createEarth() {
        const geometry = new THREE.SphereGeometry(1, 128, 64);
        
        const textureLoader = new THREE.TextureLoader();
        
        const dayTexture = textureLoader.load('textures/2k_earth_daymap.jpg');
        const nightTexture = textureLoader.load('textures/2k_earth_nightmap.jpg');
        const cloudsTexture = textureLoader.load('textures/2k_earth_clouds.jpg');
        const normalTexture = textureLoader.load('textures/2k_earth_normal_map.tif');
        const specularTexture = textureLoader.load('textures/2k_earth_specular_map.tif');
        
        dayTexture.wrapS = dayTexture.wrapT = THREE.RepeatWrapping;
        nightTexture.wrapS = nightTexture.wrapT = THREE.RepeatWrapping;
        cloudsTexture.wrapS = cloudsTexture.wrapT = THREE.RepeatWrapping;
        normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
        specularTexture.wrapS = specularTexture.wrapT = THREE.RepeatWrapping;
        
        const earthMaterial = new THREE.ShaderMaterial({
            uniforms: {
                dayTexture: { value: dayTexture },
                nightTexture: { value: nightTexture },
                cloudsTexture: { value: cloudsTexture },
                normalMap: { value: normalTexture },
                specularMap: { value: specularTexture },
                lightDirection: { value: new THREE.Vector3(-1, 0, 1).normalize() },
                time: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * vec4(vPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D dayTexture;
                uniform sampler2D nightTexture;
                uniform sampler2D cloudsTexture;
                uniform sampler2D normalMap;
                uniform sampler2D specularMap;
                uniform vec3 lightDirection;
                uniform float time;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vec3 dayColor = texture2D(dayTexture, vUv).rgb;
                    vec3 nightColor = texture2D(nightTexture, vUv).rgb;
                    vec3 clouds = texture2D(cloudsTexture, vUv).rgb;
                    vec3 normal = normalize(vNormal);
                    
                    float lightIntensity = max(0.0, dot(normal, normalize(lightDirection)));
                    float dayNightMix = smoothstep(0.0, 0.3, lightIntensity);
                    
                    vec3 earthColor = mix(nightColor * 2.0, dayColor, dayNightMix);
                    
                    vec2 cloudUv = vUv + vec2(time * 0.00003, 0.0);
                    vec3 cloudColor = texture2D(cloudsTexture, cloudUv).rgb;
                    earthColor = mix(earthColor, cloudColor, cloudColor.r * 0.5);
                    
                    vec3 viewDirection = normalize(-vPosition);
                    vec3 reflectionDirection = reflect(-lightDirection, normal);
                    float specular = pow(max(0.0, dot(viewDirection, reflectionDirection)), 32.0);
                    
                    vec3 specularColor = texture2D(specularMap, vUv).rgb;
                    earthColor += specularColor * specular * lightIntensity * 0.5;
                    
                    float fresnel = 1.0 - dot(normal, viewDirection);
                    fresnel = pow(fresnel, 2.0);
                    earthColor = mix(earthColor, vec3(0.3, 0.6, 1.0), fresnel * 0.1);
                    
                    gl_FragColor = vec4(earthColor, 1.0);
                }
            `
        });
        
        this.earth = new THREE.Mesh(geometry, earthMaterial);
        this.scene.add(this.earth);
    }
    
    
    createAtmosphere() {
        const geometry = new THREE.SphereGeometry(1.025, 64, 32);
        
        const atmosphereMaterial = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.BackSide,
            uniforms: {
                time: { value: 0.0 },
                lightDirection: { value: new THREE.Vector3(-1, 0, 1).normalize() }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * vec4(vPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 lightDirection;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDirection = normalize(-vPosition);
                    
                    float fresnel = 1.0 - abs(dot(normal, viewDirection));
                    fresnel = pow(fresnel, 1.5);
                    
                    float lightIntensity = max(0.0, dot(normal, normalize(lightDirection)));
                    
                    vec3 atmosphereColor = mix(
                        vec3(0.2, 0.4, 0.8), 
                        vec3(0.8, 0.6, 0.3), 
                        lightIntensity
                    );
                    
                    float opacity = fresnel * (0.3 + lightIntensity * 0.2);
                    
                    gl_FragColor = vec4(atmosphereColor, opacity);
                }
            `
        });
        
        this.atmosphere = new THREE.Mesh(geometry, atmosphereMaterial);
        this.scene.add(this.atmosphere);
    }
    
    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 10;
    }
    
    setupBackground() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(1, '#000000');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2;
            ctx.fillRect(x, y, size, size);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        this.scene.background = texture;
    }
    
    update(delta) {
        if (this.controls) {
            this.controls.update();
        }
        
        if (this.earth) {
            this.earth.rotation.y += delta * 0.1;
            
            if (this.earth.material.uniforms && this.earth.material.uniforms.time) {
                this.earth.material.uniforms.time.value += delta * 1000;
            }
        }
        
        if (this.atmosphere) {
            this.atmosphere.rotation.y += delta * 0.05;
            
            if (this.atmosphere.material.uniforms && this.atmosphere.material.uniforms.time) {
                this.atmosphere.material.uniforms.time.value += delta * 1000;
            }
        }
    }
    
    cleanup() {
        if (this.controls) {
            this.controls.dispose();
        }
    }
}