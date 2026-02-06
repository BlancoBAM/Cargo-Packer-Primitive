# Crates.io Saver Firefox Extension

A Firefox extension to save crates.io pages to JSON files.

## Features
- Save crate information with one click
- Extract dependencies and metadata
- Auto-save option for visited crates
- Recent saves history
- Configurable options (include README, etc.)

## Installation

### From Source
1. Clone or download this extension
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on"
5. Select any file from the extension folder

### Icons
Place icon files in `icons/` folder:
- icon-16.png
- icon-32.png
- icon-48.png
- icon-64.png
- icon-96.png
- icon-128.png

## Usage
1. Navigate to any crate on crates.io
2. Click the extension icon in the toolbar
3. Click "Save Current Crate"
4. Files are saved to your Downloads folder in `crates/` directory

## Permissions
- `activeTab`: To access the current tab's content
- `downloads`: To save files to your computer
- `storage`: To save extension settings
