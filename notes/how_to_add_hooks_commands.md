# How to Add Custom Commands and Hooks to ClaudeBox

A practical step-by-step guide for adding custom commands that actually work, accounting for Docker cache issues.

## 🚀 Quick Start (TL;DR)

**For Commands:**
1. Create file in `custom-claude/commands/` (chmod +x optional - done automatically)
2. Add alias in `custom-claude/scripts/init-claude-custom.sh` (line 23-26 area)
3. `bash .builder/build.sh` 
4. `rm -rf ~/.claudebox && ./claudebox.run`
5. Test: `cd /project && claudebox && your-command`

**For Hooks:**
1. Create file in `custom-claude/hooks/` (chmod +x optional - done automatically)
2. Hooks are copied automatically - no manual integration needed
3. `bash .builder/build.sh`
4. `rm -rf ~/.claudebox && ./claudebox.run`
5. Test: Call your hook manually or integrate it where needed

**⚠️ Critical:** Always use `rm -rf ~/.claudebox` - regular rebuild doesn't work due to Docker cache!

---

## Detailed Guide

### Quick Overview

ClaudeBox custom commands are built into Docker images during the build process. The main challenge is Docker's aggressive caching, which often prevents new commands from being included even after rebuilds.

## Step-by-Step Process

### 1. Create Your Custom Commands OR Hooks

#### Adding Custom Commands

Navigate to the `custom-claude/commands/` directory and create your command file:

```bash
cd /path/to/claudebox/repo
ls custom-claude/commands/  # Should see existing: test-command.js, project-info.js
```

**Create a new command file:**
```bash
# Example: Create a new JavaScript command
cat > custom-claude/commands/my-command.js << 'EOF'
#!/usr/bin/env node

console.log('🎯 My custom command is working!');
console.log('Current directory:', process.cwd());
console.log('Arguments:', process.argv.slice(2));
EOF

chmod +x custom-claude/commands/my-command.js
```

**Or create a shell script:**
```bash
# Example: Create a bash command
cat > custom-claude/commands/my-script.sh << 'EOF'
#!/bin/bash
echo "🚀 Custom bash command executed!"
echo "Working directory: $(pwd)"
echo "Git status:"
git status --porcelain || echo "Not a git repository"
EOF

chmod +x custom-claude/commands/my-script.sh
```

#### Adding Custom Hooks

Hooks are scripts that run automatically during container lifecycle events. Navigate to the `custom-claude/hooks/` directory:

```bash
cd /path/to/claudebox/repo
ls custom-claude/hooks/  # Should see existing: git-helper.sh
```

**Create a startup hook (runs when container starts):**
```bash
# Create a hook that runs every time a container starts
cat > custom-claude/hooks/startup-hook.sh << 'EOF'
#!/bin/bash

echo "🚀 Container startup hook running..."

# Example: Set up project-specific environment
if [[ -f package.json ]]; then
    echo "📦 Node.js project detected"
    export NODE_ENV="${NODE_ENV:-development}"
    
    # Auto-install dependencies if node_modules is missing
    if [[ ! -d node_modules ]]; then
        echo "📥 Installing npm dependencies..."
        npm install --silent
    fi
fi

# Example: Set up Python environment  
if [[ -f requirements.txt ]]; then
    echo "🐍 Python project detected"
    
    # Auto-create virtual environment if missing
    if [[ ! -d .venv ]]; then
        echo "📥 Creating Python virtual environment..."
        python3 -m venv .venv
        source .venv/bin/activate
        pip install -r requirements.txt
    fi
fi

# Example: Set up git hooks
if [[ -d .git ]] && [[ ! -f .git/hooks/pre-commit ]]; then
    echo "🔧 Setting up git pre-commit hook..."
    cat > .git/hooks/pre-commit << 'HOOK_EOF'
#!/bin/bash
echo "Running pre-commit checks..."
# Add your pre-commit logic here
HOOK_EOF
    chmod +x .git/hooks/pre-commit
fi

echo "✅ Startup hook completed"
EOF

chmod +x custom-claude/hooks/startup-hook.sh
```

