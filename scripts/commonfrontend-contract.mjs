import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PACKAGE_SPEC = '@acedatacloud/core@0.8.1';
const DEFAULT_PROFILE = 'core';
const TYPESCRIPT_SPEC = 'typescript@5.8.3';
const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_DIRECTORY = path.join(SCRIPT_DIRECTORY, 'fixtures', 'commonfrontend-contract');

const packageSpec = process.env.PACKAGE_SPEC?.trim() || DEFAULT_PACKAGE_SPEC;
const profileName = process.env.PROFILE?.trim() || DEFAULT_PROFILE;
const reportPath = path.resolve(
  process.env.REPORT_PATH?.trim() || path.join(tmpdir(), 'commonfrontend-contract-report.json')
);
const startedAt = new Date().toISOString();
const report = {
  schemaVersion: 1,
  status: 'failed',
  packageSpec,
  profile: profileName,
  nodeVersion: process.version,
  startedAt,
  finishedAt: null,
  package: null,
  fixtureDependencies: [],
  exports: [],
  checks: [],
  negativeControls: [],
  error: null
};

let fixtureDirectory;

function pass(name, detail) {
  report.checks.push({ name, status: 'passed', detail });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: options.env || process.env,
    maxBuffer: 10 * 1024 * 1024
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(
      `${command} ${args.join(' ')} failed with exit code ${result.status}${output ? `:\n${output}` : ''}`
    );
  }

  return result.stdout.trim();
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function normalizedPackageSpec(spec) {
  if (spec.startsWith('file:')) {
    return `file:${path.resolve(process.cwd(), spec.slice('file:'.length))}`;
  }
  if (spec.startsWith('.') || path.isAbsolute(spec)) {
    return path.resolve(process.cwd(), spec);
  }
  return spec;
}

function packMetadata(spec, directory, environment) {
  const output = run(
    'npm',
    ['pack', normalizedPackageSpec(spec), '--json', '--ignore-scripts', '--pack-destination', directory],
    { cwd: directory, env: environment }
  );
  const results = JSON.parse(output);
  const metadata = Array.isArray(results) ? results[0] : null;

  if (!metadata?.name || !metadata.version || !metadata.integrity || !metadata.filename || results.length !== 1) {
    throw new Error(
      `Package spec "${spec}" did not resolve to one packable artifact with name, version, and integrity`
    );
  }

  return {
    name: metadata.name,
    version: metadata.version,
    integrity: metadata.integrity,
    filename: metadata.filename
  };
}

function assertPackageIdentity(profile, artifact, installed, lockEntry) {
  if (artifact.name !== profile.packageName) {
    throw new Error(
      `Package spec resolved to ${artifact.name}, but profile "${profile.profile}" requires ${profile.packageName}`
    );
  }
  if (installed.name !== artifact.name || installed.version !== artifact.version) {
    throw new Error(
      `Installed package identity ${installed.name}@${installed.version} does not match resolved spec ${artifact.name}@${artifact.version}`
    );
  }
  if (lockEntry.version !== artifact.version) {
    throw new Error(`Lockfile version ${lockEntry.version} does not match resolved spec version ${artifact.version}`);
  }
}

function assertIntegrity(artifact, lockEntry) {
  if (!lockEntry.integrity) {
    throw new Error('Installed package lock entry has no integrity value');
  }
  if (lockEntry.integrity !== artifact.integrity) {
    throw new Error(
      `Lockfile integrity ${lockEntry.integrity} does not match packed artifact integrity ${artifact.integrity}`
    );
  }
}

function conditionTarget(exportDefinition, condition) {
  if (typeof exportDefinition === 'string') {
    return condition === 'runtime' ? exportDefinition : null;
  }
  if (!exportDefinition || typeof exportDefinition !== 'object' || Array.isArray(exportDefinition)) {
    return null;
  }

  if (condition === 'types' && typeof exportDefinition.types === 'string') {
    return exportDefinition.types;
  }
  if (condition === 'runtime') {
    for (const key of ['import', 'default', 'node', 'require']) {
      if (typeof exportDefinition[key] === 'string') {
        return exportDefinition[key];
      }
    }
  }

  for (const value of Object.values(exportDefinition)) {
    const target = conditionTarget(value, condition);
    if (target) {
      return target;
    }
  }
  return null;
}

