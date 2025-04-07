import * as THREE from 'three';
import Stats from 'stats.js/core'; // Import Stats
import GUI from 'lil-gui';       // Import lil-gui
import { Renderer } from './engine/Renderer.js';
import { SceneManager } from './engine/SceneManager.js';
import { AssetLoader } from './engine/AssetLoader.js';
import { InputManager } from './engine/InputManager.js';
import { World } from './game/World.js';
import { Truck } from './game/entities/Truck.js';
import { UIManager } from './game/ui/UIManager.js';
import { CURRENT_VERSION_INFO, WHEEL_CONSTANTS } from './game/Config.js';
import * as Logger from './utils/Logger.js'; // Import Logger utility

export class App {
    constructor() {
        this.renderer = null;
        this.sceneManager = null;
        this.assetLoader = null;
        this.inputManager = null;
        this.world = null;
        this.truck = null;
        this.uiManager = null;
        this.stats = null; // Add stats property
        this.gui = null;   // Add gui property

        this.clock = new THREE.Clock();
        this.frameCount = 0;
        this.switchCooldown = 0;
        this.isChaseCamActive = true; // Initial camera state

        // Object to hold parameters controlled by GUI
        this.debugParams = {
            ambientLightIntensity: 0.6, // Default matching SceneManager
            directionalLightIntensity: 1.0, // Default matching SceneManager
            toggleCamera: () => this._toggleCameraDebug(),
            logLevel: Logger.getCurrentLogLevel() // Start with current level
        };

        this._initialize();
    }

