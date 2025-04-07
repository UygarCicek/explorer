// --- Constants ---
import * as THREE from 'three'; // Import THREE here if needed for DOWN_VECTOR

export const PLANE_SIZE = 120;
export const NUM_ROCKS = 300;
export const NUM_PLANTS = 100;
export const ROCK_DISTRIBUTION_FACTOR = 0.9;
export const MODEL_GROUND_OFFSET = 0.1;
export const MARS_ATMOSPHERE_COLOR = 0xd8a07a;
export const DOWN_VECTOR = new THREE.Vector3(0, -1, 0);

// Truck & Wheel Constants
export const WHEEL_CONSTANTS = {
    RADIUS: 0.35,
    THICKNESS: 0.2,
    STEERING_SPEED: 2.0,
    MAX_STEERING_ANGLE: Math.PI / 6,
};

export const TRUCK_CONSTANTS = {
    BODY_WIDTH: 1.5,
    HOOD_LENGTH: 0.7,
    HOOD_HEIGHT: 0.6,
    CABIN_LOWER_HEIGHT: 0.6,
    CABIN_UPPER_HEIGHT: 0.4,
    CABIN_LENGTH: 1.2,
    BED_LENGTH: 1.6,
    BED_WALL_HEIGHT: 0.5,
    BED_FLOOR_THICKNESS: 0.1,
    FRONT_AXLE_OFFSET: -0.3,
    REAR_AXLE_OFFSET: 0.2,
    MOVE_SPEED: 6.0,
    ROTATE_SPEED: 1.5
};

// Version History
export const CURRENT_VERSION_INFO = {
    version: "2.0.2",
    date: "Today",
    change: "Correct low-poly wheel tread rotation"
}; 