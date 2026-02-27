import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { SceneManager } from './core/SceneManager.js';
import { GameState } from './core/GameState.js';
import { PlayerSystem } from './systems/PlayerSystem.js';
import { WorldGenerator } from './systems/WorldGenerator.js';
import { ChaosEngine } from './systems/ChaosEngine.js';
import { EnemyAI } from './systems/EnemyAI.js';
import { MultiplayerSystem } from './systems/MultiplayerSystem.js';
import { UISystem } from './systems/UISystem.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { ParticleSystem } from './effects/ParticleSystem.js';
import { ShaderEffects } from './effects/ShaderEffects.js';
import { Performance } from './utils/Performance.js';

class Game {
    constructor() {
        this.initialized = false;
        this.engine = null;
        this.sceneManager = null;
        this.gameState = null;
        this.player = null;
        this.worldGen = null;
        this.chaosEngine = null;
        this.enemyAI = null;
        this.multiplayer = null;
        this.ui = null;
        this.saveSystem = null;
        this.particles = null;
        this.shaders = null;
        this.performance = null;
        
        // Bind methods
        this.startGame = this.startGame.bind(this);
        this.showSkillTree = this.showSkillTree.bind(this);
        this.showStore = this.showStore.bind(this);
        this.showSettings = this.showSettings.bind(this);
        this.closePanels = this.closePanels.bind(this);
        
        // Expose to window for button callbacks
        window.game = this;
    }
    
    async init() {
        try {
            console.log('🎮 Initializing HAMADA HAIDER - CHAOS DIMENSION');
            
            // Initialize performance monitor
            this.performance = new Performance();
            
            // Initialize core engine
            this.engine = new Engine('game-canvas');
            await this.engine.init();
            
            // Initialize systems
            this.sceneManager = new SceneManager(this.engine);
            this.gameState = new GameState();
            this.saveSystem = new SaveSystem();
            this.ui = new UISystem();
            this.particles = new ParticleSystem(this.engine);
            this.shaders = new ShaderEffects(this.engine);
            
            // Load saved data
            const savedData = this.saveSystem.load();
            if (savedData) {
                this.gameState.load(savedData);
            }
            
            // Initialize game systems
            this.worldGen = new WorldGenerator(this.sceneManager, this.particles);
            this.chaosEngine = new ChaosEngine(this.sceneManager, this.shaders, this.particles);
            this.player = new PlayerSystem(this.engine, this.sceneManager, this.gameState);
            this.enemyAI = new EnemyAI(this.sceneManager, this.player, this.gameState);
            
            // Initialize multiplayer (placeholder)
            if (this.gameState.multiplayerEnabled) {
                this.multiplayer = new MultiplayerSystem(this.player, this.gameState);
                await this.multiplayer.init();
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Hide preloader with cinematic effect
            await this.cinematicIntro();
            
            this.initialized = true;
            console.log('✅ Game initialized successfully');
            
            // Start game loop
            this.gameLoop();
            
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            this.showError(error);
        }
    }
    
    async cinematicIntro() {
        const preloader = document.getElementById('preloader');
        const uiOverlay = document.getElementById('ui-overlay');
        
        // APOHAIDAR logo animation
        await this.shaders.playGlitchEffect(2000);
        
        // Cinematic camera flythrough
        await this.sceneManager.cinematicFlythrough();
        
        // Hide preloader with fade
        preloader.style.opacity = '0';
        await this.delay(1000);
        preloader.style.display = 'none';
        
        // Show UI with animation
        uiOverlay.classList.remove('ui-hidden');
        
        // Play intro narration
        this.ui.showNarration('Reality is collapsing...', 3000);
        await this.delay(3000);
        this.ui.showNarration('You must adapt to survive', 3000);
    }
    
    setupEventListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mobile controls
        this.setupMobileControls();
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Performance mode toggle
        document.getElementById('performance-toggle')?.addEventListener('click', () => {
            this.performance.toggleMode();
            this.ui.updatePerformanceToggle();
        });
        
        // Particle toggle
        document.getElementById('particle-toggle')?.addEventListener('click', () => {
            this.particles.toggle();
            this.ui.updateParticleToggle();
        });
        
        // Volume controls
        document.getElementById('music-volume')?.addEventListener('input', (e) => {
            this.gameState.settings.musicVolume = e.target.value / 100;
        });
        
        document.getElementById('sfx-volume')?.addEventListener('input', (e) => {
            this.gameState.settings.sfxVolume = e.target.value / 100;
        });
    }
    
