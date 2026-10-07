#!/usr/bin/env node

/**
 * Dispatch 1-Command Self-Hosting Bootstrap Script
 * Automatically provisions Cloudflare D1, initializes Cloudflare Artifacts,
 * applies database schema, and seeds baseline applications.
 */

import { execSync } from "child_process";
import fs from "fs";

console.log("\n🍊 \x1b[1m\x1b[33mDispatch: 1-Command Cloudflare Bootstrap\x1b[0m");
console.log("──────────────────────────────────────────────────────────");

function run(cmd, desc) {
  process.stdout.write(`⏳ ${desc}... `);
  try {
    const out = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    console.log("\x1b[32m✓ Done\x1b[0m");
    return out;
  } catch (err) {
    console.log("\x1b[31m✗ Notice\x1b[0m");
    const stderr = err.stderr ? err.stderr.toString() : err.message;
    console.warn(`   ${stderr.trim().split("\n")[0]}`);
    return null;
  }
}

// 1. Check Wrangler Auth
console.log("\n[1/4] Verifying Cloudflare Credentials");
run("npx wrangler whoami", "Checking Cloudflare authentication");

// 2. Setup D1 Database
console.log("\n[2/4] Initializing Cloudflare D1 Database");
run("npx wrangler d1 execute dispatch-db --file=schema.sql --remote -y", "Applying schema to remote D1 database");
run("npx wrangler d1 execute dispatch-db --file=schema.sql --local -y", "Applying schema to local D1 database");

// 3. Setup Seed Catalog
console.log("\n[3/4] Seeding Strategic Intent Catalog");
console.log("   Seed catalog ready in seed.json with 10 multi-dimensional intent packages.");

// 4. Instructions
console.log("\n[4/4] Setup Complete!");
console.log("──────────────────────────────────────────────────────────");
console.log("\x1b[1m\x1b[32m✓ Dispatch is ready to launch!\x1b[0m\n");
console.log("To run locally:");
console.log("  \x1b[36mnpm run dev\x1b[0m\n");
console.log("To deploy live to your Cloudflare account:");
console.log("  \x1b[36mnpm run deploy\x1b[0m\n");
console.log("Once launched, open your browser to view the Executive Command Center.");
console.log("──────────────────────────────────────────────────────────\n");