function targetPath(packageDirectory, target, label) {
  if (!target.startsWith('./')) {
    throw new Error(`${label} target "${target}" must be package-relative`);
  }

  const resolved = path.resolve(packageDirectory, target);
  const relative = path.relative(packageDirectory, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} target "${target}" escapes the installed package`);
  }
  return resolved;
}

async function validateExports(profile, installedPackage, packageDirectory) {
  if (!installedPackage.exports || typeof installedPackage.exports !== 'object') {
    throw new Error('Installed package has no object-form exports map');
  }

  const validated = [];
  for (const subpath of profile.exports) {
    const definition = installedPackage.exports[subpath];
    if (!definition) {
      throw new Error(`Missing required export "${subpath}"`);
    }

    const runtimeTarget = conditionTarget(definition, 'runtime');
    const declarationTarget = conditionTarget(definition, 'types');
    if (!runtimeTarget) {
      throw new Error(`Export "${subpath}" has no runtime target`);
    }
    if (/\.d\.(?:ts|mts|cts)$/.test(runtimeTarget)) {
      throw new Error(`Export "${subpath}" runtime target "${runtimeTarget}" is a declaration file, not runtime code`);
    }
    if (!declarationTarget) {
      throw new Error(`Export "${subpath}" has no types target`);
    }
    if (!/\.d\.(?:ts|mts|cts)$/.test(declarationTarget)) {
      throw new Error(`Export "${subpath}" types target "${declarationTarget}" is not a declaration file`);
    }

    await readFile(targetPath(packageDirectory, runtimeTarget, `${subpath} runtime`));
    await readFile(targetPath(packageDirectory, declarationTarget, `${subpath} types`));
    validated.push({ subpath, runtimeTarget, declarationTarget });
  }
  return validated;
}

function packageImport(packageName, subpath) {
  return subpath === '.' ? packageName : `${packageName}/${subpath.slice(2)}`;
}

async function writeProbes(profile, directory) {
  const imports = profile.exports.map((subpath) => packageImport(profile.packageName, subpath));
  const runtimeProbe = `${imports.map((specifier) => `await import(${JSON.stringify(specifier)});`).join('\n')}\n`;
  const declarationImports = imports.map(
    (specifier, index) => `import type * as ContractExport${index} from ${JSON.stringify(specifier)};`
  );
  const declarationTypes = imports.map((_, index) => `typeof ContractExport${index}`).join(', ');

  await writeFile(path.join(directory, 'runtime-probe.mjs'), runtimeProbe);
  await writeFile(
    path.join(directory, 'declaration-probe.ts'),
    `${declarationImports.join('\n')}\nexport type ContractExports = [${declarationTypes}];\n`
  );
  await writeFile(
    path.join(directory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          noEmit: true,
          // Matches every consumer app (Nexior / PlatformFrontend / AuthFrontend
          // all set skipLibCheck: true). This validates that each `.d.ts` export
          // RESOLVES under the app's own peer versions; it deliberately does not
          // deep-check third-party `.d.ts` internals, which even ship broken
          // across vue / vue-i18n patch pairs (e.g. vue-i18n's own d.ts
          // references a vue member that varies by patch). Full transitive
          // type-compat is each app's own vue-tsc build's job.
          skipLibCheck: true,
          types: []
        },
        files: ['declaration-probe.ts']
      },
      null,
      2
    )}\n`
  );
}

async function expectRejection(name, expectedMessage, action) {
  try {
    await action();
  } catch (error) {
    if (!String(error.message).includes(expectedMessage)) {
      throw new Error(`Negative control "${name}" failed with an unexpected error: ${error.message}`);
    }
    report.negativeControls.push({ name, status: 'passed', observed: expectedMessage });
    return;
  }
  throw new Error(`Negative control "${name}" did not reject corrupted input`);
}

async function runNegativeControls(profile, artifact, installed, lockEntry, packageDirectory) {
  const missingExportPackage = {
    ...installed,
    exports: { ...installed.exports }
  };
  delete missingExportPackage.exports[profile.exports[0]];

  await expectRejection('missing-export', `Missing required export "${profile.exports[0]}"`, () =>
    validateExports(profile, missingExportPackage, packageDirectory)
  );
  await expectRejection('integrity-mismatch', 'does not match packed artifact integrity', () =>
    assertIntegrity(artifact, { ...lockEntry, integrity: 'sha512-intentional-mismatch' })
  );
  await expectRejection('spec-mismatch', 'does not match resolved spec', () =>
    assertPackageIdentity(profile, artifact, { ...installed, version: `${installed.version}-mismatch` }, lockEntry)
  );
}

