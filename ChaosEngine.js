export class ChaosEngine {
    constructor(sceneManager, shaderEffects, particleSystem) {
        this.sceneManager = sceneManager;
        this.shaders = shaderEffects;
        this.particles = particleSystem;
        
        this.active = false;
        this.timeUntilNextChaos = 20; // seconds
        this.chaosTimer = 20;
        this.chaosCount = 0;
        
        // Chaos effects
        this.chaosEffects = [
            'GRAVITY_FLIP',
            'ROTATION_90',
            'PLATFORM_COLLAPSE',
            'RISING_LAVA',
            'TIME_FREEZE',
            'SHADOW_INVASION',
            'REALITY_DISTORT',
            'CHAOS_STORM',
            'LOW_GRAVITY',
            'MIRROR_DIMENSION'
        ];
        
        // Event callbacks
        this.onChaosStart = null;
        this.onChaosEnd = null;
    }
    
    start() {
        this.active = true;
        this.chaosTimer = this.timeUntilNextChaos;
    }
    
    stop() {
        this.active = false;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.chaosTimer -= deltaTime;
        
        if (this.chaosTimer <= 0) {
            this.triggerChaos();
            this.chaosTimer = this.timeUntilNextChaos;
            this.chaosCount++;
        }
    }
    
    triggerChaos() {
        // Select random chaos effect
        const effect = this.chaosEffects[Math.floor(Math.random() * this.chaosEffects.length)];
        
        // Cinematic effects
        this.shaders.playGlitchEffect(500);
        this.particles.emitChaosBurst();
        
        // Camera shake
        this.sceneManager.shakeCamera(0.5, 0.3);
        
        // Trigger sound (placeholder)
        this.playChaosSound(effect);
        
        // Apply chaos effect
        this.applyChaosEffect(effect);
        
        // Notify listeners
        if (this.onChaosStart) {
            this.onChaosStart(effect);
        }
        
        console.log(`🌪️ CHAOS TRIGGERED: ${effect}`);
    }
    
    applyChaosEffect(effect) {
        const worldGen = this.sceneManager.worldGenerator;
        
        switch(effect) {
            case 'GRAVITY_FLIP':
                this.sceneManager.setGravity(-9.8);
                setTimeout(() => this.sceneManager.setGravity(9.8), 5000);
                break;
                
            case 'ROTATION_90':
                this.sceneManager.rotateWorld(90);
                break;
                
            case 'PLATFORM_COLLAPSE':
                if (worldGen) worldGen.mutateWorld('PLATFORM_COLLAPSE');
                break;
                
            case 'RISING_LAVA':
                this.particles.emitLava();
                this.sceneManager.setAmbientColor(0xff3300);
                break;
                
            case 'TIME_FREEZE':
                this.sceneManager.setTimeScale(0.1);
                setTimeout(() => this.sceneManager.setTimeScale(1), 3000);
                break;
                
            case 'SHADOW_INVASION':
                this.particles.emitDarkness();
                break;
                
            case 'REALITY_DISTORT':
                this.shaders.enableDistortion();
                setTimeout(() => this.shaders.disableDistortion(), 4000);
                break;
                
            case 'CHAOS_STORM':
                this.particles.emitStorm();
                break;
                
            case 'LOW_GRAVITY':
                this.sceneManager.setGravity(2.0);
                setTimeout(() => this.sceneManager.setGravity(9.8), 8000);
                break;
                
            case 'MIRROR_DIMENSION':
                this.sceneManager.enableMirrorMode();
                setTimeout(() => this.sceneManager.disableMirrorMode(), 6000);
                break;
        }
    }
    
    playChaosSound(effect) {
        // Placeholder for sound system
        console.log(`🔊 Playing chaos sound: ${effect}`);
    }
    
    getTimeUntilNextChaos() {
        return Math.max(0, Math.ceil(this.chaosTimer));
    }
    
    getChaosCount() {
        return this.chaosCount;
    }
}