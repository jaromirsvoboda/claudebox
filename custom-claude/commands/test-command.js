#!/usr/bin/env node

console.log("🎉 Custom ClaudeBox command is working!");
console.log("Current directory:", process.cwd());
console.log("Environment:", {
    USER: process.env.USER,
    HOME: process.env.HOME,
    WORKSPACE: process.env.WORKSPACE || "Not set"
});