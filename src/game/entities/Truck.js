import * as THREE from 'three';
import {
    TRUCK_CONSTANTS,
    WHEEL_CONSTANTS,
    MODEL_GROUND_OFFSET,
    DOWN_VECTOR
} from '../Config.js';

export class Truck {
    constructor(scene, inputManager, groundPlane, initialModels) {
        this.scene = scene;
        this.inputManager = inputManager;
        this.groundPlane = groundPlane;

        // Models are now passed in after loading (or placeholder creation)
        this.lowPolyTruckGroup = initialModels.lowPoly;
        this.gltfTruckModel = initialModels.gltf;

        this.isShowingLowPoly = true;
        this.activeTruckObject = null; // Set in _setupModels

        // State variables
        this.wheelMeshes = []; // References to wheel spinner groups
        this.frontWheelMeshes = []; // References to front wheel steering containers
        this.currentSteeringAngle = 0;
        this.targetSteeringAngle = 0;

        // Utilities
        this.raycaster = new THREE.Raycaster();

        this._setupModels();
        console.log("[Truck] Initialized.");
    }

    _setupModels() {
        if (!this.lowPolyTruckGroup) {
            console.error("[Truck] Low-poly model is missing!");
             // Optionally create a fallback here if AssetLoader didn't provide one
             this.lowPolyTruckGroup = new THREE.Group(); // Empty group as fallback
        } else {
            // Assume low-poly creation function populates wheelMeshes/frontWheelMeshes
            // This needs to be refactored if low-poly is loaded externally
            this._findAndStoreWheels(this.lowPolyTruckGroup); 
            this.lowPolyTruckGroup.visible = this.isShowingLowPoly;
            this.scene.add(this.lowPolyTruckGroup);
        }

        if (this.gltfTruckModel) {
            // Apply standard transformations/settings if loaded
            this.gltfTruckModel.scale.set(0.5, 0.5, 0.5);
            this.gltfTruckModel.position.set(0, 0, 0);
             this.gltfTruckModel.traverse((child) => {
                 if (child.isMesh) {
                     child.castShadow = true;
                     child.receiveShadow = true;
                 }
             });
            this.gltfTruckModel.visible = !this.isShowingLowPoly;
            this.scene.add(this.gltfTruckModel);
        }

        // Set the initial active object reference AFTER potentially adding models to scene
        this.activeTruckObject = this.isShowingLowPoly ? this.lowPolyTruckGroup : this.gltfTruckModel;
        if (!this.activeTruckObject) { // Fallback if GLTF was missing and low-poly failed
            this.activeTruckObject = this.lowPolyTruckGroup; // Use the (possibly empty) group
            console.warn("[Truck] No valid active model found initially, using low-poly group.");
        }

        // No longer call adjustToGround here, do it externally after creation
        // this._adjustToGround(0.1); // Initial ground adjustment
    }

     // Helper to find wheel meshes (adjust names if needed)
     _findAndStoreWheels(modelGroup) {
        this.wheelMeshes = [];
        this.frontWheelMeshes = [];
        modelGroup.traverse((child) => {
             if (child.isGroup) {
                 // Assuming names are set during creation or loading
                 if (child.name === 'wheelSpinnerGroup') {
                     this.wheelMeshes.push(child);
                 }
                 if (child.name === 'frontWheelContainer') {
                     this.frontWheelMeshes.push(child);
                 }
             }
         });
         console.log(`[Truck] Found ${this.wheelMeshes.length} wheel spinners and ${this.frontWheelMeshes.length} front wheel containers.`);
     }

