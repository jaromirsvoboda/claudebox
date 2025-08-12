#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function safeCmd(cmd) {
  try { return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return ""; }
}

function findRepoRoot(start) {
  let dir = start;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    dir = path.dirname(dir);
  }
  return start;
}

function listFeatureCandidates(notesDir) {
  if (!fs.existsSync(notesDir)) return [];
  return fs.readdirSync(notesDir)
    .filter(f => f.endsWith(".md"))
    .map(f => {
      const full = path.join(notesDir, f);
      return { file: f, full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function inferFeatureFile(candidates) {
  const prioritized = candidates.filter(c => /feature|roadmap|task|plan/i.test(c.file));
  if (prioritized.length) return prioritized[0];
  return candidates[0];
}

function promptConfirm(question) {
  if (!process.stdin.isTTY) return Promise.resolve(false);
  return new Promise(resolve => {
    process.stdout.write(question);
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", d => {
      const ans = d.toString().trim().toLowerCase();
      resolve(["y","yes"].includes(ans));
    });
  });
}

async function main() {
  const repoRoot = findRepoRoot(process.cwd());
  const notesDir = path.join(repoRoot, "notes");
  if (!fs.existsSync(notesDir)) {
    console.error("notes directory not found:", notesDir);
    process.exit(1);
  }

  const arg = process.argv.slice(2).join(" ").trim();
  let target;

  if (arg) {
    let name = arg.endsWith('.md') ? arg : arg + '.md';
    if (fs.existsSync(path.join(notesDir, name))) {
      target = { file: name, full: path.join(notesDir, name) };
    } else if (fs.existsSync(path.resolve(arg))) {
      const full = path.resolve(arg);
      target = { file: path.basename(full), full };
    } else {
      console.error("Specified feature file not found:", name);
      process.exit(1);
    }
  } else {
    const candidates = listFeatureCandidates(notesDir);
    if (!candidates.length) {
      console.error("No markdown feature candidates in notes/");
      process.exit(1);
    }
    const guess = inferFeatureFile(candidates);
    const confirmed = await promptConfirm(`Inferred feature file: ${guess.file}. Use this? (y/N): `);
    if (!confirmed) {
      console.log("Aborted. Provide a file name. Candidates:");
      candidates.slice(0, 20).forEach(c => console.log(" -", c.file));
      process.exit(1);
    }
    target = guess;
  }

  let content;
  try { content = fs.readFileSync(target.full, "utf8"); } catch (e) { console.error("Read error:", e.message); process.exit(1); }

  const ts = new Date().toISOString().replace('T',' ').replace(/\..+/,' UTC');
  const branch = safeCmd("git rev-parse --abbrev-ref HEAD");
  const latestCommit = safeCmd("git log -1 --oneline");
  const statusRaw = safeCmd("git status --porcelain");
  let changeSummary = "none";
  if (statusRaw) {
    const lines = statusRaw.split("\n").filter(Boolean);
    const added = lines.filter(l => /^A|^\?\?/.test(l)).length;
    const modified = lines.filter(l => /^ M|^M /.test(l)).length;
    const deleted = lines.filter(l => /^ D|^D /.test(l)).length;
    changeSummary = `+${added} ~${modified} -${deleted}`;
  }

  const openItemsMatches = content.match(/^- \[ \] .+/gm) || [];
  const openItems = openItemsMatches.slice(0,5).map(l => l.replace(/^- \[ \] /,''));

  const updateBlock = `\n## Progress ${ts}\n\nContext:\n- Branch: ${branch || 'n/a'}\n- Commit: ${latestCommit || 'n/a'}\n- Changes: ${changeSummary}\n- PWD: ${process.cwd().replace(repoRoot,'.')}\n\nPlan (succinct):\n- Current Focus: <fill>\n- Next Step: <single actionable step>\n- Risks: <list or none>\n\nOpen Items:\n${openItems.length ? openItems.map(i => `- [ ] ${i}`).join('\n') : '- [ ] <add next task>'}\n\n---\n`;

  if (content.includes(updateBlock.slice(0,25))) {
    console.log("Similar block detected; not adding duplicate.");
    process.exit(0);
  }

  try { fs.writeFileSync(target.full, content.trimEnd() + updateBlock, "utf8"); } catch (e) { console.error("Write error:", e.message); process.exit(1); }
  console.log("Updated feature file:", target.full);
}

main();
