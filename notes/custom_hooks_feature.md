# Custom Hooks Feature Specification - IMPLEMENTED

## Overview

**STATUS: ✅ IMPLEMENTATION COMPLETE**

Custom commands and hooks system has been successfully implemented for ClaudeBox, building them directly into the Docker image for maximum control and persistence. This provides standardized custom commands that are available in every new container instance automatically.

## Implementation Summary

The implementation follows the Docker image embedding approach rather than the `common.sh` mechanism, providing:

1. **Built-in custom commands**: Commands are baked into every Docker container
2. **Automatic initialization**: Custom commands load automatically on container startup
3. **No manual setup**: Works out-of-the-box in all projects after rebuild
4. **True persistence**: Commands survive all container recreation

## Files Created

### Directory Structure
```
custom-claude/
├── commands/
│   ├── test-command.js         # Test custom command
│   └── project-info.js         # Project information display
├── hooks/
│   └── git-helper.sh           # Git status and utilities
├── scripts/
│   └── init-claude-custom.sh   # Initialization script
└── claude-config.json          # Configuration file
```

### Available Commands After Installation

**Inside any ClaudeBox container:**
- `cbtest` - Test custom command system (shows environment info)
- `cbinfo` - Display project information (files, git status, package.json data)
- `cbgit` - Enhanced git status with branch, commits, and status

### Docker Integration

**Modified Files:**
- `build/Dockerfile` - Added custom commands integration section
- Created complete custom-claude directory structure
- `test-custom-commands.sh` - Validation script

**Integration Points:**
- Commands copied to `/opt/claudebox-custom/` in image
- Initialization script added to `.zshrc` and `.bashrc`
- Proper permissions set on all executable files
- Configuration copied to user's home directory

## How to Apply Changes

### Critical: Docker Images Must Be Rebuilt

The `claudebox.run` installer only updates the binary - **Docker images need rebuilding** to include custom commands.

### Build and Install Process

1. **Build updated installer:**
```bash
bash .builder/build.sh
./claudebox.run
```

2. **Force clean rebuild (Recommended):**
```bash
# Remove existing installation to force fresh build
rm -rf ~/.claudebox

# Reinstall with custom changes
./claudebox.run

# Navigate to project - will build fresh images with custom commands
cd /some/project
claudebox
```

3. **Or rebuild existing projects:**
```bash
cd /existing/project
claudebox rebuild
claudebox
```

## Testing and Verification

### 1. Verify Build Process
When running `claudebox` in a project, you should see Docker building:
```
Building ClaudeBox image...
Step X/XX : COPY custom-claude /opt/claudebox-custom
...
```

### 2. Test Custom Commands
```bash
claudebox
# Inside container:
cbtest    # Should show: "🎉 Custom ClaudeBox command is working!"
cbinfo    # Should show project information JSON
cbgit     # Should show git status and recent commits
```

### 3. Verify Initialization
```bash
# Check if initialization ran
echo $CLAUDEBOX_CUSTOM    # Should output: "enabled"

# Check custom commands directory
ls ~/.claude-custom/commands/
# Should show: project-info.js test-command.js
```

### 4. Startup Message
Container startup should show:
```
🚀 Initializing ClaudeBox custom commands...
✅ Custom commands initialized!
Available commands:
  - cbtest  : Test custom command
  - cbinfo  : Show project information
  - cbgit   : Git helper utilities
```

## Troubleshooting

### Commands Not Found (COMMON ISSUE)
- **Problem**: `cbtest` command doesn't exist inside container
- **Root Cause**: Docker used cached layers during rebuild, so custom commands weren't included
- **Symptoms**:
  - `cbtest` returns "command not found"
  - `~/.claude-custom/` directory doesn't exist in container
  - No custom command aliases are set
  - PATH doesn't include custom commands directory
- **Solution**: Force complete Docker rebuild without cache

### Force Docker Rebuild (CRITICAL FIX)
When you modify custom commands/hooks, Docker often uses cached layers and doesn't include your changes:

