# Perf Suite — Playwright + Lighthouse

Suite de medição contínua de performance. Cada rota crítica é auditada via Lighthouse (mobile, throttle padrão), com budget próprio e baseline versionada.

## Variabilidade — sempre rode N>=3 quando comparar

Lighthouse contra prod tem ruído de rede de ~15–30% nos scores. Para comparar antes/depois com confiança, rode com `PERF_RUNS=3` (mediana). Default é 1 para iteração rápida.

```bash
PERF_RUNS=3 npm run perf:prod
```

A CI já roda com `PERF_RUNS=3`.

## Como rodar

```bash
# Contra produção (default — gera relatórios em perf/reports/<timestamp>/)
npm run perf

# Contra produção explícito
npm run perf:prod

# Contra localhost (sobe o Next automaticamente via webServer)
npm run build && npm run perf:local

# Atualizar baselines (ex: após uma onda de otimização)
npm run perf:baseline

# Ver último relatório HTML
npm run perf:report
```

## Estrutura

```
playwright.config.ts             config raiz, perfil mobile (Pixel 7)
tests/perf/
  budgets/<route>.json           thresholds por rota
  fixtures/auth.ts               login helper (rotas autenticadas)
  journeys/<route>.spec.ts       um teste = uma rota auditada
  lib/lighthouse-helper.ts       wrapper sobre playwright-lighthouse
  lib/compare-baseline.ts        compara contra baseline + atualiza TRENDS.md
perf/
  baselines/<route>.json         baselines versionadas (commit em dev)
  reports/                       relatórios descartáveis (gitignored)
  TRENDS.md                      histórico (commit ok)
```

## Rotas medidas

| Rota | Spec | Auth |
|---|---|---|
| `/` (landing) | `landing.spec.ts` | — |
| `/cadastro` | `cadastro.spec.ts` | — |
| `/login` | `login.spec.ts` | — |
| `/dashboard` | `dashboard.spec.ts` | requer envs |

## Rotas autenticadas

Defina antes de rodar:

```bash
export PERF_TEST_EMAIL=...
export PERF_TEST_PASSWORD=...
```

Sem essas envs, os specs autenticados são **skipados** (não falham).

Em CI, adicione ambos como GitHub Secrets — o workflow `perf-check.yml` já os passa para os jobs.

## Critérios de falha

Um run falha se, para qualquer rota:

1. `performance score < threshold` definido em `budgets/<route>.json`, **OU**
2. Qualquer métrica time-based piorou >5% vs baseline em `perf/baselines/<route>.json`.

`UPDATE_BASELINE=1` desliga (2) e regrava a baseline — usado depois de validar manualmente uma melhora.

## Ciclo de uso (otimização contínua)

1. **Antes da onda** (estado atual): `npm run perf:baseline` → fixa a foto.
2. **Durante a onda**: `npm run perf` em loop, observa `TRENDS.md` mostrando ⬇/⬆.
3. **PR**: GitHub Action roda automaticamente e comenta delta no PR.
4. **Após merge** da onda: `npm run perf:baseline` → nova baseline para a próxima onda.

## Adicionar nova rota

1. Criar `tests/perf/budgets/<rota>.json`.
2. Criar `tests/perf/journeys/<rota>.spec.ts` (copiar `landing.spec.ts` e ajustar `route` + `url`).
3. Rodar `npm run perf:baseline` para gerar `perf/baselines/<rota>.json`.
4. Commitar baseline + spec + budget em `dev`.
