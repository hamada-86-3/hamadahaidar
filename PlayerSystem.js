import * as THREE from 'three';

export class PlayerSystem {
    constructor(engine, sceneManager, gameState) {
        this.engine = engine;
        this.sceneManager = sceneManager;
        this.gameState = gameState;
        this.scene = engine.scene;
        
        // Player object
        this.mesh = null;
        this.camera = engine.camera;
        
        // Movement state
        this.position = new THREE.Vector3(0, 2, 0);
        this.velocity = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        // Physics
        this.gravity = 9.8;
        this.jumpForce = 5;
        this.moveSpeed = 5;
        this.dashSpeed = 15;
        this.dashDuration = 0.2;
        this.dashCooldown = 1;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        
        // Abilities
        canDoubleJump = false;
        hasDoubleJumped = false;
        canAirDash = false;
        wallRunning = false;
        
        // Combat
        this.attackCooldown = 0.5;
        this.attackTimer = 0;
        this.damageCooldown = 1;
        this.damageTimer = 0;
        
        // Visuals
        this.trail = [];
        this.trailLength = 10;
    }
    
    createPlayer() {
        // Create player group
        const group = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x44aaff,
            emissive: 0x224466,
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.75;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.4, 16);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xffaa44,
            emissive: 0x442200
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.7;
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);
        
        // Arms
        const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x44aaff });
        
        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.6, 1.2, 0);
        leftArm.rotation.z = 0.2;
        leftArm.castShadow = true;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.6, 1.2, 0);
        rightArm.rotation.z = -0.2;
        rightArm.castShadow = true;
        group.add(rightArm);
        
        // Energy aura
        const auraGeo = new THREE.SphereGeometry(0.8, 16);
        const auraMat = new THREE.MeshStandardMaterial({
            color: 0x44aaff,
            emissive: 0x224466,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        this.aura = new THREE.Mesh(auraGeo, auraMat);
        this.aura.position.y = 0.8;
        group.add(this.aura);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Position camera behind player
        this.cameraOffset = new THREE.Vector3(0, 2, 5);
    }
    
    update(deltaTime) {
        if (!this.mesh || this.gameState.isPaused) return;
        
        // Update timers
        this.dashTimer = Math.max(0, this.dashTimer - deltaTime);
        this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - deltaTime);
        this.attackTimer = Math.max(0, this.attackTimer - deltaTime);
        this.damageTimer = Math.max(0, this.damageTimer - deltaTime);
        
        // Handle input
        this.handleMovement(deltaTime);
        
        // Apply gravity
        this.applyGravity(deltaTime);
        
        // Update position
        this.mesh.position.x += this.velocity.x * deltaTime;
        this.mesh.position.y += this.velocity.y * deltaTime;
        this.mesh.position.z += this.velocity.z * deltaTime;
        
        // Update camera
        this.updateCamera();
        
        // Update visual effects
        this.updateEffects(deltaTime);
    }
    
    handleMovement(deltaTime) {
        if (this.dashTimer > 0) return; // Can't control during dash
        
        const moveDelta = new THREE.Vector3();
        
        if (this.moveForward) moveDelta.z -= 1;
        if (this.moveBackward) moveDelta.z += 1;
        if (this.moveLeft) moveDelta.x -= 1;
        if (this.moveRight) moveDelta.x += 1;
        
        if (moveDelta.length() > 0) {
            moveDelta.normalize();
            
            // Apply movement speed
            const speed = this.dashTimer > 0 ? this.dashSpeed : this.moveSpeed;
            this.velocity.x = moveDelta.x * speed;
            this.velocity.z = moveDelta.z * speed;
            
            // Rotate player to face movement direction
            const angle = Math.atan2(moveDelta.x, moveDelta.z);
            this.mesh.rotation.y = angle;
        } else {
            // Apply friction
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
        }
    }
    
    applyGravity(deltaTime) {
        if (!this.isGrounded()) {
            this.velocity.y -= this.gravity * deltaTime;
        } else {
            this.velocity.y = 0;
            this.hasDoubleJumped = false;
        }
    }
    
    isGrounded() {
        // Simple ground check - raycast down from player
        const rayStart = this.mesh.position.clone();
        const rayEnd = this.mesh.position.clone();
        rayEnd.y -= 1.0;
        
        // Placeholder - implement actual raycast
        return this.mesh.position.y <= 1.0;
    }
    
    jump() {
        if (!this.mesh || this.dashTimer > 0) return;
        
        if (this.isGrounded()) {
            this.velocity.y = this.jumpForce;
            this.particles.emitJump();
        } else if (this.canDoubleJump && !this.hasDoubleJumped) {
            this.velocity.y = this.jumpForce * 0.8;
            this.hasDoubleJumped = true;
            this.particles.emitDoubleJump();
        }
    }
    
    dash() {
        if (this.dashCooldownTimer > 0 || this.dashTimer > 0) return;
        
        this.dashTimer = this.dashDuration;
        this.dashCooldownTimer = this.dashCooldown;
        
        // Get dash direction from movement or facing direction
        const direction = new THREE.Vector3();
        if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
            if (this.moveForward) direction.z -= 1;
            if (this.moveBackward) direction.z += 1;
            if (this.moveLeft) direction.x -= 1;
            if (this.moveRight) direction.x += 1;
            direction.normalize();
        } else {
            // Dash forward
            direction.z = -1;
        }
        
        this.velocity.x = direction.x * this.dashSpeed;
        this.velocity.z = direction.z * this.dashSpeed;
        
        // Visual effects
        this.particles.emitDash();
        this.createTrail();
    }
    
    attack() {
        if (this.attackTimer > 0) return;
        
        this.attackTimer = this.attackCooldown;
        
        // Create attack visual
        this.particles.emitAttack(this.mesh.position, this.mesh.rotation.y);
        
        // Check hits (placeholder)
        this.checkAttackHits();
    }
    
    checkAttackHits() {
        // Placeholder for combat system
    }
    
    takeDamage(amount, source) {
        if (this.damageTimer > 0) return;
        
        this.gameState.player.health -= amount;
        this.damageTimer = this.damageCooldown;
        
        // Visual feedback
        this.particles.emitDamage();
        this.shaders.playDamageFlash();
        
        // Knockback
        const knockbackDir = this.mesh.position.clone().sub(source).normalize();
        this.velocity.x = knockbackDir.x * 5;
        this.velocity.z = knockbackDir.z * 5;
        this.velocity.y = 3;
        
        if (this.gameState.player.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.particles.emitDeath();
        this.gameState.player.health = 0;
        this.gameState.isPlaying = false;
        
        // Respawn after delay
        setTimeout(() => this.respawn(), 3000);
    }
    
    respawn() {
        this.mesh.position.set(0, 2, 0);
        this.velocity.set(0, 0, 0);
        this.gameState.player.health = this.gameState.player.maxHealth;
        this.gameState.isPlaying = true;
    }
    
    updateCamera() {
        // Third-person camera with smooth follow
        const targetPosition = this.mesh.position.clone().add(this.cameraOffset);
        
        // Smooth damping
        this.camera.position.lerp(targetPosition, 0.1);
        this.camera.lookAt(this.mesh.position);
    }
    
    updateEffects(deltaTime) {
        // Update aura
        this.aura.rotation.y += deltaTime;
        this.aura.scale.setScalar(1 + Math.sin(Date.now() * 0.01) * 0.1);
        
        // Update trail
        this.trail = this.trail.filter(point => {
            point.life -= deltaTime;
            if (point.life <= 0) {
                this.scene.remove(point.mesh);
                return false;
            }
            return true;
        });
    }
    
    createTrail() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const trailMesh = this.mesh.clone();
                trailMesh.material = this.mesh.material.clone();
                trailMesh.material.transparent = true;
                trailMesh.material.opacity = 0.5;
                trailMesh.position.copy(this.mesh.position);
                
                this.scene.add(trailMesh);
                this.trail.push({
                    mesh: trailMesh,
                    life: 0.5
                });
            }, i * 50);
        }
    }
    
    setMovement(x, y) {
        this.moveForward = y < -0.2;
        this.moveBackward = y > 0.2;
        this.moveLeft = x < -0.2;
        this.moveRight = x > 0.2;
    }
    
    useSkill(slot) {
        // Placeholder for skill system
        console.log(`Using skill ${slot}`);
    }
}