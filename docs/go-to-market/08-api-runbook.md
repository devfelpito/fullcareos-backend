# Runbook Técnico de Venda

## Endpoints novos
- `POST /api/onboarding/register`: cria empresa + admin + token inicial.
- `POST /api/billing/checkout`: cria sessão de cobrança (mock ou Stripe).
- `GET /api/system/health`: liveness check.
- `GET /api/system/readiness`: readiness com teste de banco.

## Fluxo sugerido de ativação
1. Criar conta via onboarding.
2. Entrar no sistema com token retornado.
3. Configurar plano no billing checkout.
4. Acompanhar KPIs por relatório diário.

## Automações internas
- `npm run report:kpi`: gera relatório de KPIs em `reports/`.
- `npm run report:ops`: gera checklist operacional em `reports/`.
- Workflow `.github/workflows/daily-ops-report.yml` roda diariamente e anexa artefatos.
