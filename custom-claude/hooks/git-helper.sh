#!/bin/bash

# Git helper hook for ClaudeBox
# This hook provides quick git status and common operations

echo "🔧 ClaudeBox Git Helper Hook"

if [ -d "/workspace/.git" ]; then
    echo "📁 Repository detected in /workspace"
    echo ""
    echo "Current branch:"
    git -C /workspace branch --show-current
    echo ""
    echo "Recent commits:"
    git -C /workspace log --oneline -5
    echo ""
    echo "Status:"
    git -C /workspace status -s
else
    echo "❌ No git repository found in /workspace"
    echo "💡 Initialize with: git init"
fi