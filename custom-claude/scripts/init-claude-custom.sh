#!/bin/bash

# ClaudeBox Custom Commands Initialization Script
echo "🚀 Initializing ClaudeBox custom commands..."

# Set up custom commands directory
CLAUDE_CUSTOM_DIR="$HOME/.claude-custom"
mkdir -p "$CLAUDE_CUSTOM_DIR/commands"
mkdir -p "$CLAUDE_CUSTOM_DIR/hooks"

# Copy custom commands
cp -r /opt/claudebox-custom/commands/* "$CLAUDE_CUSTOM_DIR/commands/" 2>/dev/null || true
cp -r /opt/claudebox-custom/hooks/* "$CLAUDE_CUSTOM_DIR/hooks/" 2>/dev/null || true

# Make commands executable
chmod +x "$CLAUDE_CUSTOM_DIR/commands/"* 2>/dev/null || true
chmod +x "$CLAUDE_CUSTOM_DIR/hooks/"* 2>/dev/null || true

# Add commands to PATH
export PATH="$CLAUDE_CUSTOM_DIR/commands:$PATH"

# Create aliases for easier access
alias cbtest="node $CLAUDE_CUSTOM_DIR/commands/test-command.js"
alias cbinfo="node $CLAUDE_CUSTOM_DIR/commands/project-info.js"
alias cbgit="bash $CLAUDE_CUSTOM_DIR/hooks/git-helper.sh"

echo "✅ Custom commands initialized!"
echo "Available commands:"
echo "  - cbtest  : Test custom command"
echo "  - cbinfo  : Show project information"
echo "  - cbgit   : Git helper utilities"