**Create a shutdown hook (runs when container exits):**
```bash
# Create a hook that runs when container is stopping
cat > custom-claude/hooks/shutdown-hook.sh << 'EOF'  
#!/bin/bash

echo "🛑 Container shutdown hook running..."

# Example: Save session state
if [[ -f .claude-session ]]; then
    cp .claude-session ~/.claude-custom/last-session-$(date +%Y%m%d-%H%M%S)
    echo "💾 Session state saved"
fi

# Example: Clean up temporary files
rm -f /tmp/claude-* 2>/dev/null || true
echo "🧹 Temporary files cleaned"

echo "✅ Shutdown hook completed"
EOF

chmod +x custom-claude/hooks/shutdown-hook.sh
```

**Create a project detection hook:**
```bash
# Create a hook that detects project type and sets up environment
cat > custom-claude/hooks/project-setup.sh << 'EOF'
#!/bin/bash

detect_project_type() {
    echo "🔍 Detecting project type..."
    
    if [[ -f Cargo.toml ]]; then
        echo "🦀 Rust project detected"
        export PROJECT_TYPE="rust"
        alias build='cargo build'
        alias test='cargo test'
        alias run='cargo run'
        
    elif [[ -f go.mod ]]; then
        echo "🐹 Go project detected"  
        export PROJECT_TYPE="go"
        alias build='go build'
        alias test='go test ./...'
        alias run='go run .'
        
    elif [[ -f pom.xml ]]; then
        echo "☕ Java/Maven project detected"
        export PROJECT_TYPE="java"
        alias build='mvn compile'
        alias test='mvn test' 
        alias run='mvn spring-boot:run'
        
    elif [[ -f package.json ]]; then
        echo "📦 Node.js project detected"
        export PROJECT_TYPE="nodejs"
        alias build='npm run build'
        alias test='npm test'
        alias start='npm start'
        
    elif [[ -f requirements.txt ]] || [[ -f pyproject.toml ]]; then
        echo "🐍 Python project detected"
        export PROJECT_TYPE="python"
        alias test='pytest'
        alias lint='flake8'
        alias format='black .'
        
    else
        echo "❓ Generic project"
        export PROJECT_TYPE="generic"
    fi
    
    echo "Project type set to: $PROJECT_TYPE"
}

# Run project detection
detect_project_type
EOF

chmod +x custom-claude/hooks/project-setup.sh
```

### 2. Add Commands/Hooks to Initialization Script

**For Custom Commands - Add Aliases:**
```bash
# Edit the init script
vim custom-claude/scripts/init-claude-custom.sh

# Add your command aliases to the existing aliases section:
alias cbtest='node ~/.claude-custom/commands/test-command.js'
alias cbinfo='node ~/.claude-custom/commands/project-info.js'  
alias cbgit='bash ~/.claude-custom/hooks/git-helper.sh'
alias cbmy='node ~/.claude-custom/commands/my-command.js'        # <-- ADD THIS
alias cbscript='bash ~/.claude-custom/commands/my-script.sh'     # <-- OR THIS
```

**For Custom Hooks - Add Hook Execution:**
```bash
# Edit the same init script to run your hooks
vim custom-claude/scripts/init-claude-custom.sh

# Add hook execution after the aliases section:
echo "🚀 Initializing ClaudeBox custom commands..."

# Set up aliases (existing code)
alias cbtest='node ~/.claude-custom/commands/test-command.js'
# ... other aliases ...

# Add hook execution here:
echo "🔧 Running custom hooks..."

# Run startup hooks
if [[ -f ~/.claude-custom/hooks/startup-hook.sh ]]; then
    bash ~/.claude-custom/hooks/startup-hook.sh
fi

# Run project setup hook  
if [[ -f ~/.claude-custom/hooks/project-setup.sh ]]; then
    source ~/.claude-custom/hooks/project-setup.sh  # Use 'source' to preserve exports/aliases
fi

# Set up exit hook to run on container shutdown
if [[ -f ~/.claude-custom/hooks/shutdown-hook.sh ]]; then
    trap 'bash ~/.claude-custom/hooks/shutdown-hook.sh' EXIT
fi

export CLAUDEBOX_CUSTOM="enabled"
echo "✅ Custom commands and hooks initialized!"
```

