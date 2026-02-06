#!/bin/bash
# save as optimize-icons.sh

echo "Optimizing Firefox extension icons..."

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
    echo "Installing ImageMagick..."
    # Try to install (works on Ubuntu/Debian)
    sudo apt-get update && sudo apt-get install -y imagemagick 2>/dev/null || 
    brew install imagemagick 2>/dev/null || 
    echo "Please install ImageMagick manually"
    exit 1
fi

# Create optimized directory
mkdir -p icons/optimized 2>/dev/null

# Optimize each size with appropriate sharpening
for size in 16 32 48 64 96 128; do
    if [ -f "icons/icon-${size}.png" ]; then
        echo "Optimizing ${size}x${size}..."
        
        # Different sharpening for different sizes
        if [ $size -lt 32 ]; then
            # Small icons (16px) need aggressive sharpening
            convert "icons/icon-${size}.png" \
                -unsharp 0.5x0.5+0.5+0.008 \
                -filter Lanczos \
                -resize "${size}x${size}" \
                "icons/optimized/icon-${size}.png"
        elif [ $size -lt 64 ]; then
            # Medium icons
            convert "icons/icon-${size}.png" \
                -unsharp 0.3x0.3+0.3+0.008 \
                -filter Lanczos \
                -resize "${size}x${size}" \
                "icons/optimized/icon-${size}.png"
        else
            # Large icons need subtle sharpening
            convert "icons/icon-${size}.png" \
                -unsharp 0.2x0.2+0.2+0.008 \
                -filter Lanczos \
                -resize "${size}x${size}" \
                "icons/optimized/icon-${size}.png"
        fi
        
        # Optimize PNG compression
        optipng -o2 "icons/optimized/icon-${size}.png" 2>/dev/null || 
        pngquant --force --output "icons/optimized/icon-${size}.png" "icons/optimized/icon-${size}.png" 2>/dev/null ||
        true
    fi
done

# Copy back to original location
cp icons/optimized/*.png icons/ 2>/dev/null

echo "Done! Optimized icons in icons/ directory"
