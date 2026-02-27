import * as THREE from 'three';

export class WorldGenerator {
    constructor(sceneManager, particleSystem) {
        this.sceneManager = sceneManager;
        this.particles = particleSystem;
        this.scene = sceneManager.getScene();
        
        // Biomes
        this.biomes = {
            NEON_SKY: 'neonSky',
            LAVA_CORE: 'lavaCore',
            SHADOW_VOID: 'shadowVoid',
            COSMIC_ZERO: 'cosmicZero',
            CYBER_RUINS: 'cyberRuins'
        };
        
        this.currentBiome = this.biomes.NEON_SKY;
        this.platforms = [];
        this.decorations = [];
        this.collectibles = [];
        
        // Generation parameters
        this.worldSize = 100;
        this.platformCount = 50;
        this.difficulty = 1;
    }
    
    generateInitialWorld() {
        this.clearWorld();
        this.generateBiome(this.currentBiome);
        this.generatePlatforms();
        this.generateDecorations();
        this.generateCollectibles();
        this.setupLighting();
    }
    
    generateBiome(biome) {
        switch(biome) {
            case this.biomes.NEON_SKY:
                this.scene.background = new THREE.Color(0x87CEEB);
                this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.01);
                break;
                
            case this.biomes.LAVA_CORE:
                this.scene.background = new THREE.Color(0x441100);
                this.scene.fog = new THREE.FogExp2(0x441100, 0.02);
                break;
                
            case this.biomes.SHADOW_VOID:
                this.scene.background = new THREE.Color(0x000000);
                this.scene.fog = new THREE.FogExp2(0x000000, 0.005);
                break;
                
            case this.biomes.COSMIC_ZERO:
                this.scene.background = new THREE.Color(0x0a0a2a);
                this.scene.fog = new THREE.FogExp2(0x0a0a2a, 0.001);
                break;
                
            case this.biomes.CYBER_RUINS:
                this.scene.background = new THREE.Color(0x1a1a2e);
                this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015);
                break;
        }
    }
    
    generatePlatforms() {
        const colors = {
            neonSky: 0x44aaff,
            lavaCore: 0xff4400,
            shadowVoid: 0xaa88ff,
            cosmicZero: 0xffaa00,
            cyberRuins: 0x00ffaa
        };
        
        const color = colors[this.currentBiome] || 0xffffff;
        
        for (let i = 0; i < this.platformCount; i++) {
            // Create platform geometry
            const width = 3 + Math.random() * 4;
            const depth = 3 + Math.random() * 4;
            const geometry = new THREE.BoxGeometry(width, 0.5, depth);
            
            // Create material with biome-specific properties
            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: this.currentBiome === this.biomes.LAVA_CORE ? 0x331100 : 0x000000,
                metalness: 0.3,
                roughness: 0.4,
                emissiveIntensity: 0.2
            });
            
            const platform = new THREE.Mesh(geometry, material);
            
            // Random position within world bounds
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 30;
            platform.position.x = Math.cos(angle) * radius;
            platform.position.z = Math.sin(angle) * radius;
            platform.position.y = Math.random() * 15;
            
            // Random rotation
            platform.rotation.y = Math.random() * Math.PI;
            
            // Enable shadows
            platform.castShadow = true;
            platform.receiveShadow = true;
            
            // Add to scene and track
            this.scene.add(platform);
            this.platforms.push({
                mesh: platform,
                originalY: platform.position.y,
                floatSpeed: 0.5 + Math.random() * 0.5,
                floatOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    generateDecorations() {
        // Add floating crystals, pillars, etc based on biome
        for (let i = 0; i < 30; i++) {
            let geometry, material;
            
            switch(this.currentBiome) {
                case this.biomes.NEON_SKY:
                    geometry = new THREE.ConeGeometry(0.3, 1, 8);
                    material = new THREE.MeshStandardMaterial({
                        color: 0x44aaff,
                        emissive: 0x224466,
                        transparent: true,
                        opacity: 0.8
                    });
                    break;
                    
                case this.biomes.LAVA_CORE:
                    geometry = new THREE.OctahedronGeometry(0.5);
                    material = new THREE.MeshStandardMaterial({
                        color: 0xff5500,
                        emissive: 0x442200,
                        emissiveIntensity: 0.5
                    });
                    break;
                    
                default:
                    geometry = new THREE.BoxGeometry(0.5, 2, 0.5);
                    material = new THREE.MeshStandardMaterial({
                        color: 0x88aaff,
                        emissive: 0x112233
                    });
            }
            
            const decoration = new THREE.Mesh(geometry, material);
            
            // Position near platforms
            const platform = this.platforms[Math.floor(Math.random() * this.platforms.length)].mesh;
            decoration.position.copy(platform.position);
            decoration.position.x += (Math.random() - 0.5) * 2;
            decoration.position.z += (Math.random() - 0.5) * 2;
            decoration.position.y += 0.5;
            
            decoration.castShadow = true;
            decoration.receiveShadow = true;
            
            this.scene.add(decoration);
            this.decorations.push(decoration);
        }
    }
    
    generateCollectibles() {
        // Energy orbs that player can collect
        const orbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const orbMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0x442200,
            emissiveIntensity: 0.8
        });
        
        for (let i = 0; i < 20; i++) {
            const orb = new THREE.Mesh(orbGeometry, orbMaterial);
            
            // Place near platforms
            const platform = this.platforms[Math.floor(Math.random() * this.platforms.length)].mesh;
            orb.position.copy(platform.position);
            orb.position.y += 1.5;
            
            orb.castShadow = true;
            
            this.scene.add(orb);
            this.collectibles.push({
                mesh: orb,
                collected: false,
                respawnTime: 0
            });
        }
    }
    
    setupLighting() {
        // Add biome-specific lights
        switch(this.currentBiome) {
            case this.biomes.NEON_SKY:
                this.addPointLight(0x44aaff, 1, 10, 5);
                break;
                
            case this.biomes.LAVA_CORE:
                this.addPointLight(0xff4400, 2, 15, 5);
                break;
                
            case this.biomes.COSMIC_ZERO:
                this.addPointLight(0xaa88ff, 1.5, 20, 5);
                break;
        }
    }
    
    addPointLight(color, intensity, distance, count) {
        for (let i = 0; i < count; i++) {
            const light = new THREE.PointLight(color, intensity, distance);
            light.position.set(
                (Math.random() - 0.5) * 40,
                Math.random() * 20,
                (Math.random() - 0.5) * 40
            );
            this.scene.add(light);
        }
    }
    
    update(deltaTime) {
        // Animate floating platforms
        this.platforms.forEach(platform => {
            platform.mesh.position.y = platform.originalY + 
                Math.sin(Date.now() * 0.001 * platform.floatSpeed + platform.floatOffset) * 0.5;
        });
        
        // Rotate decorations
        this.decorations.forEach(decoration => {
            decoration.rotation.y += deltaTime * 0.5;
        });
        
        // Animate collectibles
        this.collectibles.forEach(collectible => {
            if (!collectible.collected) {
                collectible.mesh.rotation.y += deltaTime * 2;
                collectible.mesh.position.y += Math.sin(Date.now() * 0.005) * 0.01;
            }
        });
    }
    
    mutateWorld(chaosType) {
        // Apply chaos mutation to world
        switch(chaosType) {
            case 'GRAVITY_FLIP':
                this.platforms.forEach(p => p.mesh.position.y = -p.mesh.position.y);
                break;
                
            case 'PLATFORM_COLLAPSE':
                // Remove random platforms
                const toRemove = Math.floor(this.platforms.length * 0.3);
                for (let i = 0; i < toRemove; i++) {
                    if (this.platforms.length > 10) {
                        const index = Math.floor(Math.random() * this.platforms.length);
                        this.scene.remove(this.platforms[index].mesh);
                        this.platforms.splice(index, 1);
                    }
                }
                break;
                
            case 'LAVA_RISE':
                // Add lava effect
                this.particles.emitLava();
                break;
        }
    }
    
    clearWorld() {
        this.platforms.forEach(p => this.scene.remove(p.mesh));
        this.decorations.forEach(d => this.scene.remove(d));
        this.collectibles.forEach(c => this.scene.remove(c.mesh));
        
        this.platforms = [];
        this.decorations = [];
        this.collectibles = [];
    }
}