    switchModel() {
        if (!this.lowPolyTruckGroup && !this.gltfTruckModel) {
            console.warn("[Truck] Cannot switch model: Neither model is available.");
            return;
        }
        if (!this.gltfTruckModel) {
            console.warn("[Truck] Cannot switch to GLTF model: Not loaded.");
            // Optionally prevent switching or just stay on low-poly
            if (!this.isShowingLowPoly) this.isShowingLowPoly = true; // Force back to low-poly
            return; 
        }
         if (!this.lowPolyTruckGroup) {
            console.warn("[Truck] Cannot switch to low-poly model: Not available.");
            if (this.isShowingLowPoly) this.isShowingLowPoly = false; // Force back to GLTF
            return;
        }

        // Store current transform
        const currentPosition = new THREE.Vector3();
        const currentRotation = new THREE.Euler();
        if (this.activeTruckObject) {
            currentPosition.copy(this.activeTruckObject.position);
            currentRotation.copy(this.activeTruckObject.rotation);
        } // Else defaults to 0,0,0

        // Toggle state
        this.isShowingLowPoly = !this.isShowingLowPoly;

        // Update visibility
        if (this.lowPolyTruckGroup) this.lowPolyTruckGroup.visible = this.isShowingLowPoly;
        if (this.gltfTruckModel) this.gltfTruckModel.visible = !this.isShowingLowPoly;

        // Update active object reference
        this.activeTruckObject = this.isShowingLowPoly ? this.lowPolyTruckGroup : this.gltfTruckModel;

        // Reapply transform
        this.activeTruckObject.position.copy(currentPosition);
        this.activeTruckObject.rotation.copy(currentRotation);
        // Reset steering only when switching TO low-poly model
        if (this.isShowingLowPoly) {
            this.targetSteeringAngle = 0;
            this.currentSteeringAngle = 0;
            this.frontWheelMeshes.forEach(wheelGroup => { wheelGroup.rotation.y = 0; });
        }

        console.log(`[Truck] Switched model. Showing low-poly: ${this.isShowingLowPoly}`);
    }

    update(deltaTime) {
        if (!this.activeTruckObject) return;

        const steeringInput = this.inputManager.getSteeringInput();
        const movementInput = this.inputManager.getMovementInput();
        const tc = TRUCK_CONSTANTS;
        const wc = WHEEL_CONSTANTS;

        // --- Steering --- 
        if (this.isShowingLowPoly) { // Only steer low-poly wheels visually for now
            this.targetSteeringAngle = steeringInput * wc.MAX_STEERING_ANGLE;
            // Smooth steering interpolation
            const steerLerpFactor = 1.0 - Math.exp(-wc.STEERING_SPEED * deltaTime * 5); // Faster lerp
            this.currentSteeringAngle += (this.targetSteeringAngle - this.currentSteeringAngle) * steerLerpFactor;
            
            // Apply steering rotation to front wheel containers
            this.frontWheelMeshes.forEach(wheelGroup => {
                wheelGroup.rotation.y = this.currentSteeringAngle;
            });
        }

        // --- Body Rotation (Turn) --- 
        // Apply turning rotation based on steering input and movement
        // Only turn when moving forward or backward to simulate car physics better
        if (movementInput !== 0) {
             // Use currentSteeringAngle for smooth turning
            const rotateAngle = -this.currentSteeringAngle * tc.ROTATE_SPEED * deltaTime * Math.sign(movementInput); 
            this.activeTruckObject.rotation.y += rotateAngle;
        }

        // --- Movement --- 
        const moveDistance = movementInput * tc.MOVE_SPEED * deltaTime;
        if (moveDistance !== 0) {
            // Get forward vector based on current body rotation
            // Corrected forward vector assuming model's forward is -X (Changed from +X)
            const forward = new THREE.Vector3(-1, 0, 0); // <--- Changed from (1, 0, 0)
            // Adjust this vector based on how your model is oriented.
            // If forward is -X in the model file, use: const forward = new THREE.Vector3(-1, 0, 0); 
            forward.applyQuaternion(this.activeTruckObject.quaternion);
            
            // Move the truck
            this.activeTruckObject.position.addScaledVector(forward, moveDistance);

            // --- Wheel Rotation (Spin) --- 
            // Only spin low-poly wheels visually
            if (this.isShowingLowPoly && this.wheelMeshes.length > 0) {
                const wheelCircumference = 2 * Math.PI * wc.RADIUS;
                if (wheelCircumference > 0) { // Avoid division by zero
                    const rotationChange = (moveDistance / wheelCircumference) * Math.PI * 2;
                    
                    // Rotate wheel spinner groups around their local Z axis (assuming Z is the axle)
                     this.wheelMeshes.forEach(spinnerGroup => {
                         // Check axis - might need to be rotation.x or rotation.y depending on model export/setup
                         spinnerGroup.rotation.z += rotationChange; 
                     });
                }
            }
        }

        // --- Ground Adjustment --- 
        // Adjust if moving or turning significantly
        if (movementInput !== 0 || Math.abs(steeringInput) > 0.1) {
            this._adjustToGround(deltaTime);
        }
    }

