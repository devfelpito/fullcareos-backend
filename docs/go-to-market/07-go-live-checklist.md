# Checklist de Go-live

## Produto
- [ ] Fluxos críticos testados (login, cadastro, agenda, vendas, despesas).
- [ ] Onboarding funcional (`POST /api/onboarding/register`).
- [ ] Cobrança funcional (`POST /api/billing/checkout`).

## Infraestrutura
- [ ] Variáveis de ambiente configuradas.
- [ ] Banco de produção com backup automático.
- [ ] Monitoramento de uptime e logs.

## Segurança
- [ ] JWT secret forte e rotacionável.
- [ ] CORS restrito a domínios de produção.
- [ ] Headers de segurança habilitados.

## Comercial
- [ ] Pitch e demo script revisados.
- [ ] Funil e cadência definidos.
- [ ] Métricas e rotina de acompanhamento definidas.

## Jurídico/financeiro
- [ ] Termos de uso validados por jurídico.
- [ ] Política de privacidade validada.
- [ ] Gateway de cobrança ativo e testado.
