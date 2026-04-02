#!/bin/bash
# iOS Build Script for QuantumChem
# Usage: ./scripts/build-ios.sh [release|debug]
# Requires: Xcode, Apple Developer account configured in Xcode

set -e

BUILD_TYPE=${1:-debug}
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== QuantumChem iOS Build ==="
echo "Build type: $BUILD_TYPE"
echo "Project root: $PROJECT_ROOT"

# Load NVM
source ~/.nvm/nvm.sh 2>/dev/null || true

# Step 1: Build web assets
echo ""
echo "--- Step 1: Building web assets ---"
cd "$PROJECT_ROOT"
npm run build

# Step 2: Sync to iOS
echo ""
echo "--- Step 2: Syncing to iOS ---"
npx cap sync

# Step 3: Build with Xcode
echo ""
echo "--- Step 3: Building iOS app ---"
cd "$PROJECT_ROOT/ios/App"

if [ "$BUILD_TYPE" = "release" ]; then
  echo "Building RELEASE (for App Store submission)..."
  mkdir -p "$PROJECT_ROOT/build"
  xcodebuild \
    -project App.xcodeproj \
    -scheme App \
    -configuration Release \
    -destination generic/platform=iOS \
    -archivePath "$PROJECT_ROOT/build/QuantumChem.xcarchive" \
    archive \
    CODE_SIGN_STYLE=Automatic

  echo ""
  echo "--- Archive complete: $PROJECT_ROOT/build/QuantumChem.xcarchive ---"
  echo "Next: Open Xcode Organizer and click 'Distribute App' to upload to App Store Connect."
else
  echo "Building DEBUG (for simulator/device testing)..."
  xcodebuild \
    -project App.xcodeproj \
    -scheme App \
    -configuration Debug \
    -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
    build \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO
  echo ""
  echo "--- Debug build complete ---"
fi

echo ""
echo "=== iOS Build Finished ==="
