#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function getProjectInfo() {
    const workspace = '/workspace';
    const info = {
        timestamp: new Date().toISOString(),
        workspace: workspace,
        files: [],
        gitStatus: null
    };
    
    try {
        // List workspace files
        info.files = fs.readdirSync(workspace).slice(0, 10);
        
        // Check if it's a git repo
        if (fs.existsSync(path.join(workspace, '.git'))) {
            info.gitStatus = "Git repository detected";
        }
        
        // Check for package.json
        if (fs.existsSync(path.join(workspace, 'package.json'))) {
            const pkg = JSON.parse(fs.readFileSync(path.join(workspace, 'package.json'), 'utf8'));
            info.projectName = pkg.name;
            info.projectVersion = pkg.version;
        }
    } catch (e) {
        info.error = e.message;
    }
    
    console.log("📊 Project Information:");
    console.log(JSON.stringify(info, null, 2));
}

getProjectInfo();