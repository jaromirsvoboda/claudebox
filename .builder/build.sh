#!/bin/bash
# Build the ClaudeBox self-extracting installer script
# Packages entire repo for extraction to ~/.claudebox/
# If you encounter $'\r': command not found, convert line endings: sed -i 's/\r$//' .builder/build.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

MAIN_SH="${REPO_ROOT}/main.sh"
if [[ ! -f "$MAIN_SH" ]]; then
  echo "❌ main.sh not found (expected at $MAIN_SH). Run from a ClaudeBox repo clone." >&2
  exit 1
fi

# Normalize line endings (CRLF -> LF) before packaging
echo "🔍 Normalizing line endings (CRLF -> LF) for shell scripts..."
find "$REPO_ROOT" \( -name '*.sh' -o -name 'Dockerfile' -o -name 'Dockerfile.*' \) -type f -print0 | xargs -0 sed -i 's/\r$//'
echo "✅ Line ending normalization complete"

# Extract version safely
VERSION=$(grep -m1 'readonly CLAUDEBOX_VERSION=' "$MAIN_SH" | cut -d'"' -f2)
if [[ -z "$VERSION" ]]; then
  echo "❌ Could not extract version from main.sh" >&2
  exit 1
fi

echo "🔨 Building ClaudeBox v$VERSION (repo: $REPO_ROOT)"

DIST_DIR="${REPO_ROOT}/dist"
echo "🧹 Cleaning dist directory..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

TEMPLATE="${REPO_ROOT}/.builder/script_template_root.sh"
OUTPUT="${DIST_DIR}/claudebox.run"
ARCHIVE="${DIST_DIR}/claudebox-${VERSION}.tar.gz"

# Create archive in temp location to avoid "file changed as we read it" error
TEMP_ARCHIVE="/tmp/claudebox_archive_$$.tar.gz"

echo "📦 Creating archive..."
(
  cd "$REPO_ROOT"
  tar -czf "$TEMP_ARCHIVE" \
    --exclude='.git' \
    --exclude='.gitignore' \
    --exclude='.github' \
    --exclude='.builder' \
    --exclude='.claude' \
    --exclude='.vscode' \
    --exclude='.idea' \
    --exclude='.mcp.json' \
    --exclude='dist' \
    --exclude='claudebox.run' \
    --exclude='*.swp' \
    --exclude='*~' \
    --exclude='archive.tar.gz' \
    --exclude='*.tar.gz' \
    .
)

# Move to final location
mv "$TEMP_ARCHIVE" "$ARCHIVE"

# Calculate SHA256
if command -v sha256sum >/dev/null 2>&1; then
  SHA256=$(sha256sum "$ARCHIVE" | awk '{print $1}')
elif command -v shasum >/dev/null 2>&1; then
  SHA256=$(shasum -a 256 "$ARCHIVE" | awk '{print $1}')
else
  echo "❌ sha256sum or shasum required" >&2
  exit 1
fi

# Create final script with SHA256 embedded
echo "🔧 Assembling $OUTPUT..."
sed "s/__ARCHIVE_SHA256__/$SHA256/g" "$TEMPLATE" > "$OUTPUT"
cat "$ARCHIVE" >> "$OUTPUT"
chmod +x "$OUTPUT"

# Keep the archive (don't delete it)

echo "✅ Files created:"
echo "   📦 Installer: $OUTPUT ($(ls -lh "$OUTPUT" | awk '{print $5}'))"
echo "   📄 Archive: $ARCHIVE ($(ls -lh "$ARCHIVE" | awk '{print $5}'))"
echo "   🔐 SHA256: $SHA256"

# Create a symlink from the root for backward compatibility
ln -sf "$OUTPUT" "${REPO_ROOT}/claudebox.run"