```bash
# Method 1: Force rebuild without cache
exit  # Exit container first
docker system prune -f  # Clean Docker cache
claudebox rebuild --force  # If this flag exists

# Method 2: Complete clean installation (RECOMMENDED)
exit  # Exit container first
rm -rf ~/.claudebox  # Remove entire ClaudeBox installation
./claudebox.run  # Reinstall from scratch
cd /your/project
claudebox  # Will build fresh Docker image with custom commands
```

### Verify Docker Cache Issue
Check if Docker is using cached layers:
```bash
claudebox rebuild
# Look for "CACHED" in build output - this means changes weren't included:
# => CACHED [3/4] COPY --chown=claude docker-entrypoint.sh /usr/local/bin/docker-entrypoint
# => CACHED [4/4] RUN sed -i "s#DOCKERUSER#claude#g" /usr/local/bin/docker-entrypoint

# Should see actual building for custom commands:
# => [5/6] COPY custom-claude /opt/claudebox-custom
# => [6/6] RUN chmod +x /opt/claudebox-custom/scripts/*.sh
```

### Quick Installation Check
- **Problem**: `claudebox.run` finished too quickly
- **Cause**: Detected existing installation, only updated binary
- **Solution**: Remove `~/.claudebox` and reinstall, or use `claudebox rebuild`

### Verify Custom Commands Are in Container
```bash
# Inside container - these should all exist if properly built:
ls -la ~/.claude-custom/  # Should exist with commands/ directory
echo $CLAUDEBOX_CUSTOM    # Should output: "enabled"
alias | grep cb           # Should show cbtest, cbinfo, cbgit aliases
echo $PATH | grep claude-custom  # Should include custom commands path
```

### Verify Packaging
```bash
# Check if custom commands were packaged
mkdir temp_check && cd temp_check
tail -n +XX ../claudebox.run | tar -xz  # Find correct line number
ls -la  # Should see 'custom-claude' directory
```

### When Making Any Custom Command Changes
**ALWAYS** follow this process after modifying custom commands or hooks:

1. **Build new installer**: `bash .builder/build.sh`
2. **Force complete rebuild**: `rm -rf ~/.claudebox && ./claudebox.run`
3. **Test in fresh container**: `cd /project && claudebox && cbtest`

**Never rely on `claudebox rebuild` alone** - it often uses cached layers that don't include your changes.

## Architecture Benefits

1. **Zero configuration** - Works immediately in all projects
2. **True portability** - Commands built into immutable Docker images
3. **Team consistency** - Same commands available for all team members
4. **Persistent across updates** - Commands survive container recreation
5. **Extensible** - Easy to add more commands by editing custom-claude directory

## Future Enhancements

**Ready for Extension:**
- Add more sophisticated commands (database helpers, API testers)
- Create project-specific template commands
- Integrate with Claude Code's task system
- Add MCP server configurations
- Build command marketplace/sharing system

## Maintenance Process

**To Update Custom Commands:**
1. Edit files in `custom-claude/` directory
2. Run `bash .builder/build.sh` to rebuild installer
3. Run `./claudebox.run` to update installation
4. Use `claudebox rebuild` for existing projects
5. New projects automatically get updated commands

**Note**: Custom commands become part of the immutable Docker image, ensuring consistency across all environments and team members.

### 1. Leverage Existing `common.sh` Mechanism

Instead of complex Docker image embedding, use the existing infrastructure:

**Current**: Container sources `.claudebox/common.sh` if it exists
**Enhanced**: Provide template `common.sh` with standardized hook sections

### 2. Hook Organization Within `common.sh`

Structure the `common.sh` file with clear sections:

