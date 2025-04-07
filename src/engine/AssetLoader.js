import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

export class AssetLoader {
    constructor(loadingManager) {
        this.loadingManager = loadingManager || new THREE.LoadingManager(); // Use provided or create new
        this.gltfLoader = new GLTFLoader(this.loadingManager);
        // Add other loaders if needed (TextureLoader, etc.)
        // this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    }

    async safeLoadGLTF(url) {
        return new Promise((resolve) => {
             // Handle placeholder URL explicitly
             if (!url || url === "YOUR_MODEL_URL_HERE.glb") {
                 console.warn("[AssetLoader] Using placeholder/invalid GLTF URL. Model will not load.");
                 resolve({ error: true, model: this.createDebugPlaceholder('GLTF Placeholder') });
                 return;
             }

            this.gltfLoader.load(url, (gltf) => {
                 // Success
                 console.log(`[AssetLoader] GLTF loaded successfully: ${url}`);
                 // Optional: Perform initial setup on the loaded model if needed
                 gltf.scene.traverse((child) => {
                     if (child.isMesh) {
                         child.castShadow = true;
                         child.receiveShadow = true;
                     }
                 });
                 resolve({ error: false, model: gltf.scene });
            }, undefined, // Progress callback (optional)
            (error) => {
                // Error
                console.error(`[AssetLoader] GLTF loading failed: ${url}`, error);
                resolve({ error: true, model: this.createDebugPlaceholder('GLTF Load Error') });
            });
        });
    }

    // Example for loading textures (add if needed)
    // async loadTexture(url) {
    //     return new Promise((resolve, reject) => {
    //         this.textureLoader.load(url, resolve, undefined, reject);
    //     });
    // }

    createDebugPlaceholder(label = 'Debug Placeholder') {
        const size = 0.5;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({ color: 0xff00ff, wireframe: true }); // Magenta wireframe
        const mesh = new THREE.Mesh(geometry, material);

        // Add a text label (optional, requires CSS2DRenderer setup in main app)
        // const textDiv = document.createElement('div');
        // textDiv.className = 'debug-label'; // Add CSS for styling
        // textDiv.textContent = label;
        // const labelObject = new CSS2DObject(textDiv);
        // labelObject.position.set(0, size / 2 + 0.2, 0); // Position above cube
        // mesh.add(labelObject);

        mesh.position.y = size / 2; // Place base at ground level
        console.warn(`[AssetLoader] Created debug placeholder: ${label}`);
        return mesh;
    }
} 