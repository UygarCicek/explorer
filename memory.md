# Mars Explorer Project Documentation

This document provides an overview of the Mars Explorer web application (`index.html`), detailing its components and their interactions.

## Overview

The application is a 3D simulation built using Three.js. It renders a Martian landscape with a controllable truck. Users can drive the truck around the terrain using keyboard controls (WASD) and switch between a low-polygon procedurally generated truck model and an externally loaded GLTF model (currently using a placeholder URL) by pressing 'C'. The camera can be manipulated using orbit controls (mouse drag/scroll).

## Core Technologies

*   **HTML:** Structure and basic UI elements.
*   **CSS:** Styling for UI elements (build info, error/loading messages).
*   **JavaScript (ES Modules):** Application logic.
*   **Three.js:** 3D rendering library for scene, camera, lighting, models, controls, and WebGL interaction.

## Components (JavaScript Classes)

### 1. `MarsExplorerApp`

*   **Purpose:** The main orchestrator of the application.
*   **Functionality:**
    *   Initializes all other manager and handler components upon loading.
    *   Creates the initial truck models (low-poly and attempts to load GLTF).
    *   Starts and manages the main animation loop (`requestAnimationFrame`).
    *   Updates game state in each frame (handles input for model switching, updates the truck's physics/movement, places rocks initially, updates camera controls).
    *   Calls the `SceneManager` to render the scene each frame.
    *   Handles top-level error catching during initialization and the animation loop.
*   **Interconnections:**
    *   Instantiates `UIManager`, `InputHandler`, `SceneManager`, `Truck`, `RockGenerator`.
    *   Reads state from `InputHandler` (model switch key).
    *   Calls `update` on `Truck`.
    *   Calls `placeRocksIfNeeded` on `RockGenerator`.
    *   Calls `updateControls` and `render` on `SceneManager`.
    *   Retrieves position from `Truck` to pass to `SceneManager`.
    *   Uses `UIManager` for critical error display.

### 2. `UIManager`

*   **Purpose:** Manages User Interface elements displayed over the 3D scene.
*   **Functionality:**
    *   Selects and controls the DOM elements for build info (`#build-info`), error messages (`#error-message`), and loading indicators (`#loading-indicator`).
    *   Provides methods to `displayError`, `hideError`, `showLoading`, `hideLoading`.
    *   Updates the build info box with the current version and change history.
*   **Interconnections:**
    *   Instantiated by `MarsExplorerApp`.
    *   Used by `MarsExplorerApp` (initial build info, critical errors).
    *   Used by `Truck` (specifically its `LoadingManager`) to show/hide loading indicators and display GLTF loading errors.

### 3. `InputHandler`

*   **Purpose:** Captures and manages keyboard input.
*   **Functionality:**
    *   Sets up `keydown` and `keyup` event listeners.
    *   Maintains the state (pressed/not pressed) of relevant keys (W, A, S, D, C).
    *   Provides methods (`getSteeringInput`, `getMovementInput`, `isSwitchModelPressed`) for other components to query the current input state.
*   **Interconnections:**
    *   Instantiated by `MarsExplorerApp`.
    *   Read by `Truck` within its `update` method to determine movement and steering.
    *   Read by `MarsExplorerApp` within its `_animate` method to check for the model switch command.

### 4. `SceneManager`

*   **Purpose:** Manages the core Three.js setup, rendering environment, and camera.
*   **Functionality:**
    *   Initializes the Three.js `WebGLRenderer`, `Scene`, and `PerspectiveCamera`.
    *   Sets up scene background color and fog.
    *   Configures lighting (ambient and directional with shadows).
    *   Creates the procedurally generated terrain (`PlaneGeometry` with vertex displacement for noise) and adds it to the scene.
    *   Initializes `OrbitControls` for mouse-based camera manipulation.
    *   Handles window resize events to adjust camera aspect ratio and renderer size.
    *   Provides a `render` method to draw the scene.
    *   Provides an `updateControls` method to smoothly adjust the camera's target based on the truck's position.
    *   Provides getter methods for the `scene` and `groundPlane` objects.
*   **Interconnections:**
    *   Instantiated by `MarsExplorerApp`.
    *   Takes the main HTML `body` element as a container for the renderer's canvas.
    *   Provides the `scene` object to `Truck` and `RockGenerator` so they can add objects.
    *   Provides the `groundPlane` object to `Truck` (for ground adjustment) and `RockGenerator` (for rock placement).
    *   Its `render` and `updateControls` methods are called by `MarsExplorerApp` in the animation loop.
    *   Receives the truck's position from `MarsExplorerApp` to update the control target.

### 5. `Truck`

*   **Purpose:** Manages the state, appearance, and behavior of the controllable truck.
*   **Functionality:**
    *   Creates a low-polygon truck model procedurally using Three.js geometries and materials.
    *   Uses `GLTFLoader` (via `THREE.LoadingManager`) to attempt loading a more detailed GLTF model from a URL (currently a placeholder).
    *   Manages which model (`lowPolyTruckGroup` or `gltfTruckModel`) is currently active and visible (`activeTruckObject`).
    *   Handles switching between the two models (`switchModel`).
    *   Calculates and applies truck movement (forward/backward) and rotation (steering) based on input from `InputHandler` in its `update` method.
    *   Rotates the wheels of the low-poly model based on movement distance.
    *   Applies steering rotation to the front wheels of the low-poly model.
    *   Uses raycasting (`_adjustToGround`) to keep the active truck model positioned correctly on the terrain surface.
    *   Provides its current position via `getPosition`.
*   **Interconnections:**
    *   Instantiated by `MarsExplorerApp`.
    *   Requires the `scene` and `groundPlane` from `SceneManager` to add models and perform raycasting.
    *   Requires the `UIManager` instance to display loading progress/errors for the GLTF model.
    *   Reads input state from `InputHandler` during its `update` method.
    *   Its `update` method is called by `MarsExplorerApp`.
    *   Its `getPosition` method is called by `MarsExplorerApp`.
    *   Adds its visual representation (`THREE.Group` or `THREE.Scene` from GLTF) to the `SceneManager`'s scene.

### 6. `RockGenerator`

*   **Purpose:** Populates the scene with decorative rocks.
*   **Functionality:**
    *   Creates a specified number (`NUM_ROCKS`) of rock meshes (`IcosahedronGeometry`).
    *   Uses raycasting against the `groundPlane` to determine the correct Y position for each rock on the uneven terrain.
    *   Randomizes rock size, position (within a defined area), and rotation.
    *   Adds the created rock meshes to the scene.
    *   Ensures rocks are only placed once (`placeRocksIfNeeded`).
*   **Interconnections:**
    *   Instantiated by `MarsExplorerApp`.
    *   Requires the `scene` and `groundPlane` from `SceneManager`.
    *   Adds rock meshes directly to the `SceneManager`'s scene.
    *   Its `placeRocksIfNeeded` method is called by `MarsExplorerApp` early in the application lifecycle.

## Startup Sequence

1.  HTML `DOMContentLoaded` event fires (or document is already interactive).
2.  A new `MarsExplorerApp` instance is created.
3.  `MarsExplorerApp._initialize()`:
    *   Creates `UIManager`.
    *   Creates `InputHandler`.
    *   Creates `SceneManager` (which sets up Three.js basics: renderer, scene, camera, lights, ground, controls).
    *   Creates `Truck`, passing scene, groundPlane, and uiManager.
    *   Creates `RockGenerator`, passing scene and groundPlane.
    *   Calls `truck.createLowPolyModel()`.
    *   Calls `truck.loadGltfModel()` (starts async loading or handles placeholder).
    *   Calls `uiManager.updateBuildInfo()`.
    *   Calls `_animate()` to start the main loop.
4.  `MarsExplorerApp._animate()` (repeats):
    *   Requests the next animation frame.
    *   Gets time delta.
    *   Checks `InputHandler` for model switch key ('C') and calls `truck.switchModel()` if pressed and cooldown allows.
    *   Calls `truck.update()`, passing deltaTime and the `InputHandler`.
    *   Calls `rockGenerator.placeRocksIfNeeded()` (places rocks on the second frame).
    *   Gets truck position using `truck.getPosition()`.
    *   Calls `sceneManager.updateControls()`, passing deltaTime and truck position.
    *   Calls `sceneManager.render()`. 