    async _initialize() {
        Logger.info("App", "Initializing..." );
        try {
            // 1. UI Manager (can be created early)
            this.uiManager = new UIManager();
            this.uiManager.showLoading("Initializing Engine...");

            // 2. Core Engine Modules
            this.renderer = new Renderer(document.body);
             // Pass renderer instance to SceneManager for controls
            this.sceneManager = new SceneManager(this.renderer); 
            this.inputManager = new InputManager();
            // Pass UIManager's loadingManager or specific callbacks to AssetLoader
            this.assetLoader = new AssetLoader(this.uiManager.loadingIndicator); // Simple example: passing indicator element
            // A better approach might use callbacks: this.assetLoader = new AssetLoader({ onStart: ..., onLoad: ..., onError: ... });

            // Initialize Stats.js BEFORE heavy loading
            this.stats = new Stats();
            this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            document.body.appendChild(this.stats.dom);
            Logger.info("App", "Stats.js initialized.");

            // 3. Load Critical Assets (Truck Models)
            this.uiManager.showLoading("Loading Truck Models...");
            const lowPolyModel = Truck.createLowPolyModel(); // Create static low-poly model
            const gltfResult = await this.assetLoader.safeLoadGLTF("YOUR_MODEL_URL_HERE.glb");
            const truckModels = {
                 lowPoly: lowPolyModel,
                 gltf: gltfResult.error ? null : gltfResult.model
            };
            if (gltfResult.error) {
                 // Use UIManager to display non-critical error
                 // this.uiManager.displayInfo("Could not load GLTF truck model. Using low-poly only.");
                 // Use Logger for warnings
                 Logger.warn("App", "Could not load GLTF truck model. Using low-poly only.");
             }

            // 4. Game World and Entities
            this.uiManager.showLoading("Creating World...");
            const scene = this.sceneManager.getScene();
            const groundPlane = this.sceneManager.getGroundPlane();
            this.world = new World(scene, groundPlane);

            this.uiManager.showLoading("Initializing Truck...");
            this.truck = new Truck(
                scene,
                this.inputManager,
                groundPlane,
                truckModels
            );

            // Set initial truck position based on ground height AFTER truck is created
            const startX = 0;
            const startZ = 0;
            const groundY = this.sceneManager.getGroundHeightAt(startX, startZ);
            // Determine offset based on initial model (assuming low-poly)
            const startOffset = WHEEL_CONSTANTS.RADIUS; // Adjust if starts with GLTF
            this.truck.setPosition(startX, groundY + startOffset, startZ); // Assuming Truck has setPosition
            Logger.info("App", `Set initial truck position to (${startX}, ${groundY + startOffset}, ${startZ}) based on ground height ${groundY}`);

            // 5. Final Setup
             this.uiManager.updateBuildInfo(CURRENT_VERSION_INFO);
             this._setupInitialCamera();
             this.uiManager.hideLoading();

            // Initialize lil-gui AFTER major components are ready
            this._setupDebugGUI();

            Logger.info("App", "Initialization complete. Starting animation loop.");
            this._animate(); // Start the main loop

        } catch (error) {
            Logger.error("App", "CRITICAL INITIALIZATION FAILURE:", error);
            if (this.uiManager) {
                this.uiManager.displayError(`Application failed to start: ${error.message}`);
            } else {
                // Fallback if UIManager failed
                 const errorDiv = document.getElementById('error-message') || document.createElement('div');
                 errorDiv.textContent = `Application failed to start: ${error.message}`;
                 errorDiv.style.cssText = "position:absolute; top:10px; left:10px; padding:10px; background:red; color:white; z-index:1000;";
                 document.body.appendChild(errorDiv);
            }
            // Ensure loading indicator is hidden on critical failure
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    _setupInitialCamera() {
        // Set initial camera state (chase or orbit) via SceneManager
        const truckPos = this.truck ? this.truck.getPosition() : new THREE.Vector3();
        const truckQuat = this.truck ? this.truck.getQuaternion() : new THREE.Quaternion();
        // Update lil-gui display if chase cam status changes
        if(this.gui) this.gui.controllers.find(c => c.property === 'isChaseCamActive')?.updateDisplay();
        this.sceneManager.setChaseCameraActive(this.isChaseCamActive, truckPos, truckQuat);
        Logger.info("App", `Initial camera mode set. Chase Cam Active: ${this.isChaseCamActive}`);
    }

    _setupDebugGUI() {
        this.gui = new GUI();
        this.gui.title("Debug Controls");
        Logger.info("App", "lil-gui initialized.");

        // Add controls - examples targeting SceneManager lights
        if (this.sceneManager) {
            const lightFolder = this.gui.addFolder('Lighting');
            // Assumes SceneManager exposes methods to change lights
            lightFolder.add(this.debugParams, 'ambientLightIntensity', 0, 2, 0.1).name('Ambient').onChange(value => {
                this.sceneManager.setAmbientLightIntensity(value);
            });
            lightFolder.add(this.debugParams, 'directionalLightIntensity', 0, 3, 0.1).name('Directional').onChange(value => {
                this.sceneManager.setDirectionalLightIntensity(value);
             });
        }

        // Add other controls
        const cameraFolder = this.gui.addFolder('Camera');
        // Use .listen() to automatically update GUI if the variable changes elsewhere
        cameraFolder.add(this, 'isChaseCamActive').name('Chase Cam Active').listen().onChange(value => {
             this.sceneManager.setChaseCameraActive(value, this.truck?.getPosition(), this.truck?.getQuaternion());
             Logger.debug("App", `Chase cam toggled via GUI: ${value}`);
        });
        cameraFolder.add(this.debugParams, 'toggleCamera').name('Toggle Camera Mode');

        // Control Log Level
        const loggingFolder = this.gui.addFolder('Logging');
        loggingFolder.add(this.debugParams, 'logLevel', Logger.LogLevel).name('Log Level').onChange(value => {
            // GUI passes string key, need to convert back to number value
            Logger.setLogLevel(Logger.LogLevel[value]);
        });

        // Set initial light values from debugParams (ensure SceneManager is ready)
        if (this.sceneManager) {
           this.sceneManager.setAmbientLightIntensity(this.debugParams.ambientLightIntensity);
           this.sceneManager.setDirectionalLightIntensity(this.debugParams.directionalLightIntensity);
        }
    }

     // Helper function called by the GUI button
     _toggleCameraDebug() {
        this.isChaseCamActive = !this.isChaseCamActive;
        // No need to call setChaseCameraActive here, the .onChange handler on the GUI controller does it.
        // We just need to ensure the underlying variable is changed.
        Logger.debug("App", `Camera toggled via button. Chase Cam: ${this.isChaseCamActive}`);
        // Let lil-gui's .listen() handle the visual update.
     }

    _animate() {
        // Begin timing before doing any work
        if (this.stats) this.stats.begin();

        // Use arrow function to maintain 'this' context for requestAnimationFrame
        requestAnimationFrame(() => this._animate());

        try {
            const deltaTime = this.clock.getDelta();
            this.frameCount++;
            this.switchCooldown = Math.max(0, this.switchCooldown - deltaTime);

            // --- Input Handling --- 
            if (this.inputManager.isSwitchModelPressed() && this.switchCooldown <= 0) {
                if (this.truck) {
                    this.truck.switchModel();
                    this.switchCooldown = 0.5; // Cooldown period
                    
                    // Toggle camera mode when switching models
                    this.isChaseCamActive = !this.isChaseCamActive;
                    // No need to call setChaseCameraActive directly, let the GUI's .listen() update if it exists
                    // this.sceneManager.setChaseCameraActive(this.isChaseCamActive);
                    Logger.debug("App", `Camera Mode Toggled on model switch: Chase Cam Active = ${this.isChaseCamActive}`);
                }
            }

            // --- Game Logic Updates --- 
            if (this.truck) {
                this.truck.update(deltaTime);
            }
            if (this.world) {
                // Pass frameCount to World to control scenery initialization timing
                this.world.update(deltaTime, this.frameCount);
            }

            // --- Engine Updates --- 
            // Update SceneManager (handles camera updates - chase or orbit)
             let truckPos = this.truck ? this.truck.getPosition() : null;
             let truckQuat = this.truck ? this.truck.getQuaternion() : null;
            if (this.sceneManager) {
                this.sceneManager.update(deltaTime, truckPos, truckQuat);
            }

            // --- Rendering --- 
            if (this.renderer && this.sceneManager) {
                this.renderer.render(
                    this.sceneManager.getScene(),
                    this.sceneManager.getCamera(),
                    truckPos // Pass truck position (still needed potentially, e.g. if Renderer used it internally, though currently not)
                );
            }

            // --- UI Updates (if needed) --- 
            // Update GUI display if needed (e.g., for .listen() controllers)
            // if (this.gui) { this.gui.updateDisplay(); } // Often not needed if .listen() is used

        } catch (error) {
            Logger.error("App", "Error in animation loop:", error);
            if (this.uiManager) {
                // Display non-critical error via UIManager
                this.uiManager.displayError(`Runtime error: ${error.message}. App may be unstable.`);
            }
            // Consider stopping the loop on critical errors: throw error;
        }
        // End timing after all work is done (including render)
        if (this.stats) this.stats.end();
    }

    // --- Getters --- 
    getPosition() {
        // ... existing code ...
    }
} 