### 3. Build New Installer (CRITICAL STEP)

**This step packages your new commands into the ClaudeBox installer:**

```bash
# From the claudebox repo root
bash .builder/build.sh

# Verify the build completed successfully
ls -la claudebox.run  # Should have a recent timestamp
```

### 4. Force Complete Clean Installation

**This is the most critical step** - Docker caching will prevent your commands from being included unless you do a complete clean installation:

```bash
# If you're currently in a ClaudeBox container, exit first
exit

# Remove ALL ClaudeBox data to force fresh installation
rm -rf ~/.claudebox

# Install the updated version
./claudebox.run

# The installer should show it's setting up ClaudeBox fresh
```

### 5. Test in a Fresh Container

Navigate to any project directory and start ClaudeBox:

```bash
cd /some/project/directory
claudebox

# Inside the container, test your new commands:
cbmy        # Should run your JavaScript command
cbscript    # Should run your bash script
cbtest      # Should still work (existing command)
```

### 6. Verify Installation Success

**Inside the container, run these diagnostic commands:**

```bash
# Check if custom directory exists
ls -la ~/.claude-custom/
# Should show: commands/, scripts/, claude-config.json

# Check if your command files are there
ls -la ~/.claude-custom/commands/
# Should show: test-command.js, project-info.js, my-command.js, my-script.sh

# Check if aliases are set
alias | grep cb
# Should show: cbtest, cbinfo, cbgit, cbmy, cbscript

# Check environment variable
echo $CLAUDEBOX_CUSTOM
# Should output: "enabled"
```

## Common Pitfalls and Solutions

### ❌ "Command not found" Error

**Problem:** Your command returns "command not found" inside the container.

**Cause:** Docker used cached layers and didn't include your new commands.

**Solution:**
```bash
# Exit container and force complete rebuild
exit
rm -rf ~/.claudebox
./claudebox.run
cd /project && claudebox
# Test again
```

### ❌ Commands Work in One Project But Not Others

**Problem:** Commands work in the project where you first built them, but not in other projects.

**Cause:** Each project uses its own Docker image, and other projects may be using older cached images.

**Solution:**
```bash
# Go to the problematic project
cd /other/project

# Force rebuild for this project specifically
claudebox rebuild

# Or if that doesn't work, use the nuclear option:
exit  # Exit container
docker system prune -f  # Clear all Docker cache
claudebox  # Will rebuild from scratch
```

### ❌ Installer Finishes Too Quickly

**Problem:** `./claudebox.run` finishes in a few seconds without showing installation progress.

**Cause:** ClaudeBox detected existing installation and only updated the binary.

**Solution:**
```bash
# Force complete reinstallation
rm -rf ~/.claudebox
./claudebox.run
# Should now show full installation progress
```

### ❌ Build Process Doesn't Include Custom Commands

**Problem:** Docker build doesn't show your custom-claude directory being copied.

**Cause:** The build files weren't updated or custom-claude directory is missing.

**Solution:**
```bash
# Verify custom-claude directory exists
ls -la custom-claude/
# Should show: commands/, hooks/, scripts/, claude-config.json

# Rebuild the installer
bash .builder/build.sh

# Check if custom commands were packaged:
mkdir temp_check && cd temp_check
tail -n +$(grep -n "^ARCHIVE:$" ../claudebox.run | cut -d: -f1) ../claudebox.run | tail -n +2 | tar -xz
ls -la  # Should see custom-claude directory
cd .. && rm -rf temp_check
```

## Hook Types and When to Use Them

### Startup Hooks
**When they run:** Every time a container starts  
**Use for:**
- Setting up project-specific environments
- Auto-installing dependencies
- Creating configuration files
- Setting up git hooks
- Displaying project information

