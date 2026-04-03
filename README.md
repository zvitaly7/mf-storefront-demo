# mf-storefront-demo

[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![node](https://img.shields.io/badge/node-%E2%89%A518-339933?logo=node.js)](https://nodejs.org)
[![react](https://img.shields.io/badge/react-18.3.1-61DAFB?logo=react)](https://react.dev)
[![webpack](https://img.shields.io/badge/webpack-5-8DD6F9?logo=webpack)](https://webpack.js.org)

A demonstration repository for [@mf-toolkit/shared-inspector](https://github.com/zvitaly7/mf-toolkit/tree/main/packages/shared-inspector). Three real-world microfrontend scenarios — healthy, drifted, and federation-broken — all in one branch, runnable with a single command.

```bash
git clone https://github.com/zvitaly7/mf-storefront-demo
cd mf-storefront-demo
npm install
bash demo.sh
```

---

## Architecture

Three independent React 18 applications composed via Webpack Module Federation:

| App | Role | Key dependencies |
|---|---|---|
| **shell** | Host / orchestrator | React 18, React Router 6, Zustand 4 |
| **catalog** | Remote — product listing | React 18, React Router 6, Lodash 4 |
| **checkout** | Remote — cart & payment | React 18, React Router 6, Zustand 4 |

Each app is isolated: its own `package.json`, `tsconfig.json`, and webpack config. No cross-app local imports. Designed to feel like a poly-repo even though it lives in a monorepo.

```
mf-storefront-demo/
├── scenarios/
│   ├── 1-healthy/           ← all configs aligned, scores 100/92/100
│   │   └── apps/{shell,catalog,checkout}/
│   ├── 2-drift/             ← config decay, catalog drops to 38/100
│   │   └── apps/{shell,catalog,checkout}/
│   └── 3-federation-issues/ ← cross-MF conflicts invisible per-app
│       └── apps/{shell,catalog,checkout}/
├── scripts/
│   └── federation-gate.ts   ← CI score gate
├── demo.sh                  ← runs all three scenarios
└── package.json
```

---

## Running the Demo

```bash
# All three scenarios at once
bash demo.sh

# Focus on one scenario
bash demo.sh --scenario 2

# Compare one app across all scenarios
bash demo.sh --app catalog
```

Or via npm:

```bash
npm run demo
npm run demo:healthy
npm run demo:drift
npm run demo:federation
```

---

## Three Scenarios

### Scenario 1 — Healthy Baseline

All shared configs properly aligned. Versions match. Singletons declared. No drift.

| App | Score |
|---|---|
| shell | ✅ 100 / 100 |
| catalog | ✅ 92 / 100 |
| checkout | ✅ 100 / 100 |
| federation | ✅ 100 / 100 |

> **Why does catalog score 92?** It uses lodash via a barrel import — `ProductList → utils/index.ts → utils/format.ts → lodash`. Running with `--depth direct` misses it (scores 100). Running with `--depth local-graph` (default) walks the import graph and surfaces lodash as an unshared candidate. This is the depth demonstration.

---

### Scenario 2 — Configuration Drift

Two drift problems introduced surgically. Both look fine at runtime — until something breaks in production.

| App | Score | Problem |
|---|---|---|
| shell | ✅ 100 / 100 | — |
| catalog | ❌ 38 / 100 | React 17 declared, host uses React 18 — `HIGH` × 2, −20 each |
| checkout | ⚠️ 90 / 100 | `react-router-dom` marked `eager: true` in a remote — singleton conflict risk |
| federation | — | — |

**What this demonstrates:** A stale `package.json` that nobody updated after a major React upgrade. Per-app analysis catches it immediately. Without tooling, it's invisible until the MF loads and blows up with a hooks error.

---

### Scenario 3 — Federation Issues

Three problems that score fine per-app but are critical at the federation level. Impossible to catch with per-app tooling alone.

| App | Per-app | Federation | Problem |
|---|---|---|---|
| shell | ✅ 100 / 100 | ⚠️ 65 / 100 | Declares `lodash` as shared — catalog does not |
| catalog | ✅ 92 / 100 | ❌ 55 / 100 | `react-router-dom` required `^6.20.0` vs shell's `6.22.3` |
| checkout | ✅ 100 / 100 | ❌ 45 / 100 | `zustand` without `singleton: true` — shell uses singleton |

**What this demonstrates:** Cross-MF manifest aggregation is the only way to surface these. A router version range mismatch and a singleton declaration asymmetry both look clean in isolation.

---

## CI Gate

```bash
# Healthy baseline — all apps must pass
ts-node scripts/federation-gate.ts --scenario 1

# Drift scenario — catalog will fail (score 38 < threshold 90)
ts-node scripts/federation-gate.ts --scenario 2

# Custom threshold for a single app
ts-node scripts/federation-gate.ts --scenario 1 --app catalog --threshold 85
```

---

## Key Implementation Detail — Barrel Pattern

The catalog app is structured so that `lodash` is never imported directly in component files:

```
ProductList.tsx
  └── import { sortProducts, formatPrice } from './utils'   ← barrel
        └── utils/index.ts  re-exports from utils/format.ts
              └── utils/format.ts  imports { chunk, orderBy } from 'lodash'
```

This is the ground truth for demonstrating `--depth direct` vs `--depth local-graph`:

```bash
# --depth direct: lodash invisible → score 100
npx @mf-toolkit/shared-inspector --project scenarios/1-healthy/apps/catalog --depth direct

# --depth local-graph: walks barrel imports → lodash found → score 92
npx @mf-toolkit/shared-inspector --project scenarios/1-healthy/apps/catalog --depth local-graph
```

---

## Related

- [@mf-toolkit/shared-inspector](https://github.com/zvitaly7/mf-toolkit/tree/main/packages/shared-inspector) — the tool this demo is built for
- [mf-toolkit](https://github.com/zvitaly7/mf-toolkit) — the full toolkit

## License

MIT
