// content.js - Runs on crates.io pages
console.log("Crates Packer content script loaded");

// Function to extract crate information from the page
function extractCrateInfo() {
    // Get crate name from URL
    const url = window.location.href;
    const crateMatch = url.match(/crates\.io\/crates\/([^\/]+)/);
    if (!crateMatch) return null;
    
    const crateName = crateMatch[1];
    
    // Try to get version (common selectors on crates.io)
    let version = 'unknown';
    const versionElement = document.querySelector('.version') || 
                          document.querySelector('[data-testid="version"]') ||
                          document.querySelector('.details .version');
    if (versionElement) {
        version = versionElement.textContent.trim().replace(/^v/, '');
    }
    
    // Try to get description
    let description = '';
    const descElement = document.querySelector('.description') ||
                       document.querySelector('[data-testid="description"]') ||
                       document.querySelector('.crate-info p');
    if (descElement) {
        description = descElement.textContent.trim();
    }
    
    // Get dependencies count if available
    let dependencies = '0';
    const depsElement = document.querySelector('[href="#dependencies"]') ||
                       document.querySelector('.dependencies');
    if (depsElement) {
        const depsText = depsElement.textContent;
        const depsMatch = depsText.match(/(\d+)/);
        if (depsMatch) dependencies = depsMatch[1];
    }
    
    // Get last updated (if available)
    let updated = new Date().toISOString().split('T')[0];
    const updatedElement = document.querySelector('.last-updated') ||
                          document.querySelector('[title*="Updated"]');
    if (updatedElement) {
        const updatedText = updatedElement.textContent || updatedElement.getAttribute('title');
        const dateMatch = updatedText.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) updated = dateMatch[0];
    }
    
    return {
        name: crateName,
        version: version,
        description: description,
        dependencies: dependencies,
        updated: updated,
        url: url,
        timestamp: new Date().toISOString()
    };
}

// Function to save crate info
function saveCurrentCrate() {
    const crateInfo = extractCrateInfo();
    if (!crateInfo) {
        console.error("Not on a crate page or couldn't extract info");
        return null;
    }
    
    console.log("Extracted crate info:", crateInfo);
    
    // Send to background script for saving
    browser.runtime.sendMessage({
        action: "saveCrate",
        crate: crateInfo
    }).then(response => {
        console.log("Save response:", response);
        // Show success notification
        showNotification(`Saved ${crateInfo.name}@${crateInfo.version}`);
    }).catch(error => {
        console.error("Error saving crate:", error);
        showNotification("Error saving crate", true);
    });
    
    return crateInfo;
}

// Show a temporary notification
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isError ? '#f44336' : '#4CAF50'};
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        z-index: 10000;
        font-family: sans-serif;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        animation: fadeIn 0.3s;
    `;
    
    // Add CSS for animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Listen for messages from popup/background
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Content script received message:", message);
    
    if (message.action === "getCurrentCrate") {
        const crateInfo = extractCrateInfo();
        sendResponse({ success: true, crate: crateInfo });
        return true;
    }
    
    if (message.action === "saveCurrentCrate") {
        const crateInfo = saveCurrentCrate();
        sendResponse({ success: !!crateInfo, crate: crateInfo });
        return true;
    }
    
    if (message.action === "ping") {
        sendResponse({ success: true, message: "Content script alive" });
        return true;
    }
    
    return false;
});

// Auto-save if enabled (check storage first)
browser.storage.local.get(['autoSave']).then(result => {
    if (result.autoSave) {
        // Check if we're on a crate page and auto-save
        if (window.location.href.includes('/crates/')) {
            console.log("Auto-saving crate...");
            setTimeout(() => saveCurrentCrate(), 1000);
        }
    }
});

console.log("Crates Packer ready!");
