# mf-storefront-demo

[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![node](https://img.shields.io/badge/node-%E2%89%A518-339933?logo=node.js)](https://nodejs.org)
[![react](https://img.shields.io/badge/react-18.3.1-61DAFB?logo=react)](https://react.dev)
[![webpack](https://img.shields.io/badge/webpack-5-8DD6F9?logo=webpack)](https://webpack.js.org)

A demonstration repository for [@mf-toolkit/shared-inspector](https://github.com/zvitaly7/mf-toolkit/tree/main/packages/shared-inspector). Three real-world microfrontend scenarios — healthy, drifted, and federation-broken — each on its own branch, ready to switch in seconds.

---

## Architecture

Three independent React 18 applications composed via Webpack Module Federation:

| App | Role | Key dependencies |
|---|---|---|
| **shell** | Host / orchestrator | React 18, React Router 6, Zustand 4 |
| **catalog** | Remote — product listing | React 18, React Router 6, Lodash 4 |
| **checkout** | Remote — cart & payment | React 18, React Router 6, Zustand 4 |

Each app is isolated: its own `package.json`, `tsconfig.json`, webpack config, and CI workflow. No cross-app local imports. Designed to feel like a poly-repo even though it lives in a monorepo.

```
mf-storefront-demo/
├── apps/
│   ├── shell/       ← host, auth store, routes to remotes
│   ├── catalog/     ← exposes ProductList, barrel-pattern lodash usage
│   └── checkout/    ← exposes Cart, Zustand cart store
├── scripts/
│   ├── inspect-all.sh        ← monorepo inspection
│   ├── inspect-polyrepo.sh   ← poly-repo simulation
│   └── federation-gate.ts    ← CI score gate
└── .github/workflows/        ← per-app CI, uploads project-manifest.json artifacts
```

---

## Three Demo Scenarios

### `main` — Healthy Baseline

All shared configs properly aligned. Versions match. Singletons declared. No drift.

```bash
git checkout main
bash scripts/inspect-all.sh
```

| App | Score |
|---|---|
| shell | 100 / 100 |
| catalog | **92 / 100** |
| checkout | 100 / 100 |
| federation | 100 / 100 |

> **Why does catalog score 92?** It uses lodash via a barrel import — `ProductList` → `utils/index.ts` → `utils/format.ts` → `lodash`. Running with `--depth direct` misses it entirely (scores 100). Running with `--depth local-graph` (default) walks the import graph and surfaces lodash as an unshared candidate. This is the depth demonstration.

---

### `scenario/drift` — Configuration Decay

Two drift problems introduced surgically. Each is invisible at runtime until something breaks.

```bash
git checkout scenario/drift
bash scripts/inspect-all.sh
```

| App | Score | Problem |
|---|---|---|
| shell | 100 / 100 | — |
| catalog | **38 / 100** | React 17 declared, host uses React 18 — `HIGH` × 2 (−20 each) |
| checkout | **90 / 100** | `react-router-dom` marked `eager: true` in a remote — singleton conflict risk |
| federation | — | — |

**What this demonstrates:** Version mismatches accumulate silently. A stale `package.json` that nobody updated after a major upgrade can cause a production singleton collision. The inspector catches it at build time.

---

### `scenario/federation-issues` — Cross-MF Conflicts

Three problems that score fine per-app but are critical at the federation level. This is the scenario impossible to catch with per-app tooling alone.

```bash
git checkout scenario/federation-issues
bash scripts/inspect-all.sh
```

| App | Per-app score | Federation score | Problem |
|---|---|---|---|
| shell | 100 / 100 | **65 / 100** | Declares `lodash` as shared — catalog does not |
| catalog | 92 / 100 | **55 / 100** | `react-router-dom` required `^6.20.0` vs shell's `6.22.3` |
| checkout | 100 / 100 | **45 / 100** | `zustand` shared without `singleton: true` — shell uses singleton |

**What this demonstrates:** Cross-MF manifest aggregation is the only way to surface these conflicts. A router version range mismatch and a singleton declaration asymmetry both look clean in isolation — only federation analysis reveals them.

---

## Running Inspections

### Per-app (monorepo mode)

```bash
# Inspect all apps with default depth (local-graph)
bash scripts/inspect-all.sh

# Inspect with explicit depth
DEPTH=direct bash scripts/inspect-all.sh

# Enforce a minimum score threshold
THRESHOLD=90 bash scripts/inspect-all.sh
```

### Per-app (poly-repo simulation)

```bash
# Simulates each app as an independent repository
bash scripts/inspect-polyrepo.sh

# Inspect a single app
bash scripts/inspect-polyrepo.sh --app catalog --depth local-graph
```

### Depth comparison on catalog

```bash
# --depth direct: misses transitive lodash → score 100
npx @mf-toolkit/shared-inspector --project apps/catalog --depth direct

# --depth local-graph: walks barrel imports → surfaces lodash → score 92
npx @mf-toolkit/shared-inspector --project apps/catalog --depth local-graph
```

### CI gate

```bash
# Check all apps against configured thresholds
ts-node scripts/federation-gate.ts

# Override threshold for a single app
ts-node scripts/federation-gate.ts --app catalog --threshold 85
```

---

## Key Implementation Details

**Barrel pattern** — the catalog app is structured so that `lodash` is never imported directly in component files:

```
ProductList.tsx
  └── import { sortProducts, formatPrice } from './utils'   ← barrel
        └── utils/index.ts re-exports from utils/format.ts
              └── utils/format.ts imports { chunk, orderBy } from 'lodash'
```

This is the ground truth for demonstrating that `--depth direct` and `--depth local-graph` produce different results — and why graph traversal matters in real codebases.

**Zustand auth store** lives in `shell` and is shared as a singleton — any microfrontend can read auth state without prop drilling. The `scenario/federation-issues` branch breaks this by removing `singleton: true` from checkout's zustand declaration, demonstrating a split-store failure mode.

**project-manifest.json** is generated per-app by CI and consumed by federation-level analysis. The format is compatible with `@mf-toolkit/shared-inspector`'s manifest aggregation mode.

---

## CI / Artifacts

Each app has its own workflow under `.github/workflows/`. On every push to `main` or `scenario/*` branches, the workflow builds the app and uploads `project-manifest.json` as a GitHub Actions artifact.

These artifacts can be downloaded and fed into `inspect-polyrepo.sh` to simulate a poly-repo inspection without co-locating the source.

---

## Related

- [@mf-toolkit/shared-inspector](https://github.com/zvitaly7/mf-toolkit/tree/main/packages/shared-inspector) — the tool this demo is built for
- [mf-toolkit](https://github.com/zvitaly7/mf-toolkit) — the full toolkit

## License

MIT
