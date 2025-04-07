import { ModuleLogger } from '../../utils/Logger.js'; // Import Logger

export class UIManager {
    constructor() {
        this.logger = new ModuleLogger("UIManager"); // Add logger
        this.buildInfoDiv = document.getElementById('build-info');
        this.errorDiv = document.getElementById('error-message');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.storageKey = 'marsExplorerChangeHistory';
        this.maxHistory = 10; // Display last 10 entries

        if (!this.buildInfoDiv || !this.errorDiv || !this.loadingIndicator) {
            this.logger.error("Could not find all required UI elements!");
            // Optionally throw an error here if these elements are critical
        }
    }

    // Logs the current version info to localStorage
    logChange(versionInfo) {
        if (!versionInfo) return;

        try {
            const history = this.getHistoryFromStorage();
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            const timestamp = `${versionInfo.date} ${timeString}`; // Combine date from config with current time

            // Avoid adding duplicate entries for the same version on refresh
            if (!history.some(entry => entry.version === versionInfo.version)) {
                const newEntry = {
                    version: versionInfo.version,
                    timestamp: timestamp,
                    change: versionInfo.change
                };
                history.unshift(newEntry); // Add to the beginning

                // Keep only the last N entries (already set to 10)
                const trimmedHistory = history.slice(0, this.maxHistory);
                localStorage.setItem(this.storageKey, JSON.stringify(trimmedHistory));
                this.logger.info("Logged change:", newEntry);
            }
        } catch (e) {
            this.logger.error("Failed to log change to localStorage:", e);
        }
    }

    // Retrieves history array from localStorage
    getHistoryFromStorage() {
        try {
            const storedHistory = localStorage.getItem(this.storageKey);
            return storedHistory ? JSON.parse(storedHistory) : [];
        } catch (e) {
            this.logger.error("Failed to retrieve history from localStorage:", e);
            return []; // Return empty array on error
        }
    }

    displayError(message) {
        this.logger.error("Displaying critical error to user:", message);
        if (this.errorDiv) {
            this.errorDiv.textContent = "Error: " + message + "\nPlease check the browser console (F12) for details.";
            this.errorDiv.style.display = 'block';
        }
        this.hideLoading(); // Hide loading indicator on error
    }

    hideError() {
        if (this.errorDiv) {
            this.errorDiv.style.display = 'none';
        }
    }

    showLoading(message = "Loading...") {
        if (this.loadingIndicator) {
            this.loadingIndicator.textContent = message;
            this.loadingIndicator.style.display = 'block';
        }
    }

    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
    }

    updateBuildInfo(versionInfo) {
        if (!versionInfo) return; // Exit if no version info provided
        
        // Log the current version change first
        this.logChange(versionInfo); 

        if (this.buildInfoDiv) {
            try {
                const history = this.getHistoryFromStorage();
                const currentVersionEntry = history.find(entry => entry.version === versionInfo.version) || { timestamp: 'N/A', change: versionInfo.change }; // Find the logged entry or use current info

                // Display latest (up to maxHistory) from history
                const historyString = history.slice(0, this.maxHistory).map(entry => 
                    `${entry.version} (${entry.timestamp}): ${entry.change}`
                ).join('<br/>');

                this.buildInfoDiv.innerHTML = 
                    `Ver: ${versionInfo.version} (${currentVersionEntry.timestamp})<br/>` +
                    `Last: ${currentVersionEntry.change}<br/><br/>` +
                    `Last ${history.length < this.maxHistory ? history.length : this.maxHistory} Changes:<br/>${historyString}`;

            } catch (e) {
                this.logger.error("Failed to update build info:", e);
                if (this.buildInfoDiv) { // Check again before setting text content
                    this.buildInfoDiv.textContent = "Error updating info.";
                }
            }
        }
    }
} 