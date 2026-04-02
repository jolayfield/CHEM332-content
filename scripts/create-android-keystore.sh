#!/bin/bash
# Create Android release keystore for QuantumChem
# Run this ONCE to generate your signing key. Store the output securely.
# Usage: ./scripts/create-android-keystore.sh

set -e

KEYSTORE_DIR="$(cd "$(dirname "$0")/.." && pwd)/android/keystore"
KEYSTORE_FILE="$KEYSTORE_DIR/quantumchem-release.keystore"

mkdir -p "$KEYSTORE_DIR"

if [ -f "$KEYSTORE_FILE" ]; then
  echo "Keystore already exists at: $KEYSTORE_FILE"
  echo "Delete it first if you want to regenerate."
  exit 0
fi

echo "=== Creating Android Release Keystore ==="
echo "You will be prompted for:"
echo "  - Keystore password (remember this, you need it to sign every release)"
echo "  - Key password (can be same as keystore password)"
echo "  - Your name, organization, city, state, country"
echo ""

keytool -genkey -v \
  -keystore "$KEYSTORE_FILE" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias quantumchem

echo ""
echo "=== Keystore created at: $KEYSTORE_FILE ==="
echo ""
echo "IMPORTANT: Back up this file securely — if you lose it, you cannot"
echo "update your app on the Play Store. Never commit it to git."
echo ""
echo "Add to your .gitignore (already done):"
echo "  android/keystore/"
echo ""
echo "To build a release APK/AAB, export these environment variables:"
echo "  export KEYSTORE_PATH=$KEYSTORE_FILE"
echo "  export KEYSTORE_PASSWORD=<your-password>"
echo "  export KEY_ALIAS=quantumchem"
echo "  export KEY_PASSWORD=<your-key-password>"
echo ""
echo "Then run: ./scripts/build-android.sh release"