async function main() {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(profileName)) {
    throw new Error(`Invalid profile name "${profileName}"`);
  }

  const profilePath = path.join(PROFILE_DIRECTORY, `${profileName}.json`);
  const profile = await readJson(profilePath);
  if (
    profile.profile !== profileName ||
    !profile.packageName ||
    !Array.isArray(profile.exports) ||
    profile.exports.length === 0 ||
    !Array.isArray(profile.fixtureDependencies)
  ) {
    throw new Error(`Profile fixture ${profilePath} is invalid`);
  }
  if (
    new Set(profile.exports).size !== profile.exports.length ||
    profile.exports.some((entry) => entry !== '.' && !entry.startsWith('./'))
  ) {
    throw new Error(`Profile fixture ${profilePath} contains invalid or duplicate exports`);
  }
  if (profile.fixtureDependencies.some((entry) => typeof entry !== 'string' || entry.lastIndexOf('@') <= 0)) {
    throw new Error(`Profile fixture ${profilePath} contains an unpinned or invalid fixture dependency`);
  }
  pass(
    'profile',
    `${profile.packageName} with ${profile.exports.length} required exports and ${profile.fixtureDependencies.length} fixture dependencies`
  );

  fixtureDirectory = await mkdtemp(path.join(tmpdir(), 'commonfrontend-contract-'));
  await writeFile(
    path.join(fixtureDirectory, 'package.json'),
    `${JSON.stringify({ name: 'commonfrontend-contract-fixture', version: '0.0.0', private: true, type: 'module' }, null, 2)}\n`
  );

  const installEnvironment = { ...process.env };
  delete installEnvironment.NODE_AUTH_TOKEN;
  delete installEnvironment.NPM_TOKEN;
  const artifact = packMetadata(packageSpec, fixtureDirectory, installEnvironment);
  if (artifact.name !== profile.packageName) {
    throw new Error(
      `Package spec resolved to ${artifact.name}, but profile "${profile.profile}" requires ${profile.packageName}`
    );
  }
  // Optional external pin: when EXPECTED_INTEGRITY is set (e.g. a release job
  // records the published tarball hash), assert the resolved artifact matches
  // it, so the contract detects registry divergence — not just pack↔install
  // self-consistency.
  const expectedIntegrity = process.env.EXPECTED_INTEGRITY?.trim();
  if (expectedIntegrity && artifact.integrity !== expectedIntegrity) {
    throw new Error(
      `Resolved artifact integrity ${artifact.integrity} does not match pinned EXPECTED_INTEGRITY ${expectedIntegrity}`
    );
  }
  pass('artifact', `${artifact.name}@${artifact.version}`);

  run(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--save-exact',
      `file:${path.join(fixtureDirectory, artifact.filename)}`,
      TYPESCRIPT_SPEC,
      ...profile.fixtureDependencies
    ],
    { cwd: fixtureDirectory, env: installEnvironment }
  );
  pass('install', 'Installed into an isolated temporary fixture with lifecycle scripts disabled');

  const packageDirectory = path.join(fixtureDirectory, 'node_modules', ...profile.packageName.split('/'));
  const installed = await readJson(path.join(packageDirectory, 'package.json'));
  const packageLock = await readJson(path.join(fixtureDirectory, 'package-lock.json'));
  const lockEntry = packageLock.packages?.[`node_modules/${profile.packageName}`];
  if (!lockEntry) {
    throw new Error(`Package lock has no entry for ${profile.packageName}`);
  }
  const fixtureDependencyNames = profile.fixtureDependencies.map((specifier) => {
    const separator = specifier.lastIndexOf('@');
    return separator > 0 ? specifier.slice(0, separator) : specifier;
  });
  const undeclaredFixtureDependencies = fixtureDependencyNames.filter(
    (dependency) => !Object.hasOwn(installed.peerDependencies || {}, dependency)
  );
  if (undeclaredFixtureDependencies.length > 0) {
    throw new Error(`Fixture dependencies are not declared package peers: ${undeclaredFixtureDependencies.join(', ')}`);
  }
  report.fixtureDependencies = profile.fixtureDependencies;
  pass('fixture-dependencies', `${fixtureDependencyNames.length} declared peers installed`);

  assertPackageIdentity(profile, artifact, installed, lockEntry);
  pass('identity', `${installed.name}@${installed.version} matches the resolved package spec`);
  assertIntegrity(artifact, lockEntry);
  pass('integrity', artifact.integrity);

  report.exports = await validateExports(profile, installed, packageDirectory);
  pass('export-map', `${report.exports.length} runtime and declaration targets exist`);

  await writeProbes(profile, fixtureDirectory);
  run(process.execPath, ['runtime-probe.mjs'], { cwd: fixtureDirectory });
  pass('runtime-imports', `${profile.exports.length} package imports resolved`);
  run(process.execPath, [path.join(fixtureDirectory, 'node_modules', 'typescript', 'bin', 'tsc')], {
    cwd: fixtureDirectory
  });
  pass('declarations', `${profile.exports.length} package imports resolved under TypeScript NodeNext`);

  await runNegativeControls(profile, artifact, installed, lockEntry, packageDirectory);
  report.status = 'passed';
  report.package = artifact;
}

async function writeReport() {
  report.finishedAt = new Date().toISOString();
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

try {
  await main();
} catch (error) {
  report.error = { message: error instanceof Error ? error.message : String(error) };
  process.exitCode = 1;
} finally {
  // Write the report BEFORE cleanup so a cleanup failure (EBUSY/EPERM) can never
  // mask the run's real outcome or starve the upload-artifact step.
  await writeReport();
  if (fixtureDirectory && process.env.KEEP_FIXTURE !== '1') {
    try {
      await rm(fixtureDirectory, { recursive: true, force: true });
    } catch {
      // Best-effort temp cleanup; the run's verdict already stands.
    }
  }
}

if (report.status === 'passed') {
  console.log(
    `CommonFrontend contract passed for ${report.package.name}@${report.package.version} (${profileName}); report: ${reportPath}`
  );
} else {
  console.error(`CommonFrontend contract failed: ${report.error?.message || 'unknown error'}; report: ${reportPath}`);
}
