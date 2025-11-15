#!/bin/bash

# CHANGE THIS to your extension UUID folder name
EXT_ID="memory-pressure-indicator@local"

# ZIP name
ZIP_NAME="${EXT_ID}.zip"

echo "==> Creating extension ZIP..."
rm -f "$ZIP_NAME"
zip -r "$ZIP_NAME" . \
    -x "*.sh" \
    -x "*.zip" \
    -x ".*" 

if [ ! -f "$ZIP_NAME" ]; then
    echo "Error: ZIP not created!"
    exit 1
fi

echo "==> Uninstall previous extension (if exists)..."
gnome-extensions uninstall "$EXT_ID" 2>/dev/null

echo "==> Installing extension from ZIP..."
gnome-extensions install "$ZIP_NAME" --force

echo "==> Enabling extension..."
gnome-extensions enable "$EXT_ID"

echo "==> Done!"
