/**
 * federation-gate.ts — CI score gate
 *
 * Runs @mf-toolkit/shared-inspector on each app in a scenario,
 * then runs federation analysis. Exits non-zero if any score is
 * below the configured threshold.
 *
 * Usage:
 *   ts-node scripts/federation-gate.ts --scenario 1
 *   ts-node scripts/federation-gate.ts --scenario 2 --min-score 80
 *   ts-node scripts/federation-gate.ts --scenario 1 --app catalog
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const MF_CLI = path.join(ROOT, 'node_modules/@mf-toolkit/shared-inspector/dist/cli.js');

const SCENARIO_DIRS: Record<string, string> = {
  '1': '1-healthy',
  '2': '2-drift',
  '3': '3-federation-issues',
  '4': '4-critical',
};

const DEFAULT_MIN_SCORE = 90;

function parseArgs(): { scenario: string; appFilter?: string; minScore: number } {
  const args = process.argv.slice(2);
  let scenario = '1';
  let appFilter: string | undefined;
  let minScore = DEFAULT_MIN_SCORE;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scenario')  scenario  = args[++i];
    if (args[i] === '--app')       appFilter = args[++i];
    if (args[i] === '--min-score') minScore  = parseInt(args[++i], 10);
  }
  return { scenario, appFilter, minScore };
}

function runInspector(appDir: string, appName: string, kind: string): { score: number; label: string } {
  const cmd = [
    `node ${MF_CLI}`,
    `--source ${path.join(appDir, 'src')}`,
    `--shared ${path.join(appDir, 'shared-config.json')}`,
    `--name ${appName}`,
    `--kind ${kind}`,
    '--write-manifest',
    `--output-dir ${appDir}`,
    '--json',
  ].join(' ');

  const output = execSync(cmd, { cwd: ROOT }).toString();
  const result = JSON.parse(output);
  return { score: result.score.score, label: result.score.label };
}

function main(): void {
  const { scenario, appFilter, minScore } = parseArgs();
  const scenarioDir = SCENARIO_DIRS[scenario];

  if (!scenarioDir) {
    console.error(`Unknown scenario: ${scenario}. Use 1, 2, or 3.`);
    process.exit(1);
  }

  const appsPath = path.join(ROOT, 'scenarios', scenarioDir, 'apps');
  if (!fs.existsSync(appsPath)) {
    console.error(`Scenario path not found: ${appsPath}`);
    process.exit(1);
  }

  const apps = appFilter
    ? [appFilter]
    : fs.readdirSync(appsPath).filter((d) => fs.statSync(path.join(appsPath, d)).isDirectory());

  console.log(`\n=== Federation Gate — scenario ${scenario} (${scenarioDir}) | threshold: ${minScore} ===\n`);

  let allPassed = true;
  const manifests: string[] = [];

  for (const app of apps) {
    const appDir = path.join(appsPath, app);
    const kind = app === 'shell' ? 'host' : 'remote';

    try {
      const { score, label } = runInspector(appDir, app, kind);
      const pass = score >= minScore;
      const icon = pass ? '✓' : '✗';
      console.log(`  ${icon} ${app}: ${score}/100 ${label}  (threshold: ${minScore})`);
      if (!pass) allPassed = false;
      manifests.push(path.join(appDir, 'project-manifest.json'));
    } catch (err) {
      console.error(`  ✗ ${app}: inspector failed — ${(err as Error).message}`);
      allPassed = false;
    }
  }

  // Federation analysis when inspecting all apps
  if (!appFilter && manifests.length > 1) {
    console.log('\n  --- Federation analysis ---');
    try {
      const fedCmd = `node ${MF_CLI} federation ${manifests.join(' ')} --json`;
      const fedOutput = execSync(fedCmd, { cwd: ROOT }).toString();
      const fedResult = JSON.parse(fedOutput);
      const fedScore: number = fedResult.score.score;
      const pass = fedScore >= minScore;
      const icon = pass ? '✓' : '✗';
      console.log(`  ${icon} federation: ${fedScore}/100 ${fedResult.score.label}  (threshold: ${minScore})`);
      if (!pass) allPassed = false;
    } catch (err) {
      console.error(`  ✗ federation: analysis failed — ${(err as Error).message}`);
      allPassed = false;
    }
  }

  console.log('');
  if (!allPassed) {
    console.error('Gate FAILED — one or more checks did not meet the score threshold.');
    process.exit(1);
  }
  console.log('Gate PASSED — all checks meet the score threshold.');
}

main();