### Shutdown Hooks  
**When they run:** When a container is stopping/exiting  
**Use for:**
- Saving session state
- Cleaning up temporary files
- Backing up work
- Sending notifications
- Logging session duration

### Project Setup Hooks
**When they run:** During container startup, but focus on project detection  
**Use for:**  
- Detecting project types (Node.js, Python, Rust, etc.)
- Setting project-specific aliases and environment variables
- Configuring development tools
- Setting up language-specific paths

### Git Hooks Integration
**When they run:** On git operations (commit, push, merge, etc.)  
**Use for:**
- Code formatting before commits
- Running tests before push
- Validating commit messages
- Updating documentation
- Running security scans

## Command Development Tips

### JavaScript Commands
- Use `#!/usr/bin/env node` shebang
- Access command arguments with `process.argv.slice(2)`
- Use `process.cwd()` for current directory
- Handle errors gracefully with try/catch

### Bash Commands
- Use `#!/bin/bash` shebang
- Access arguments with `$1`, `$2`, etc.
- Use `$(pwd)` for current directory
- Include error handling with `set -e`

### Hook Development Tips
- Use `#!/bin/bash` shebang for hooks
- Always include error handling: `set -e` at the top
- Use `source` instead of `bash` when you need to preserve environment variables/aliases
- Test hook logic independently before integrating
- Use conditional checks to avoid errors: `[[ -f file ]] && do_something`
- Provide user feedback: echo messages about what the hook is doing
- Keep hooks fast - they run on every container start
- Use `trap` for cleanup operations that must run on exit

### Hook Best Practices
```bash
#!/bin/bash
set -e  # Exit on any error

# Provide user feedback
echo "🔧 Setting up project environment..."

# Use conditional checks
if [[ -f package.json ]]; then
    # Do Node.js setup
    echo "📦 Node.js project detected"
fi

# Handle errors gracefully
npm install --silent 2>/dev/null || {
    echo "⚠️ Warning: npm install failed, continuing..."
}

echo "✅ Project setup completed"
```

### File Permissions
Always make your command and hook files executable:
```bash
chmod +x custom-claude/commands/your-command.js
chmod +x custom-claude/commands/your-script.sh  
chmod +x custom-claude/hooks/your-hook.sh
```

## Quick Reference Checklist

### When adding a new custom command:
- [ ] Create command file in `custom-claude/commands/`
- [ ] Make file executable with `chmod +x`
- [ ] Add alias in `custom-claude/scripts/init-claude-custom.sh`
- [ ] Run `bash .builder/build.sh` to build installer
- [ ] Run `rm -rf ~/.claudebox` to force clean install
- [ ] Run `./claudebox.run` to install updated version
- [ ] Test in container: `cd /project && claudebox && your-command`
- [ ] Verify with diagnostic commands if it doesn't work

### When adding a new custom hook:
- [ ] Create hook file in `custom-claude/hooks/`
- [ ] Make file executable with `chmod +x`
- [ ] Add hook execution in `custom-claude/scripts/init-claude-custom.sh`
- [ ] Choose appropriate hook type (startup/shutdown/project-setup)
- [ ] Use `bash` for one-time execution or `source` to preserve environment
- [ ] Set up `trap` for exit hooks if needed
- [ ] Run `bash .builder/build.sh` to build installer
- [ ] Run `rm -rf ~/.claudebox` to force clean install  
- [ ] Run `./claudebox.run` to install updated version
- [ ] Test in container: `cd /project && claudebox` (hooks run automatically)
- [ ] Verify hook output appears during container startup

## Emergency Reset

If everything breaks and commands stop working:

```bash
# Nuclear option - completely start over
exit  # Exit container
docker system prune -af  # Remove ALL Docker data
rm -rf ~/.claudebox  # Remove ClaudeBox installation
./claudebox.run  # Reinstall fresh
cd /project && claudebox && cbtest  # Verify basic commands work
```

This should get you back to a working state where at least the basic commands (cbtest, cbinfo, cbgit) function properly.