```bash
#!/bin/bash
# ClaudeBox Custom Hooks - Auto-generated template

# ============================================================================
# SHELL CUSTOMIZATION
# ============================================================================
# Add your custom aliases here
alias ll='ls -la'
alias gs='git status'
alias gp='git push'

# Add custom functions here
cdp() {
    cd "$(dirname "$(find . -name "*.py" -type f | head -1)")"
}

# Add environment variables here
export EDITOR=vim
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# ============================================================================
# CONTAINER STARTUP HOOKS
# ============================================================================
# Commands that run every time a container starts
setup_git_hooks() {
    if [[ -d /workspace/.git ]] && [[ -d ~/.claudebox/git-hooks ]]; then
        cp ~/.claudebox/git-hooks/* /workspace/.git/hooks/ 2>/dev/null || true
        chmod +x /workspace/.git/hooks/* 2>/dev/null || true
        echo "Applied custom git hooks to project"
    fi
}

# Execute startup hooks
setup_git_hooks

# ============================================================================
# PROJECT-SPECIFIC CUSTOMIZATION
# ============================================================================
# Add project-specific logic here
if [[ -f package.json ]]; then
    # Node.js project detected
    alias nr='npm run'
    alias ni='npm install'
fi

if [[ -f requirements.txt ]] || [[ -f pyproject.toml ]]; then
    # Python project detected
    alias pir='pip install -r requirements.txt'
    alias pytest='python -m pytest'
fi

# ============================================================================
# CUSTOM WELCOME MESSAGE
# ============================================================================
echo "🚀 ClaudeBox environment loaded with custom hooks"
```

### 3. Hook Template System for Portability

**Template Location**: Store template in ClaudeBox installation directory
**Distribution**: Embed template in `claudebox.run` binary
**Extraction**: Copy template to project's `.claudebox/common.sh` if it doesn't exist

### 4. Git Hooks Support

Create standardized directory for git hooks:
```
.claudebox/
├── common.sh           # Main hooks file (already supported)
├── git-hooks/          # Git hooks directory (new)
│   ├── pre-commit
│   ├── post-merge
│   └── pre-push
└── commands/           # Custom commands (already supported)
```

### 5. Implementation Components

**New Template File: `templates/common.sh.template`**
- Pre-structured template with hook sections
- Example aliases and functions
- Git hooks integration
- Project detection logic

**Enhanced Binary Packaging:**
- Include `common.sh.template` in `claudebox.run`
- Extract template on first run in each project
- Never overwrite existing `common.sh` files

**CLI Enhancement:**
```bash
claudebox init-hooks    # Copy template to current project
claudebox edit-hooks    # Open .claudebox/common.sh in $EDITOR
```

### 6. User Experience

**First-time Setup:**
```bash
cd /my/project
claudebox init-hooks    # Creates .claudebox/common.sh from template
$EDITOR .claudebox/common.sh  # Customize as needed
claudebox               # Container starts with custom hooks
```

**Daily Usage:**
```bash
cd /any/project/with/hooks
claudebox               # Hooks automatically loaded
# ll, gs, custom functions all work immediately
```

**Portable Distribution:**
```bash
# Hooks are automatically included when creating claudebox.run
# On new machine:
./claudebox.run install
cd /project
claudebox init-hooks    # Same template available everywhere
```

### 7. Backward Compatibility

- ✅ **100% backward compatible** - uses existing infrastructure
- ✅ **Opt-in only** - no changes unless user runs `init-hooks`
- ✅ **Non-destructive** - never overwrites existing customizations
- ✅ **Graceful fallback** - works exactly as before if no `common.sh` exists

### 8. Implementation Phases

**Phase 1: Template System** (Minimal change)
- Create `templates/common.sh.template`
- Add `claudebox init-hooks` command
- Update binary packaging to include template

**Phase 2: Git Hooks Integration**
- Add git hooks directory support to template
- Enhance template with git hooks installation logic

**Phase 3: Enhanced CLI**
- Add `claudebox edit-hooks` command
- Add validation and examples

**Phase 4: Documentation & Examples**
- Create comprehensive hook examples
- Document common use cases
- Add troubleshooting guide

## Benefits of This Approach

1. **Leverages existing infrastructure** - minimal code changes required
2. **True portability** - template embedded in claudebox.run
3. **Simple mental model** - "just edit .claudebox/common.sh"
4. **Immediate availability** - works in any project directory
5. **Zero breaking changes** - completely backward compatible
6. **Easy debugging** - hooks are just bash code in a readable file

## Technical Implementation

**Existing Infrastructure Used:**
- Docker entrypoint already sources `.claudebox/common.sh`
- Project isolation system already creates per-project `.claudebox` directories
- Command mounting system already handles `.claudebox/commands/`

**Minimal Changes Required:**
1. Create hook template file
2. Add template embedding to build process
3. Add template extraction logic
4. Add simple CLI commands

This approach requires **significantly less code** than the original Docker image embedding proposal while providing the same functionality.
