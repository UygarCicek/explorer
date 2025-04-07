import * as THREE from 'three';

export class Renderer {
    constructor(container) {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // Re-enable scissor test
        this.renderer.setScissorTest(true); 
        container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => this.onWindowResize(), false);
        console.log("[Renderer] Initialized.");
    }

    onWindowResize() {
        // Renderer size update is correct here
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Camera aspect ratio should be updated in SceneManager or App
    }

    render(scene, camera, truckPosition) {
        if (!scene || !camera) {
             console.warn("[Renderer] Render called without scene or camera.");
             return;
        }

        const fullWidth = window.innerWidth;
        const fullHeight = window.innerHeight;

        // Render Main View (no need for separate viewport/scissor if only one view)
        this.renderer.setViewport(0, 0, fullWidth, fullHeight);
        this.renderer.setScissor(0, 0, fullWidth, fullHeight);
        // Ensure clear is called before rendering the scene
        this.renderer.clear(); 
        this.renderer.render(scene, camera);
    }
} 