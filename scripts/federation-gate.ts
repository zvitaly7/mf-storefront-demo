/**
 * federation-gate.ts — CI score gate
 *
 * Reads project-manifest.json from a scenario, checks scores against
 * configurable thresholds, exits non-zero if any threshold is breached.
 *
 * Usage:
 *   ts-node scripts/federation-gate.ts --scenario 1
 *   ts-node scripts/federation-gate.ts --scenario 2 --threshold 80
 *   ts-node scripts/federation-gate.ts --scenario 1 --app catalog
 */

import * as fs from 'fs';
import * as path from 'path';

interface Manifest {
  name: string;
  scores: {
    overall: number;
    [key: string]: number;
  };
}

const SCENARIO_DIRS: Record<string, string> = {
  '1': '1-healthy',
  '2': '2-drift',
  '3': '3-federation-issues',
};

const DEFAULT_THRESHOLDS: Record<string, number> = {
  shell: 100,
  catalog: 90,
  checkout: 100,
};

function parseArgs(): { scenario: string; appFilter?: string; threshold?: number } {
  const args = process.argv.slice(2);
  let scenario = '1';
  let appFilter: string | undefined;
  let threshold: number | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scenario') scenario = args[++i];
    if (args[i] === '--app') appFilter = args[++i];
    if (args[i] === '--threshold') threshold = parseInt(args[++i], 10);
  }

  return { scenario, appFilter, threshold };
}

function loadManifest(scenarioDir: string, app: string): Manifest | null {
  const p = path.join(process.cwd(), 'scenarios', scenarioDir, 'apps', app, 'project-manifest.json');
  if (!fs.existsSync(p)) {
    console.error(`  [MISSING] ${p}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as Manifest;
}

function main(): void {
  const { scenario, appFilter, threshold: globalThreshold } = parseArgs();
  const scenarioDir = SCENARIO_DIRS[scenario];

  if (!scenarioDir) {
    console.error(`Unknown scenario: ${scenario}. Use 1, 2, or 3.`);
    process.exit(1);
  }

  const scenarioPath = path.join(process.cwd(), 'scenarios', scenarioDir, 'apps');
  if (!fs.existsSync(scenarioPath)) {
    console.error(`Scenario directory not found: ${scenarioPath}`);
    process.exit(1);
  }

  const apps = appFilter
    ? [appFilter]
    : fs.readdirSync(scenarioPath).filter((d) =>
        fs.statSync(path.join(scenarioPath, d)).isDirectory()
      );

  console.log(`\n=== Federation Gate — scenario ${scenario} (${scenarioDir}) ===\n`);

  let allPassed = true;

  for (const app of apps) {
    const manifest = loadManifest(scenarioDir, app);
    if (!manifest) { allPassed = false; continue; }

    const threshold = globalThreshold ?? DEFAULT_THRESHOLDS[app] ?? 80;
    const score = manifest.scores.overall;
    const pass = score >= threshold;
    const icon = pass ? '✓' : '✗';

    console.log(`  ${icon} ${app}: overall=${score}  (threshold: ${threshold})`);
    if (!pass) allPassed = false;
  }

  console.log('');

  if (!allPassed) {
    console.error('Gate FAILED — one or more apps did not meet score thresholds.');
    process.exit(1);
  }

  console.log('Gate PASSED — all apps meet score thresholds.');
}

main();
