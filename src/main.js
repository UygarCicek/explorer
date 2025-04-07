import { App } from './App.js';
import * as Logger from './utils/Logger.js'; // Import Logger

// Utility function to check for WebGL support
function checkWebGLSupport() {
   try {
    const canvas = document.createElement('canvas');
    return !!window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
   } catch(e) { return false; }
}

// Main entry point
function main() {
    if (!checkWebGLSupport()) {
        // Display error message directly or use UIManager if it's safe to instantiate
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = "Error: WebGL is not supported or enabled in your browser. Cannot start application.";
            errorDiv.style.display = 'block';
        } else {
            alert("Error: WebGL is not supported or enabled. Cannot start application.");
        }
        // Use Logger for error message
        Logger.error("Main", "WebGL not supported. Application cannot start.");
        return; // Stop execution
    }

    // If WebGL is supported, create the application instance
    new App();
}

// Start the application once the DOM is ready
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', main);
} else {
    main();
} 