#!/usr/bin/env node

/**
 * Sync version from package.json → Android build.gradle + iOS project + mobile constants.
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

function replaceOrThrow(content, pattern, replacement, filePath) {
  if (!pattern.test(content)) {
    throw new Error(`Could not find version pattern in ${filePath}`)
  }
  return content.replace(pattern, replacement)
}

// --- Android ---
const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle')
let gradle = fs.readFileSync(gradlePath, 'utf8')
gradle = replaceOrThrow(gradle, /versionCode \d+/, `versionCode ${code}`, gradlePath)
gradle = replaceOrThrow(gradle, /versionName "[^"]*"/, `versionName "${version}"`, gradlePath)
fs.writeFileSync(gradlePath, gradle)
console.log(`  ✓ android/app/build.gradle → ${version} (${code})`)

// --- iOS (update via sed-like replacement in project.pbxproj) ---
const pbxPath = path.join(__dirname, '..', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj')
if (fs.existsSync(pbxPath)) {
  let pbx = fs.readFileSync(pbxPath, 'utf8')
  pbx = replaceOrThrow(pbx, /MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`, pbxPath)
  pbx = replaceOrThrow(pbx, /CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${code};`, pbxPath)
  fs.writeFileSync(pbxPath, pbx)
  console.log(`  ✓ ios project.pbxproj → ${version} (${code})`)
}

// --- Mobile download page constants ---
const mobileConstantsPath = path.join(__dirname, '..', 'src', 'constants', 'mobile.ts')
let mobileConstants = fs.readFileSync(mobileConstantsPath, 'utf8')
mobileConstants = replaceOrThrow(
  mobileConstants,
  /MOBILE_APP_VERSION = '[^']*'/,
  `MOBILE_APP_VERSION = '${version}'`,
  mobileConstantsPath
)
fs.writeFileSync(mobileConstantsPath, mobileConstants)
console.log(`  ✓ src/constants/mobile.ts → ${version}`)

console.log('Done.')