    _adjustToGround(deltaTime) {
        if (!this.activeTruckObject || !this.groundPlane) return;
        
        try {
            // Determine the correct offset based on the active model
             const currentOffset = this.isShowingLowPoly 
                 ? WHEEL_CONSTANTS.RADIUS // Use wheel radius for low-poly 
                 : MODEL_GROUND_OFFSET; // Use fixed offset for GLTF (adjust as needed)

            const rayOrigin = this.activeTruckObject.position.clone();
            rayOrigin.y += 10; // Start raycast from above the truck

            this.raycaster.set(rayOrigin, DOWN_VECTOR);
            const intersects = this.raycaster.intersectObject(this.groundPlane);

            if (intersects.length > 0) {
                const groundY = intersects[0].point.y;
                const targetY = groundY + currentOffset;
                
                // Smoothly interpolate the truck's Y position
                 const lerpFactor = Math.min(1.0, deltaTime * 10.0); // Adjust lerp speed as needed
                this.activeTruckObject.position.y += (targetY - this.activeTruckObject.position.y) * lerpFactor;
            }
        } catch (error) {
            console.error("[Truck] Error during ground adjustment:", error);
        }
    }

    // --- Method to explicitly set the truck's position ---
    setPosition(x, y, z) {
        if (this.activeTruckObject) {
            this.activeTruckObject.position.set(x, y, z);
        } else {
            console.warn("[Truck] Tried to setPosition, but no activeTruckObject exists yet.");
            // Optionally queue the position to be set later if needed
        }
    }

    // --- Getters --- 
    getPosition() {
        return this.activeTruckObject ? this.activeTruckObject.position.clone() : new THREE.Vector3();
    }

    getQuaternion() {
        return this.activeTruckObject ? this.activeTruckObject.quaternion.clone() : new THREE.Quaternion();
    }

