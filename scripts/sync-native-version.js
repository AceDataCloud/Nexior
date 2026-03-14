#!/usr/bin/env node

/**
 * Sync version from package.json → Android build.gradle + iOS project.
 *
 * Usage:  node scripts/sync-native-version.js
 *
 * Version code formula: major*10000 + minor*100 + patch
 * e.g. 3.29.5 → 32905
 */

const fs = require('fs')
const path = require('path')

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
const version = pkg.version
const [major, minor, patch] = version.split('.').map(Number)
const code = major * 10000 + minor * 100 + patch

console.log(`Syncing version: ${version} (code: ${code})`)

// --- Android ---
const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle')
let gradle = fs.readFileSync(gradlePath, 'utf8')
gradle = gradle.replace(/versionCode \d+/, `versionCode ${code}`)
gradle = gradle.replace(/versionName "[^"]*"/, `versionName "${version}"`)
fs.writeFileSync(gradlePath, gradle)
console.log(`  ✓ android/app/build.gradle → ${version} (${code})`)

// --- iOS (update via sed-like replacement in project.pbxproj) ---
const pbxPath = path.join(__dirname, '..', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj')
if (fs.existsSync(pbxPath)) {
  let pbx = fs.readFileSync(pbxPath, 'utf8')
  pbx = pbx.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`)
  pbx = pbx.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${code};`)
  fs.writeFileSync(pbxPath, pbx)
  console.log(`  ✓ ios project.pbxproj → ${version} (${code})`)
}

console.log('Done.')
