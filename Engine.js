import * as THREE from 'three';

export class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // Post-processing
        this.composer = null;
        this.effects = {};
    }
    
    async init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510);
        this.scene.fog = new THREE.FogExp2(0x050510, 0.002);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 15);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Lighting setup
        this.setupLights();
        
        // Performance optimizations
        if (window.innerWidth <= 768) {
            this.renderer.setPixelRatio(1);
            this.renderer.shadowMap.enabled = false;
        }
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffeedd, 1);
        sunLight.position.set(10, 20, 5);
        sunLight.castShadow = true;
        sunLight.receiveShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        const d = 30;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 50;
        sunLight.shadow.bias = -0.0001;
        this.scene.add(sunLight);
        
        // Fill lights
        const fillLight1 = new THREE.PointLight(0x4466ff, 0.5);
        fillLight1.position.set(-10, 5, 10);
        this.scene.add(fillLight1);
        
        const fillLight2 = new THREE.PointLight(0xff6644, 0.3);
        fillLight2.position.set(10, 5, -10);
        this.scene.add(fillLight2);
        
        // Dynamic lights for effects
        this.chaosLights = [];
        for (let i = 0; i < 3; i++) {
            const light = new THREE.PointLight(0xff00ff, 1, 20);
            light.visible = false;
            this.scene.add(light);
            this.chaosLights.push(light);
        }
    }
    
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    getDeltaTime() {
        return this.clock.getDelta();
    }
    
    addEffect(effect) {
        // Placeholder for post-processing effects
    }
}