    setupMobileControls() {
        const joystick = document.getElementById('joystick-handle');
        const jumpBtn = document.getElementById('jump-btn');
        const dashBtn = document.getElementById('dash-btn');
        const attackBtn = document.getElementById('attack-btn');
        
        if (joystick) {
            let dragging = false;
            const base = document.getElementById('joystick-base');
            const baseRect = base.getBoundingClientRect();
            const maxDistance = 40;
            
            joystick.addEventListener('touchstart', (e) => {
                dragging = true;
                e.preventDefault();
            });
            
            document.addEventListener('touchmove', (e) => {
                if (!dragging) return;
                e.preventDefault();
                
                const touch = e.touches[0];
                const rect = base.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                let deltaX = touch.clientX - centerX;
                let deltaY = touch.clientY - centerY;
                
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                if (distance > maxDistance) {
                    deltaX = (deltaX / distance) * maxDistance;
                    deltaY = (deltaY / distance) * maxDistance;
                }
                
                joystick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                
                // Update player movement
                this.player.setMovement(
                    deltaX / maxDistance,
                    deltaY / maxDistance
                );
            });
            
            document.addEventListener('touchend', () => {
                dragging = false;
                joystick.style.transform = 'translate(0, 0)';
                this.player.setMovement(0, 0);
            });
        }
        
        // Action buttons
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.player.jump();
            });
        }
        
        if (dashBtn) {
            dashBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.player.dash();
            });
        }
        
        if (attackBtn) {
            attackBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.player.attack();
            });
        }
    }
    
    handleKeyDown(e) {
        if (!this.initialized) return;
        
        switch(e.code) {
            case 'KeyW': this.player.moveForward = true; break;
            case 'KeyS': this.player.moveBackward = true; break;
            case 'KeyA': this.player.moveLeft = true; break;
            case 'KeyD': this.player.moveRight = true; break;
            case 'Space': 
                e.preventDefault();
                this.player.jump(); 
                break;
            case 'ShiftLeft':
                this.player.dash();
                break;
            case 'KeyQ':
                this.player.useSkill(1);
                break;
            case 'KeyE':
                this.player.useSkill(2);
                break;
            case 'KeyR':
                this.player.useSkill(3);
                break;
            case 'Escape':
                this.togglePause();
                break;
        }
    }
    
    handleKeyUp(e) {
        if (!this.initialized) return;
        
        switch(e.code) {
            case 'KeyW': this.player.moveForward = false; break;
            case 'KeyS': this.player.moveBackward = false; break;
            case 'KeyA': this.player.moveLeft = false; break;
            case 'KeyD': this.player.moveRight = false; break;
        }
    }
    
    handleResize() {
        if (this.engine) {
            this.engine.handleResize();
        }
    }
    
    gameLoop() {
        if (!this.initialized) return;
        
        // Calculate delta time
        const deltaTime = this.performance.getDeltaTime();
        
        // Update systems
        this.player.update(deltaTime);
        this.enemyAI.update(deltaTime);
        this.chaosEngine.update(deltaTime);
        this.particles.update(deltaTime);
        
        // Update UI
        this.ui.updateStats({
            health: this.gameState.player.health,
            maxHealth: this.gameState.player.maxHealth,
            energy: this.gameState.player.energy,
            maxEnergy: this.gameState.player.maxEnergy,
            xp: this.gameState.player.xp,
            nextLevelXp: this.gameState.player.nextLevelXp,
            chaosTimer: this.chaosEngine.getTimeUntilNextChaos()
        });
        
        // Render scene
        this.engine.render();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    startGame() {
        document.getElementById('main-menu').classList.add('hidden');
        this.gameState.isPlaying = true;
        this.chaosEngine.start();
        this.worldGen.generateInitialWorld();
        this.ui.showMessage('WELCOME TO CHAOS DIMENSION', 2000);
    }
    
    showSkillTree() {
        document.getElementById('main-menu').classList.add('hidden');
        const panel = document.getElementById('skill-tree-panel');
        panel.classList.remove('hidden');
        this.ui.renderSkillTree(this.gameState.player.skills);
    }
    
    showStore() {
        document.getElementById('main-menu').classList.add('hidden');
        const panel = document.getElementById('store-panel');
        panel.classList.remove('hidden');
        this.ui.renderStore(this.gameState.player.unlockedItems);
    }
    
    showSettings() {
        document.getElementById('main-menu').classList.add('hidden');
        const panel = document.getElementById('settings-panel');
        panel.classList.remove('hidden');
        this.ui.updateSettingsUI(this.gameState.settings);
    }
    
    closePanels() {
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.add('hidden');
        });
        document.getElementById('main-menu').classList.remove('hidden');
    }
    
    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        this.ui.showPauseMenu(this.gameState.isPaused);
    }
    
    showError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 2000;
        `;
        errorDiv.textContent = `Failed to load game: ${error.message}`;
        document.body.appendChild(errorDiv);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});