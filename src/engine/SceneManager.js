import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MARS_ATMOSPHERE_COLOR, PLANE_SIZE, WHEEL_CONSTANTS } from '../game/Config.js'; // Import necessary constants
import { ModuleLogger } from '../utils/Logger.js'; // Import Logger

export class SceneManager {
    constructor(renderer) { // Pass renderer instance for controls
        this.logger = new ModuleLogger("SceneManager"); // Create logger instance
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.groundPlane = null;
        this.directionalLight = null; // Store light for helper
        this.isChaseCamActive = true; // Default camera mode
        this.rendererDOMElement = renderer.renderer.domElement; // Store renderer DOM element for controls

        this._setupScene();
        this._setupCamera();
        this._setupLighting();
        this._createGroundPlane();
        this._setupControls(); // Setup controls after camera and renderer element are ready

        // Add helpers after their targets exist
        this._addDebugHelpers();

        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    _setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(MARS_ATMOSPHERE_COLOR);
        this.scene.fog = new THREE.Fog(MARS_ATMOSPHERE_COLOR, 30, 150);

        // Add Axes Helper for debugging
        const axesHelper = new THREE.AxesHelper(10); // Size 10 for visibility
        this.scene.add(axesHelper);

        this.logger.info("Scene created.");
    }

    _setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 500);
        this.camera.position.set(8, 5, 12); // Initial position

        // Add Camera Helper for debugging
        const cameraHelper = new THREE.CameraHelper(this.camera);
        this.scene.add(cameraHelper);

        this.logger.info("Camera created.");
    }

    _setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Store the light
        this.directionalLight.position.set(10, 15, 10);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 80;
        this.directionalLight.shadow.camera.left = -PLANE_SIZE / 2;
        this.directionalLight.shadow.camera.right = PLANE_SIZE / 2;
        this.directionalLight.shadow.camera.top = PLANE_SIZE / 2;
        this.directionalLight.shadow.camera.bottom = -PLANE_SIZE / 2;
        this.scene.add(this.directionalLight);
        this.logger.info("Lighting setup.");
    }

    _createGroundPlane() {
        // Remove simplified logging
        // console.log("[SceneManager] Creating SIMPLIFIED ground plane for debugging...");
        // --- Original complex geometry code START ---
        // Remove comment markers
        const segments = 150;
        const geometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, segments, segments);
        const positionAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const noiseScale1 = 0.3;
        const noiseFreq1 = 0.15;
        const noiseScale2 = 0.15;
        const noiseFreq2 = 0.4;

        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);
            const dx1 = vertex.x * noiseFreq1;
            const dy1 = vertex.y * noiseFreq1;
            const noise1 = (Math.sin(dx1) + Math.cos(dy1)) * noiseScale1;
            const dx2 = vertex.x * noiseFreq2;
            const dy2 = vertex.y * noiseFreq2;
            const noise2 = (Math.sin(dx2) * Math.cos(dy2)) * noiseScale2;
            positionAttribute.setZ(i, noise1 + noise2);
        }
        positionAttribute.needsUpdate = true;
        geometry.computeVertexNormals();
        // Remove comment markers
        // --- Original complex geometry code END ---

        // --- Remove Simplified geometry and material START ---
        /*
        const geometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE); // Basic plane
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, // Bright green for visibility
            side: THREE.DoubleSide // Ensure visible from both sides
        });
        */
        // --- Remove Simplified geometry and material END ---

        // --- Original standard material code START ---
        /* // Temporarily comment out standard material
        const material = new THREE.MeshStandardMaterial({
            color: 0x9A6A4A,
            roughness: 0.9,
            metalness: 0.1
        });
        */ // Temporarily comment out standard material
        // --- Original standard material code END ---

        // --- Use Basic Material for Debugging ---
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x0000ff, // Changed to blue for debugging
            side: THREE.DoubleSide, // Ensure visible from both sides
            wireframe: true // Use wireframe to see geometry structure
        });
        // --- Use Basic Material for Debugging ---

        this.groundPlane = new THREE.Mesh(geometry, material);
        this.groundPlane.rotation.x = -Math.PI / 2;
        this.groundPlane.position.y = 0;
        // Re-enable receiveShadow
        this.groundPlane.receiveShadow = true; 
        this.scene.add(this.groundPlane);
        // Restore original logging
        this.logger.info("Ground plane created.");
    }

    _setupControls() {
        this.controls = new OrbitControls(this.camera, this.rendererDOMElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI / 2.1;
        // Use WHEEL_CONSTANTS for initial target height
        this.controls.target.set(0, WHEEL_CONSTANTS.RADIUS + 0.2, 0);
        this.controls.enabled = !this.isChaseCamActive; // Initially disabled if chase cam is active
        this.controls.update();
        this.logger.info("OrbitControls created.");
    }

    _addDebugHelpers() {
        // Add Plane Helper for groundPlane
        if (this.groundPlane) {
            // Create a mathematical plane representing the ground (Y=0)
            const groundMathematicalPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); 
            const planeHelper = new THREE.PlaneHelper(groundMathematicalPlane, PLANE_SIZE, 0xffff00); // Yellow, size matches geometry
            // PlaneHelper visualizes the mathematical plane directly, no need to match mesh transform
            // planeHelper.rotation.x = this.groundPlane.rotation.x;
            // planeHelper.position.y = this.groundPlane.position.y;
            this.scene.add(planeHelper);
            this.logger.info("PlaneHelper added correctly.");
        }

        // Add Directional Light Helper
        if (this.directionalLight) {
            const lightHelper = new THREE.DirectionalLightHelper(this.directionalLight, 5, 0xff00ff); // Magenta
            this.scene.add(lightHelper);
            this.logger.info("DirectionalLightHelper added.");
        }
    }

    onWindowResize() {
        if (this.camera) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
        // Renderer size is handled by Renderer class
    }

    setChaseCameraActive(isActive, truckPosition, truckQuaternion) {
        this.isChaseCamActive = isActive;
        this.logger.debug(`Setting chase camera active: ${isActive}`);
        if (this.controls) {
            this.controls.enabled = !isActive;
        }
        if (isActive && truckPosition && truckQuaternion) {
            // Immediately snap camera for chase view if needed
            this._updateChaseCamera(truckPosition, truckQuaternion, 1.0); // Force update
        }
    }

    _updateChaseCamera(truckPosition, truckQuaternion, deltaTime) {
        if (!this.camera || !truckPosition || !truckQuaternion) return;

        // Define camera offset relative to the truck
        const localOffset = new THREE.Vector3(12, 3, 0); // Adjust as needed
        const worldOffset = localOffset.clone().applyQuaternion(truckQuaternion);
        const targetPosition = truckPosition.clone().add(worldOffset);

        // Smoothly interpolate camera position
        const lerpFactor = 1.0 - Math.pow(0.01, deltaTime); // Smooth damping
        this.camera.position.lerp(targetPosition, lerpFactor);

        // Smoothly interpolate look-at target (truck's position)
        const lookAtTarget = truckPosition.clone();
        // Optional: Slightly raise the look-at target for better view
        // lookAtTarget.y += 0.5;
        this.camera.lookAt(lookAtTarget);

        // Update OrbitControls target smoothly as well if we switch back
        if (this.controls) {
            this.controls.target.lerp(lookAtTarget, lerpFactor);
        }
    }

    update(deltaTime, truckPosition, truckQuaternion) {
        // Update chase camera or orbit controls based on mode
        if (this.isChaseCamActive) {
            this._updateChaseCamera(truckPosition, truckQuaternion, deltaTime);
        } else if (this.controls && this.controls.enabled) {
            // Optionally lerp target even in orbit mode if truck is moving
             if (truckPosition) {
                 const lookTarget = truckPosition.clone();
                 // lookTarget.y += 0.5; // Optional raising
                 this.controls.target.lerp(lookTarget, 0.1); // Slower lerp for orbit target
             }
            this.controls.update(); // Essential for damping
        }
    }

    // --- Method to get ground height at specific X, Z coordinates ---
    getGroundHeightAt(x, z) {
        if (!this.groundPlane) return 0; // Ground not ready

        const raycaster = new THREE.Raycaster();
        const down = new THREE.Vector3(0, -1, 0);
        // Start the ray high above the expected ground
        const origin = new THREE.Vector3(x, 50, z); 
        raycaster.set(origin, down);

        const intersects = raycaster.intersectObject(this.groundPlane);

        if (intersects.length > 0) {
            // The first intersection point is the ground height
            this.logger.debug(`Ground height at (${x}, ${z}) = ${intersects[0].point.y}`);
            return intersects[0].point.y;
        } else {
            this.logger.warn(`Raycaster found no ground intersection at (${x}, ${z}). Returning 0.`);
            return 0; // Fallback if no intersection (shouldn't happen within PLANE_SIZE)
        }
    }

    // --- Methods for GUI Control ---
    setAmbientLightIntensity(intensity) {
        const light = this.scene.children.find(obj => obj instanceof THREE.AmbientLight);
        if (light) {
            light.intensity = intensity;
            this.logger.debug(`Ambient light intensity set to: ${intensity}`);
        }
    }

    setDirectionalLightIntensity(intensity) {
        if (this.directionalLight) {
            this.directionalLight.intensity = intensity;
            this.logger.debug(`Directional light intensity set to: ${intensity}`);
        }
    }

    // --- Getters ---
    getScene() { return this.scene; }
    getCamera() { return this.camera; }
    getGroundPlane() { return this.groundPlane; }
} 