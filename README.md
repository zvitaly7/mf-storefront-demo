# mf-storefront-demo

[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![node](https://img.shields.io/badge/node-%E2%89%A518-339933?logo=node.js)](https://nodejs.org)
[![react](https://img.shields.io/badge/react-18.3.1-61DAFB?logo=react)](https://react.dev)
[![webpack](https://img.shields.io/badge/webpack-5-8DD6F9?logo=webpack)](https://webpack.js.org)
[![inspector](https://img.shields.io/npm/v/@mf-toolkit/shared-inspector?label=%40mf-toolkit%2Fshared-inspector&color=CB3837&logo=npm)](https://www.npmjs.com/package/@mf-toolkit/shared-inspector)

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

Each app is isolated: its own `package.json`, `tsconfig.json`, webpack config, and `shared-config.json` for the inspector. No cross-app local imports.

```
mf-storefront-demo/
├── scenarios/
│   ├── 1-healthy/           ← all configs aligned, scores 100/100/100
│   │   └── apps/{shell,catalog,checkout}/
│   │       ├── src/
│   │       ├── shared-config.json   ← MF shared declarations for inspector
│   │       └── webpack.config.js
│   ├── 2-drift/             ← config decay: catalog 60/100, checkout 84/100
│   │   └── apps/{shell,catalog,checkout}/
│   └── 3-federation-issues/ ← per-app 100/100, federation reveals hidden issues
│       └── apps/{shell,catalog,checkout}/
├── scripts/
│   └── federation-gate.ts   ← CI score gate
├── demo.sh                  ← runs all three scenarios end-to-end
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
npm run demo:drift
npm run demo:federation
```

---

## Three Scenarios

### Scenario 1 — Healthy Baseline

All shared configs properly aligned. Versions match, singletons declared, no drift.

```
shell    Score: 100/100  ✅ HEALTHY
catalog  Score: 100/100  ✅ HEALTHY
checkout Score: 100/100  ✅ HEALTHY
federation Score: 100/100  ✅ HEALTHY — No federation-level issues found.
```

---

### Scenario 2 — Configuration Drift

Two drift problems introduced surgically. Each is invisible at runtime until something breaks.

```
catalog  Score: 60/100  🟠 RISKY
  ⚠ Version Mismatch — react     (configured: 17.0.2 | installed: 18.3.1)
  ⚠ Version Mismatch — react-dom (configured: 17.0.2 | installed: 18.3.1)

checkout Score: 84/100  🟡 GOOD
  ⚠ Singleton Risk — react-router-dom (singleton: true is missing)
  ⚠ Eager Risk     — react-router-dom (eager: true without singleton: true)
```

**What this demonstrates:** A stale `shared-config.json` where someone declared `requiredVersion: "17.0.2"` after a React upgrade that was never propagated. The inspector catches it at build time, before a runtime "Invalid hook call" in production.

---

### Scenario 3 — Federation Issues

All three apps score 100/100 per-app. Federation analysis reveals two hidden cross-MF problems.

```
shell    Score: 100/100  ✅ HEALTHY
catalog  Score: 100/100  ✅ HEALTHY
checkout Score: 100/100  ✅ HEALTHY

Federation analysis:
  ⚠ Singleton Mismatch — zustand
     singleton in: [shell]
     not singleton in: [checkout]

  ✗ Ghost Share — lodash
     shared only by: shell
     used unshared by: [catalog]
```

**What this demonstrates:** Per-app tooling gives you a false sense of safety. The zustand singleton mismatch (`singleton: true` in shell, absent in checkout) means shell and checkout run separate Zustand stores — auth state doesn't reach the cart. The lodash ghost share means shell pays the cost of sharing a library only it benefits from. Neither issue appears in per-app scores.

---

## CI Gate

```bash
# Healthy baseline must pass (threshold 90)
ts-node scripts/federation-gate.ts --scenario 1

# Drift scenario will fail (catalog: 60, checkout: 84 — both below 90)
ts-node scripts/federation-gate.ts --scenario 2

# Custom threshold
ts-node scripts/federation-gate.ts --scenario 1 --min-score 100
```

---

## Depth Analysis — Barrel Pattern

The `catalog` app is structured so that `lodash` is never imported directly in component files:

```
ProductList.tsx
  └── import { sortProducts, formatPrice } from './utils'   ← barrel
        └── utils/index.ts  re-exports from utils/format.ts
              └── utils/format.ts  imports { chunk, orderBy } from 'lodash'
```

Run the inspector with both depth modes on the healthy scenario to see the difference:

```bash
# --depth direct: only sees explicit imports → lodash invisible
mf-inspector --source scenarios/1-healthy/apps/catalog/src \
             --shared scenarios/1-healthy/apps/catalog/shared-config.json \
             --depth direct

# --depth local-graph (default): follows re-exports → lodash surfaced as candidate
mf-inspector --source scenarios/1-healthy/apps/catalog/src \
             --shared scenarios/1-healthy/apps/catalog/shared-config.json \
             --depth local-graph
```

> In the healthy scenario lodash is not in the built-in share-candidates list so the score stays 100 either way. Switch to scenario 3 to see the ghost share detected at federation level once shell starts sharing it.

---

## Related

- [@mf-toolkit/shared-inspector](https://github.com/zvitaly7/mf-toolkit/tree/main/packages/shared-inspector) — the tool this demo is built for
- [mf-toolkit](https://github.com/zvitaly7/mf-toolkit) — the full toolkit

## License

MIT
