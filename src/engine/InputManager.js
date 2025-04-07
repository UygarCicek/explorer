export class InputManager {
    constructor() {
        this.keys = { KeyW: false, KeyA: false, KeyS: false, KeyD: false, KeyC: false };
        this._setupListeners();
        console.log("[InputManager] Initialized.");
    }

    _setupListeners() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e), false);
        window.addEventListener('keyup', (e) => this.handleKeyUp(e), false);
    }

    handleKeyDown(event) {
        if (event.code in this.keys) {
            if (event.code === 'KeyC' && this.keys.KeyC) return;
            this.keys[event.code] = true;
        }
    }

    handleKeyUp(event) {
        if (event.code in this.keys) {
            this.keys[event.code] = false;
        }
    }

    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }

    getSteeringInput() {
        if (this.isKeyPressed('KeyA')) return 1;
        if (this.isKeyPressed('KeyD')) return -1;
        return 0;
    }

    getMovementInput() {
        if (this.isKeyPressed('KeyW')) return 1;
        if (this.isKeyPressed('KeyS')) return -1;
        return 0;
    }

    isSwitchModelPressed() {
        return this.isKeyPressed('KeyC');
    }
} 