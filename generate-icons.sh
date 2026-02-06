#!/bin/bash
# save as generate-icons.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Firefox Extension Icon Generator${NC}"
echo "================================"

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
    echo -e "${RED}Error: ImageMagick (convert) not found!${NC}"
    echo "Install it with:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/"
    exit 1
fi

# Create icons directory
mkdir -p icons

# Check for input files
if [ ! -f "icon.png" ]; then
    echo -e "${RED}Error: icon.png not found in current directory!${NC}"
    exit 1
fi

echo -e "${YELLOW}1. Generating toolbar and management icons from icon.png...${NC}"

# Firefox icon sizes
sizes=(16 32 48 64 96 128)
for size in "${sizes[@]}"; do
    echo "  Creating ${size}x${size}..."
    
    # Smart resize: maintain aspect ratio, pad if necessary
    convert icon.png \
        -resize "${size}x${size}^" \
        -gravity center \
        -extent "${size}x${size}" \
        -background none \
        "icons/icon-${size}.png"
    
    # Check if successful
    if [ $? -eq 0 ]; then
        echo -e "    ${GREEN}✓${NC} icon-${size}.png"
    else
        echo -e "    ${RED}✗ Failed to create icon-${size}.png${NC}"
    fi
done

echo -e "\n${YELLOW}2. Checking for about page icon...${NC}"

# Process about page icon if it exists
if [ -f "about-icon.png" ]; then
    echo "  Found about-icon.png, creating about page icons..."
    
    # Create 48px version
    convert about-icon.png \
        -resize "48x48^" \
        -gravity center \
        -extent "48x48" \
        -background none \
        "icons/about-48.png"
    
    # Create 96px version  
    convert about-icon.png \
        -resize "96x96^" \
        -gravity center \
        -extent "96x96" \
        -background none \
        "icons/about-96.png"
    
    echo -e "  ${GREEN}✓${NC} about-48.png and about-96.png created"
else
    echo "  about-icon.png not found, using main icon for about page"
    # Copy the 48px and 96px icons we already created
    cp icons/icon-48.png icons/about-48.png
    cp icons/icon-96.png icons/about-96.png
fi

echo -e "\n${GREEN}Done! All icons generated in ./icons/${NC}"
echo ""
echo "Files created:"
ls -la icons/*.png | awk '{print "  " $9 " (" $5 " bytes)"}'
echo ""
echo "Use in your manifest.json:"
echo '{
  "browser_action": {
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    }
  },
  "icons": {
    "48": "icons/icon-48.png",
    "96": "icons/about-96.png"
  }
}'
