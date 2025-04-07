import * as THREE from 'three';
import {
    PLANE_SIZE,
    NUM_ROCKS,
    NUM_PLANTS,
    ROCK_DISTRIBUTION_FACTOR,
    DOWN_VECTOR
} from './Config.js';

// --- RockGenerator Class ---
class RockGenerator {
    constructor(scene, groundPlane) {
        if (!scene || !groundPlane) {
            throw new Error("RockGenerator requires scene and groundPlane instances.");
        }
        this.scene = scene;
        this.groundPlane = groundPlane;
        this.rocksPlaced = false;
        this.rockMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.85, metalness: 0.1 });
        this.raycaster = new THREE.Raycaster();
        console.log("[RockGenerator] Initialized inside World.");
    }

    placeRocksIfNeeded() {
        if (this.rocksPlaced) return;

        console.log("[RockGenerator] Placing rocks...");
        const rockDistributionRange = PLANE_SIZE * ROCK_DISTRIBUTION_FACTOR;
        let rocksAdded = 0;

        try {
            for (let i = 0; i < NUM_ROCKS; i++) {
                const randomX = (Math.random() - 0.5) * rockDistributionRange;
                const randomZ = (Math.random() - 0.5) * rockDistributionRange;
                this.raycaster.set(new THREE.Vector3(randomX, 50, randomZ), DOWN_VECTOR);
                const intersects = this.raycaster.intersectObject(this.groundPlane);

                if (intersects.length > 0) {
                    const groundY = intersects[0].point.y;
                    const rockRadius = 0.2 + Math.random() * 0.3;
                    const rockGeometry = new THREE.IcosahedronGeometry(rockRadius, 0);
                    const rockMesh = new THREE.Mesh(rockGeometry, this.rockMaterial);
                    rockMesh.position.set(randomX, groundY + rockRadius * 0.5, randomZ);
                    rockMesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
                    rockMesh.castShadow = true;
                    rockMesh.receiveShadow = true;
                    this.scene.add(rockMesh);
                    rocksAdded++;
                }
            }
            console.log(`[RockGenerator] Attempted ${NUM_ROCKS} rocks. Placed: ${rocksAdded}`);
            this.rocksPlaced = true;
        } catch (error) {
            console.error("[RockGenerator] Error placing rocks:", error);
        }
    }
}

// --- FloraGenerator Class ---
class FloraGenerator {
    constructor(scene, groundPlane) {
        if (!scene || !groundPlane) {
            throw new Error("FloraGenerator requires scene and groundPlane instances.");
        }
        this.scene = scene;
        this.groundPlane = groundPlane;
        this.floraPlaced = false;
        this.plantMaterial = new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 0.7, metalness: 0.0 });
        this.raycaster = new THREE.Raycaster();
        console.log("[FloraGenerator] Initialized inside World.");
    }

    placeFloraIfNeeded() {
        if (this.floraPlaced) return;

        console.log("[FloraGenerator] Placing flora...");
        const floraDistributionRange = PLANE_SIZE * ROCK_DISTRIBUTION_FACTOR; // Use same factor
        let floraAdded = 0;

        try {
            for (let i = 0; i < NUM_PLANTS; i++) {
                const randomX = (Math.random() - 0.5) * floraDistributionRange;
                const randomZ = (Math.random() - 0.5) * floraDistributionRange;
                this.raycaster.set(new THREE.Vector3(randomX, 50, randomZ), DOWN_VECTOR);
                const intersects = this.raycaster.intersectObject(this.groundPlane);

                if (intersects.length > 0) {
                    const groundY = intersects[0].point.y;
                    const plantHeight = 0.5 + Math.random() * 1.0;
                    const plantRadius = 0.1 + Math.random() * 0.15;
                    const plantGeometry = new THREE.ConeGeometry(plantRadius, plantHeight, 6);
                    const plantMesh = new THREE.Mesh(plantGeometry, this.plantMaterial);
                    plantMesh.position.set(randomX, groundY + plantHeight / 2, randomZ);
                    plantMesh.rotation.y = Math.random() * Math.PI * 2;
                    plantMesh.castShadow = true;
                    // plantMesh.receiveShadow = false;
                    this.scene.add(plantMesh);
                    floraAdded++;
                }
            }
            console.log(`[FloraGenerator] Attempted ${NUM_PLANTS} plants. Placed: ${floraAdded}`);
            this.floraPlaced = true;
        } catch (error) {
            console.error("[FloraGenerator] Error placing flora:", error);
        }
    }
}

// --- World Class (manages generators) ---
export class World {
    constructor(scene, groundPlane) {
        this.scene = scene;
        this.groundPlane = groundPlane;
        this.rockGenerator = new RockGenerator(scene, groundPlane);
        this.floraGenerator = new FloraGenerator(scene, groundPlane);
        this.initialized = false;
        console.log("[World] Initialized.");
    }

    // Call this after the first frame or two to allow ground plane geometry to settle
    initializeScenery() {
        if (this.initialized) return;
        this.rockGenerator.placeRocksIfNeeded();
        this.floraGenerator.placeFloraIfNeeded();
        this.initialized = true;
        console.log("[World] Scenery initialized (rocks & flora placed)." );
    }

    getGroundPlane() {
        return this.groundPlane;
    }

    // Update method (currently just calls initializeScenery once)
    update(deltaTime, frameCount) {
        // Initialize scenery after the first frame to ensure ground is ready
        if (frameCount > 1 && !this.initialized) {
            this.initializeScenery();
        }
        // Add any other world update logic here (e.g., dynamic scenery changes)
    }
} 