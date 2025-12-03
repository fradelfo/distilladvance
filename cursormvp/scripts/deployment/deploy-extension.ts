#!/usr/bin/env bun
/**
 * Deploy Browser Extension
 *
 * This script packages and deploys the browser extension to stores.
 * Usage: bun run deploy:extension
 */

import { $ } from "bun";
import { existsSync } from "node:fs";
import { join } from "node:path";

const EXTENSION_DIR = "app/packages/browser-extension";
const DIST_DIR = join(EXTENSION_DIR, "dist");

interface DeployTarget {
  name: string;
  enabled: boolean;
  deploy: () => Promise<void>;
}

async function buildExtension() {
  console.log("📦 Building extension...");
  await $`bun run ext:build`;

  // Verify build output
  if (!existsSync(DIST_DIR)) {
    throw new Error("Extension build failed - dist directory not found");
  }

  console.log("   ✅ Extension built successfully\n");
}

async function packageExtension() {
  console.log("📦 Packaging extension...");

  // Create Chrome ZIP
  const chromeZip = join(EXTENSION_DIR, "distill-chrome.zip");
  await $`cd ${DIST_DIR}/chrome && zip -r ../../distill-chrome.zip .`;
  console.log(`   ✅ Chrome package: ${chromeZip}`);

  // Create Firefox ZIP (if Firefox build exists)
  const firefoxDist = join(DIST_DIR, "firefox");
  if (existsSync(firefoxDist)) {
    const firefoxZip = join(EXTENSION_DIR, "distill-firefox.zip");
    await $`cd ${firefoxDist} && zip -r ../../distill-firefox.zip .`;
    console.log(`   ✅ Firefox package: ${firefoxZip}`);
  }

  console.log("");
}

async function deployToChrome() {
  console.log("🌐 Deploying to Chrome Web Store...\n");

  // Check for required environment variables
  const clientId = process.env.CHROME_WEBSTORE_CLIENT_ID;
  const clientSecret = process.env.CHROME_WEBSTORE_CLIENT_SECRET;
  const refreshToken = process.env.CHROME_WEBSTORE_REFRESH_TOKEN;
  const extensionId = process.env.CHROME_EXTENSION_ID;

  if (!clientId || !clientSecret || !refreshToken || !extensionId) {
    console.log("   ⚠️  Chrome Web Store credentials not configured.");
    console.log("   Required environment variables:");
    console.log("     - CHROME_WEBSTORE_CLIENT_ID");
    console.log("     - CHROME_WEBSTORE_CLIENT_SECRET");
    console.log("     - CHROME_WEBSTORE_REFRESH_TOKEN");
    console.log("     - CHROME_EXTENSION_ID");
    console.log("\n   Manual upload: https://chrome.google.com/webstore/devconsole\n");
    return;
  }

  // Use chrome-webstore-upload-cli
  try {
    const zipPath = join(EXTENSION_DIR, "distill-chrome.zip");
    await $`npx chrome-webstore-upload-cli upload --source ${zipPath} --extension-id ${extensionId} --client-id ${clientId} --client-secret ${clientSecret} --refresh-token ${refreshToken}`;
    console.log("   ✅ Uploaded to Chrome Web Store");

    // Publish
    await $`npx chrome-webstore-upload-cli publish --extension-id ${extensionId} --client-id ${clientId} --client-secret ${clientSecret} --refresh-token ${refreshToken}`;
    console.log("   ✅ Published to Chrome Web Store\n");
  } catch (error) {
    console.error("   ❌ Chrome Web Store deployment failed:", error);
    throw error;
  }
}

async function deployToFirefox() {
  console.log("🦊 Deploying to Firefox Add-ons...\n");

  // Check for required environment variables
  const jwtIssuer = process.env.FIREFOX_ADDONS_JWT_ISSUER;
  const jwtSecret = process.env.FIREFOX_ADDONS_JWT_SECRET;

  if (!jwtIssuer || !jwtSecret) {
    console.log("   ⚠️  Firefox Add-ons credentials not configured.");
    console.log("   Required environment variables:");
    console.log("     - FIREFOX_ADDONS_JWT_ISSUER");
    console.log("     - FIREFOX_ADDONS_JWT_SECRET");
    console.log("\n   Manual upload: https://addons.mozilla.org/developers/\n");
    return;
  }

  try {
    const firefoxDist = join(DIST_DIR, "firefox");
    if (!existsSync(firefoxDist)) {
      console.log("   ⚠️  Firefox build not found. Skipping Firefox deployment.\n");
      return;
    }

    // Use web-ext to sign and upload
    await $`cd ${firefoxDist} && web-ext sign --api-key ${jwtIssuer} --api-secret ${jwtSecret}`;
    console.log("   ✅ Signed and uploaded to Firefox Add-ons\n");
  } catch (error) {
    console.error("   ❌ Firefox Add-ons deployment failed:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting extension deployment...\n");

  // Build extension
  await buildExtension();

  // Lint extension (web-ext validation)
  console.log("🔍 Validating extension...");
  try {
    await $`bun run ext:lint`;
    console.log("   ✅ Extension validation passed\n");
  } catch {
    console.log("   ⚠️  web-ext lint warnings (continuing anyway)\n");
  }

  // Package extension
  await packageExtension();

  // Define deployment targets
  const targets: DeployTarget[] = [
    {
      name: "Chrome Web Store",
      enabled: true,
      deploy: deployToChrome,
    },
    {
      name: "Firefox Add-ons",
      enabled: true,
      deploy: deployToFirefox,
    },
  ];

  // Deploy to each target
  for (const target of targets) {
    if (target.enabled) {
      try {
        await target.deploy();
      } catch (error) {
        console.error(`Failed to deploy to ${target.name}:`, error);
      }
    }
  }

  console.log("🎉 Extension deployment complete!\n");
  console.log("📦 Packages created:");
  console.log(`   - ${join(EXTENSION_DIR, "distill-chrome.zip")}`);
  if (existsSync(join(DIST_DIR, "firefox"))) {
    console.log(`   - ${join(EXTENSION_DIR, "distill-firefox.zip")}`);
  }
  console.log("\n📊 Post-deployment checklist:");
  console.log("  [ ] Verify Chrome Web Store listing");
  console.log("  [ ] Verify Firefox Add-ons listing");
  console.log("  [ ] Test extension installation");
  console.log("  [ ] Check analytics for new version");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error.message);
  process.exit(1);
});
