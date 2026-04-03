#!/bin/bash
# Android Build Script for QuantumChem
# Usage: ./scripts/build-android.sh [release|debug]
# Requires: Android Studio or Android SDK, JAVA_HOME set

set -e

BUILD_TYPE=${1:-debug}
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"

echo "=== QuantumChem Android Build ==="
echo "Build type: $BUILD_TYPE"
echo "Project root: $PROJECT_ROOT"

# Load NVM and required env vars
source ~/.nvm/nvm.sh 2>/dev/null || true
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
export ANDROID_HOME=~/android-sdk
export ANDROID_SDK_ROOT=~/android-sdk
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

# Step 1: Build web assets
echo ""
echo "--- Step 1: Building web assets ---"
cd "$PROJECT_ROOT"
npm run build

# Step 2: Sync to Android
echo ""
echo "--- Step 2: Syncing to Android ---"
npx cap sync

# Step 3: Build with Gradle
echo ""
echo "--- Step 3: Building Android app ---"
cd "$ANDROID_DIR"

if [ "$BUILD_TYPE" = "release" ]; then
  echo "Building RELEASE (for Play Store submission)..."
  echo "NOTE: Requires a signing keystore. Set KEYSTORE_PATH, KEYSTORE_PASSWORD,"
  echo "      KEY_ALIAS, and KEY_PASSWORD environment variables, or configure"
  echo "      android/app/build.gradle signingConfigs manually."

  if [ -n "$KEYSTORE_PATH" ]; then
    ./gradlew bundleRelease \
      -Pandroid.injected.signing.store.file="$KEYSTORE_PATH" \
      -Pandroid.injected.signing.store.password="$KEYSTORE_PASSWORD" \
      -Pandroid.injected.signing.key.alias="$KEY_ALIAS" \
      -Pandroid.injected.signing.key.password="$KEY_PASSWORD"

    echo ""
    AAB_PATH="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
    echo "--- Bundle complete: $AAB_PATH ---"
    echo "Upload this .aab file to Google Play Console."
  else
    echo "ERROR: KEYSTORE_PATH not set. See instructions above."
    echo "To create a keystore:"
    echo "  keytool -genkey -v -keystore quantumchem-release.keystore \\"
    echo "    -keyalg RSA -keysize 2048 -validity 10000 -alias quantumchem"
    exit 1
  fi
else
  echo "Building DEBUG (for device/emulator testing)..."
  ./gradlew assembleDebug

  APK_PATH="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
  echo ""
  echo "--- Debug APK: $APK_PATH ---"

  # Install on connected device/emulator if available
  if adb devices 2>/dev/null | grep -q "device$"; then
    echo "Installing on connected device..."
    adb install -r "$APK_PATH"
    echo "--- Installed ---"
  else
    echo "No device connected. To install manually:"
    echo "  adb install $APK_PATH"
  fi
fi

echo ""
echo "=== Android Build Finished ==="