     // --- Low Poly Model Creation (Keep for now, maybe move to separate factory later) ---
     static createLowPolyModel() {
         console.log("[Truck] Creating static low-poly model...");
         const truckRoot = new THREE.Group();
         truckRoot.name = "lowPolyTruckRoot"; // Name for identification

         // Set base height based on the standard wheel radius
         // truckRoot.position.y = WHEEL_CONSTANTS.RADIUS; // Position set by Truck class

         const materials = {
             body: new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.4, metalness: 0.6 }),
             detail: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6, metalness: 0.4 }),
             cabinTop: new THREE.MeshStandardMaterial({ color: 0x88AABB, roughness: 0.7, metalness: 0.2 }),
             wheelTire: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9, metalness: 0.1 }),
             wheelHub: new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.5, metalness: 0.5 }),
             lightFront: new THREE.MeshBasicMaterial({ color: 0xFFFFDD }),
             lightRear: new THREE.MeshBasicMaterial({ color: 0xFF6666 }),
             marker: new THREE.MeshBasicMaterial({ color: 0xff0000 }) // Minimap marker
         };
         const tc = TRUCK_CONSTANTS; const wc = WHEEL_CONSTANTS;
         const hoodWidth = tc.BODY_WIDTH * 0.95;
         const bedWidth = tc.BODY_WIDTH * 0.95;
         const hoodBaseX = -(tc.CABIN_LENGTH / 2 + tc.HOOD_LENGTH / 2); const cabinBaseX = 0;
         const bedBaseX = tc.CABIN_LENGTH / 2 + tc.BED_LENGTH / 2;

         // --- Hood ---
         const hoodGeometry = new THREE.BoxGeometry(tc.HOOD_LENGTH, tc.HOOD_HEIGHT, hoodWidth);
         const hoodMesh = new THREE.Mesh(hoodGeometry, materials.body);
         hoodMesh.position.set(hoodBaseX, tc.CABIN_LOWER_HEIGHT - tc.HOOD_HEIGHT / 2, 0);
         hoodMesh.castShadow = true; hoodMesh.receiveShadow = true; truckRoot.add(hoodMesh);

         // --- Grill ---
         const grillHeight = tc.HOOD_HEIGHT * 0.7;
         const grillBarCount = 5;
         const grillBarHeight = grillHeight / grillBarCount * 0.8;
         const grillBarDepth = 0.05;
         const grillYStart = tc.CABIN_LOWER_HEIGHT - grillHeight * 0.5;
         for (let i = 0; i < grillBarCount; i++) {
             const barY = grillYStart + (i - (grillBarCount - 1) / 2) * (grillHeight / grillBarCount);
             const barGeometry = new THREE.BoxGeometry(grillBarDepth, grillBarHeight, hoodWidth * 0.75);
             const barMesh = new THREE.Mesh(barGeometry, materials.detail);
             barMesh.position.set(hoodBaseX - tc.HOOD_LENGTH / 2 - grillBarDepth / 2, barY, 0);
             barMesh.castShadow = true;
             truckRoot.add(barMesh);
         }

         // --- Headlights ---
         const headlightSize = 0.2;
         const headlightShape = new THREE.Shape(); // Simple square shape for low-poly
         headlightShape.moveTo(-headlightSize/2, -headlightSize/2);
         headlightShape.lineTo(headlightSize/2, -headlightSize/2);
         headlightShape.lineTo(headlightSize/2, headlightSize/2);
         headlightShape.lineTo(-headlightSize/2, headlightSize/2);
         headlightShape.lineTo(-headlightSize/2, -headlightSize/2);
         const extrudeSettings = { depth: 0.1, bevelEnabled: false };
         const headlightGeometry = new THREE.ExtrudeGeometry(headlightShape, extrudeSettings);
         const leftHeadlight = new THREE.Mesh(headlightGeometry, materials.lightFront);
         leftHeadlight.position.set(hoodBaseX - tc.HOOD_LENGTH / 2 - extrudeSettings.depth, tc.CABIN_LOWER_HEIGHT - tc.HOOD_HEIGHT * 0.2, hoodWidth * 0.4);
         leftHeadlight.rotation.y = Math.PI / 2;
         truckRoot.add(leftHeadlight);
         const rightHeadlight = leftHeadlight.clone();
         rightHeadlight.position.z = -hoodWidth * 0.4;
         truckRoot.add(rightHeadlight);

         // --- Cabin Lower ---
         const cabinLowerGeometry = new THREE.BoxGeometry(tc.CABIN_LENGTH, tc.CABIN_LOWER_HEIGHT, tc.BODY_WIDTH);
         const cabinLowerMesh = new THREE.Mesh(cabinLowerGeometry, materials.detail);
         cabinLowerMesh.position.set(cabinBaseX, tc.CABIN_LOWER_HEIGHT / 2, 0);
         cabinLowerMesh.castShadow = true; cabinLowerMesh.receiveShadow = true; truckRoot.add(cabinLowerMesh);

         // --- Cabin Top ---
         const cabinTopGeometry = new THREE.BoxGeometry(tc.CABIN_LENGTH, tc.CABIN_UPPER_HEIGHT, tc.BODY_WIDTH);
         const cabinTopMesh = new THREE.Mesh(cabinTopGeometry, materials.cabinTop);
         cabinTopMesh.position.set(cabinBaseX, tc.CABIN_LOWER_HEIGHT + tc.CABIN_UPPER_HEIGHT / 2, 0);
         cabinTopMesh.castShadow = true; cabinTopMesh.receiveShadow = true;
         truckRoot.add(cabinTopMesh);

         // --- Truck Bed ---
         const bedFloorGeometry = new THREE.BoxGeometry(tc.BED_LENGTH, tc.BED_FLOOR_THICKNESS, bedWidth);
         const bedFloorMesh = new THREE.Mesh(bedFloorGeometry, materials.body);
         bedFloorMesh.position.set(bedBaseX, tc.BED_FLOOR_THICKNESS / 2, 0);
         bedFloorMesh.castShadow = true; bedFloorMesh.receiveShadow = true; truckRoot.add(bedFloorMesh);
         const bedWallThickness = 0.05;
         const sideWallGeometry = new THREE.BoxGeometry(tc.BED_LENGTH, tc.BED_WALL_HEIGHT, bedWallThickness);
         const backWallGeometry = new THREE.BoxGeometry(bedWallThickness, tc.BED_WALL_HEIGHT, bedWidth - bedWallThickness * 2);
         const leftWall = new THREE.Mesh(sideWallGeometry, materials.body); leftWall.position.set(0, tc.BED_WALL_HEIGHT / 2 + tc.BED_FLOOR_THICKNESS / 2, (bedWidth - bedWallThickness) / 2); leftWall.castShadow = true; bedFloorMesh.add(leftWall);
         const rightWall = leftWall.clone(); rightWall.position.z = -(bedWidth - bedWallThickness) / 2; bedFloorMesh.add(rightWall);
         const backWall = new THREE.Mesh(backWallGeometry, materials.body); backWall.position.set(tc.BED_LENGTH / 2 - bedWallThickness / 2, tc.BED_WALL_HEIGHT / 2 + tc.BED_FLOOR_THICKNESS / 2, 0); backWall.castShadow = true; bedFloorMesh.add(backWall);

        // --- Tail Lights ---
         const tailLightSize = headlightSize * 0.8;
         const tailLightShape = new THREE.Shape(); // Simple square
         tailLightShape.moveTo(-tailLightSize/2, -tailLightSize/2);
         tailLightShape.lineTo(tailLightSize/2, -tailLightSize/2);
         tailLightShape.lineTo(tailLightSize/2, tailLightSize/2);
         tailLightShape.lineTo(-tailLightSize/2, tailLightSize/2);
         tailLightShape.lineTo(-tailLightSize/2, -tailLightSize/2);
         const tailLightExtrudeSettings = { depth: 0.08, bevelEnabled: false };
         const tailLightGeometry = new THREE.ExtrudeGeometry(tailLightShape, tailLightExtrudeSettings);
         const leftTailLight = new THREE.Mesh(tailLightGeometry, materials.lightRear);
         leftTailLight.position.set(-bedWallThickness / 2 - tailLightExtrudeSettings.depth / 2, tc.BED_WALL_HEIGHT * 0.3, (bedWidth - bedWallThickness * 2) * 0.4);
         leftTailLight.rotation.y = -Math.PI / 2;
         backWall.add(leftTailLight); // Add to back wall mesh
         const rightTailLight = leftTailLight.clone();
         rightTailLight.position.z = -(bedWidth - bedWallThickness * 2) * 0.4;
         backWall.add(rightTailLight);

          // --- Minimap Marker ---
         const markerHeight = 1.0;
         const markerRadius = 0.2;
         const markerGeometry = new THREE.ConeGeometry(markerRadius, markerHeight, 8);
         const minimapMarker = new THREE.Mesh(markerGeometry, materials.marker);
         minimapMarker.name = "minimapMarker";
         minimapMarker.position.set(cabinBaseX, tc.CABIN_LOWER_HEIGHT + tc.CABIN_UPPER_HEIGHT + markerHeight * 0.4, 0);
         minimapMarker.rotation.x = Math.PI; // Point up
         truckRoot.add(minimapMarker);

         // --- Wheels ---
         const frontAxleX = cabinBaseX + tc.CABIN_LENGTH * tc.FRONT_AXLE_OFFSET;
         const rearAxleX = bedBaseX + tc.BED_LENGTH * tc.REAR_AXLE_OFFSET;
         const wheelZ = tc.BODY_WIDTH / 2 + wc.THICKNESS / 2;
         const wheelPositions = [
             { x: frontAxleX, z: wheelZ, isFront: true },
             { x: frontAxleX, z: -wheelZ, isFront: true },
             { x: rearAxleX, z: wheelZ, isFront: false },
             { x: rearAxleX, z: -wheelZ, isFront: false }
         ];

         wheelPositions.forEach((posData) => {
             const wheelGroupContainer = Truck._createWheelAssembly(materials, posData.isFront);
             wheelGroupContainer.position.set(posData.x, 0, posData.z);
             truckRoot.add(wheelGroupContainer);
         });

         console.log("[Truck] Static low-poly model created.");
         return truckRoot;
     }

     // Static helper for wheel assembly - ensures wheels are part of the static model
      static _createWheelAssembly(materials, isFront) {
         const wheelGroupContainer = new THREE.Group();
         // Name the container for steering identification
         wheelGroupContainer.name = isFront ? 'frontWheelContainer' : 'rearWheelContainer';

         const wheelSpinnerGroup = new THREE.Group();
         // Name the spinner for rotation identification
         wheelSpinnerGroup.name = 'wheelSpinnerGroup';

         const wc = WHEEL_CONSTANTS;

         // Tire
         const tireGeometry = new THREE.CylinderGeometry(wc.RADIUS, wc.RADIUS, wc.THICKNESS, 18);
         tireGeometry.rotateX(Math.PI / 2); // Align axle with Z-axis for correct spinner rotation
         const tireMesh = new THREE.Mesh(tireGeometry, materials.wheelTire);
         tireMesh.castShadow = true;

         // Hub
         const hubRadius = wc.RADIUS * 0.5;
         const hubThickness = wc.THICKNESS * 1.1;
         const hubGeometry = new THREE.CylinderGeometry(hubRadius, hubRadius * 0.9, hubThickness, 12);
         hubGeometry.rotateX(Math.PI / 2); // Align axle with Z-axis
         const hubMesh = new THREE.Mesh(hubGeometry, materials.wheelHub);
         hubMesh.castShadow = true;

         // Add meshes to the spinner group
         wheelSpinnerGroup.add(tireMesh);
         wheelSpinnerGroup.add(hubMesh);

         // Add spinner to the container (which handles steering)
         wheelGroupContainer.add(wheelSpinnerGroup);

         // No need to add to instance arrays here, done in _findAndStoreWheels

         return wheelGroupContainer;
     }
} 