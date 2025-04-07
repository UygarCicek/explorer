// src/utils/Logger.js
export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4 // To disable all logs
};

// Configuration (can be controlled via GUI later)
let currentLevel = LogLevel.DEBUG; // Default to show all logs during development
let showTimestamp = true;

export function setLogLevel(level) {
    // Ensure level is a valid number from the LogLevel enum
    const validLevels = Object.values(LogLevel);
    if (!validLevels.includes(level)) {
        console.warn(`[Logger] Invalid log level attempted: ${level}. Keeping level ${currentLevel}.`);
        return;
    }
    const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level);
    console.log(`[Logger] Setting log level to: ${levelName} (${level})`);
    currentLevel = level;
}

export function getCurrentLogLevel() {
    return currentLevel;
}

function log(level, module, ...args) {
    if (level < currentLevel) {
        return; // Skip message if below current level
    }

    const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level) || 'LOG';
    const prefix = `[${levelName}]${showTimestamp ? ' [' + new Date().toLocaleTimeString() + ']' : ''}${module ? ' [' + module + ']' : ''}`;

    const consoleMethod =
        level === LogLevel.ERROR ? console.error :
        level === LogLevel.WARN ? console.warn :
        level === LogLevel.INFO ? console.info :
        console.log; // Default to console.log for DEBUG or others

    consoleMethod(prefix, ...args);
}

// Export functions for each level
export function debug(module, ...args) {
    log(LogLevel.DEBUG, module, ...args);
}

export function info(module, ...args) {
    log(LogLevel.INFO, module, ...args);
}

export function warn(module, ...args) {
    log(LogLevel.WARN, module, ...args);
}

export function error(module, ...args) {
    log(LogLevel.ERROR, module, ...args);
}

// Optional: Create a logger instance for a specific module
export class ModuleLogger {
    constructor(moduleName) {
        this.moduleName = moduleName;
    }
    debug(...args) { log(LogLevel.DEBUG, this.moduleName, ...args); }
    info(...args) { log(LogLevel.INFO, this.moduleName, ...args); }
    warn(...args) { log(LogLevel.WARN, this.moduleName, ...args); }
    error(...args) { log(LogLevel.ERROR, this.moduleName, ...args); }
} 