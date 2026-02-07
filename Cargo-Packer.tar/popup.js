// popup.js - Handles popup UI logic
console.log("Popup script loaded");

// DOM Elements
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const autoSaveToggle = document.getElementById('autoSaveToggle');
const formatSelect = document.getElementById('formatSelect');
const crateDetails = document.getElementById('crateDetails');
const savedCount = document.getElementById('savedCount');
const lastSaved = document.getElementById('lastSaved');
const status = document.getElementById('status');

let currentCrate = null;
let savedCrates = [];

// Update status display
function updateStatus(message, isError = false, timeout = 3000) {
    status.textContent = message;
    status.className = 'status ' + (isError ? 'error' : 'success');
    
    if (timeout > 0) {
        setTimeout(() => {
            status.textContent = 'Ready';
            status.className = 'status';
        }, timeout);
    }
}

// Show loader in status
function showLoader(message = 'Loading...') {
    status.innerHTML = `<div class="loader"></div>`;
    status.className = 'status';
}

// Get current tab's crate info
async function getCurrentCrateInfo() {
    try {
        // Get the active tab
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        // Check if we're on crates.io
        if (!currentTab.url.includes('crates.io')) {
            crateDetails.textContent = 'Not on crates.io. Visit a crate page to save.';
            saveBtn.disabled = true;
            return null;
        }
        
        // Send message to content script to get crate info
        const response = await browser.tabs.sendMessage(currentTab.id, {
            action: "getCurrentCrate"
        });
        
        if (response && response.success && response.crate) {
            currentCrate = response.crate;
            updateCrateDisplay(response.crate);
            saveBtn.disabled = false;
            saveBtn.textContent = `Save ${response.crate.name}`;
            return response.crate;
        } else {
            crateDetails.textContent = 'Not on a crate page. Visit crates.io/crates/* to save.';
            saveBtn.disabled = true;
            return null;
        }
    } catch (error) {
        console.error("Error getting crate info:", error);
        crateDetails.textContent = 'Error loading crate info. Refresh the page.';
        saveBtn.disabled = true;
        return null;
    }
}

// Update crate info display
function updateCrateDisplay(crate) {
    crateDetails.innerHTML = `
        <div><strong>Name:</strong> ${crate.name}</div>
        <div><strong>Version:</strong> ${crate.version}</div>
        <div><strong>Description:</strong> ${crate.description || 'N/A'}</div>
        <div><strong>URL:</strong> ${crate.url}</div>
    `;
}

// Load saved crates count
async function loadSavedCrates() {
    try {
        const response = await browser.runtime.sendMessage({
            action: "getSavedCrates"
        });
        
        if (response.success) {
            savedCrates = response.crates;
            savedCount.textContent = savedCrates.length;
            
            // Update last saved timestamp
            if (savedCrates.length > 0) {
                const last = savedCrates[savedCrates.length - 1];
                const date = new Date(last.timestamp);
                lastSaved.textContent = date.toLocaleDateString();
            } else {
                lastSaved.textContent = 'Never';
            }
        }
    } catch (error) {
        console.error("Error loading saved crates:", error);
    }
}

// Load settings
async function loadSettings() {
    try {
        const response = await browser.runtime.sendMessage({
            action: "getSettings"
        });
        
        if (response.success && response.settings) {
            autoSaveToggle.checked = response.settings.autoSave !== false;
            formatSelect.value = response.settings.saveFormat || 'toml';
        }
    } catch (error) {
        console.error("Error loading settings:", error);
    }
}

// Save current crate
async function saveCurrentCrate() {
    if (!currentCrate) return;
    
    showLoader('Saving crate...');
    saveBtn.disabled = true;
    
    try {
        // Get current tab
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        // Send save command to content script
        const response = await browser.tabs.sendMessage(currentTab.id, {
            action: "saveCurrentCrate"
        });
        
        if (response && response.success) {
            updateStatus(`Saved ${currentCrate.name}@${currentCrate.version}`, false);
            
            // Reload saved count
            await loadSavedCrates();
            
            // Update button text if still same crate
            saveBtn.textContent = `Update ${currentCrate.name}`;
        } else {
            updateStatus('Failed to save crate', true);
        }
    } catch (error) {
        console.error("Save error:", error);
        updateStatus('Error saving crate', true);
    } finally {
        saveBtn.disabled = false;
    }
}

// Export all crates
async function exportAllCrates() {
    showLoader('Exporting...');
    exportBtn.disabled = true;
    
    try {
        const format = formatSelect.value;
        const response = await browser.runtime.sendMessage({
            action: "exportCrates",
            format: format
        });
        
        if (response.success) {
            updateStatus(`Exported ${response.count} crates to ${response.filename}`, false);
        } else {
            updateStatus(`Export failed: ${response.error}`, true);
        }
    } catch (error) {
        console.error("Export error:", error);
        updateStatus('Export failed', true);
    } finally {
        exportBtn.disabled = false;
    }
}

// Clear all saved crates
async function clearAllCrates() {
    if (!confirm('Are you sure you want to clear all saved crates?')) {
        return;
    }
    
    showLoader('Clearing...');
    clearBtn.disabled = true;
    
    try {
        const response = await browser.runtime.sendMessage({
            action: "clearCrates"
        });
        
        if (response.success) {
            updateStatus('Cleared all saved crates', false);
            savedCrates = [];
            savedCount.textContent = '0';
            lastSaved.textContent = 'Never';
        } else {
            updateStatus('Failed to clear crates', true);
        }
    } catch (error) {
        console.error("Clear error:", error);
        updateStatus('Error clearing crates', true);
    } finally {
        clearBtn.disabled = false;
    }
}

// Save settings
async function saveSettings() {
    const settings = {
        autoSave: autoSaveToggle.checked,
        saveFormat: formatSelect.value
    };
    
    try {
        await browser.runtime.sendMessage({
            action: "saveSettings",
            settings: settings
        });
        updateStatus('Settings saved', false, 1500);
    } catch (error) {
        console.error("Error saving settings:", error);
    }
}

// Initialize popup
async function initializePopup() {
    console.log("Initializing popup...");
    
    // Load current crate info
    await getCurrentCrateInfo();
    
    // Load saved crates count
    await loadSavedCrates();
    
    // Load settings
    await loadSettings();
    
    console.log("Popup initialized");
}

// Event listeners
saveBtn.addEventListener('click', saveCurrentCrate);
exportBtn.addEventListener('click', exportAllCrates);
clearBtn.addEventListener('click', clearAllCrates);
autoSaveToggle.addEventListener('change', saveSettings);
formatSelect.addEventListener('change', saveSettings);

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', initializePopup);

// Auto-refresh crate info every 2 seconds while popup is open
setInterval(async () => {
    if (document.visibilityState === 'visible') {
        await getCurrentCrateInfo();
    }
}, 2000);
