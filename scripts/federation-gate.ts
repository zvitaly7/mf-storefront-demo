/**
 * federation-gate.ts — CI score gate for federation-level analysis
 *
 * Reads project-manifest.json from each app, checks scores against configurable
 * thresholds, and exits non-zero if any threshold is breached.
 *
 * Usage:
 *   ts-node scripts/federation-gate.ts
 *   ts-node scripts/federation-gate.ts --threshold 90
 *   ts-node scripts/federation-gate.ts --app catalog --threshold 85
 */

import * as fs from 'fs';
import * as path from 'path';

interface ScoreBlock {
  overall: number;
  versionAlignment?: number;
  singletonRisks?: number;
  unusedDeclarations?: number;
  federation?: number;
  shareCandidates?: number;
}

interface Manifest {
  name: string;
  scores: ScoreBlock;
}

const APPS = ['shell', 'catalog', 'checkout'];

const DEFAULT_THRESHOLDS: Record<string, number> = {
  shell: 100,
  catalog: 90,   // 92 expected; gate at 90 to allow slight variance
  checkout: 100,
  federation: 100,
};

function parseArgs(): { appFilter?: string; threshold?: number } {
  const args = process.argv.slice(2);
  let appFilter: string | undefined;
  let threshold: number | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--app') appFilter = args[++i];
    if (args[i] === '--threshold') threshold = parseInt(args[++i], 10);
  }

  return { appFilter, threshold };
}

function loadManifest(app: string): Manifest | null {
  const manifestPath = path.join(process.cwd(), 'apps', app, 'project-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`  [MISSING] No manifest found at ${manifestPath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Manifest;
}

function checkApp(app: string, manifest: Manifest, threshold: number): boolean {
  const score = manifest.scores.overall;
  const pass = score >= threshold;
  const icon = pass ? '✓' : '✗';
  console.log(`  ${icon} ${app}: overall=${score}  (threshold: ${threshold})`);
  if (!pass) {
    console.error(`    FAIL — score ${score} is below threshold ${threshold}`);
  }
  return pass;
}

function main(): void {
  const { appFilter, threshold: globalThreshold } = parseArgs();
  const appsToCheck = appFilter ? [appFilter] : APPS;

  console.log('');
  console.log('=== Federation Gate ===');
  console.log('');

  let allPassed = true;

  for (const app of appsToCheck) {
    const manifest = loadManifest(app);
    if (!manifest) {
      allPassed = false;
      continue;
    }

    const threshold = globalThreshold ?? DEFAULT_THRESHOLDS[app] ?? 80;
    const passed = checkApp(app, manifest, threshold);
    if (!passed) allPassed = false;
  }

  console.log('');

  if (!allPassed) {
    console.error('Gate FAILED — one or more apps did not meet score thresholds.');
    process.exit(1);
  }

  console.log('Gate PASSED — all apps meet score thresholds.');
}

main();
