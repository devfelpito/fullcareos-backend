# RBAC - Matriz de Permissoes

Este documento descreve as permissoes necessarias por modulo e endpoint.

## Convencao

- `module:read` -> leitura (`GET`)
- `module:write` -> escrita (`POST`, `PUT`, `PATCH`, `DELETE`)

## Matriz atual

| Modulo       | Permissao Read      | Permissao Write     | Endpoints protegidos                  |
|--------------|---------------------|---------------------|---------------------------------------|
| Clients      | `clients:read`      | `clients:write`     | `GET /api/client`, `POST /api/client` |
| Vehicles     | `vehicles:read`     | `vehicles:write`    | `GET /api/vehicles`, `POST /api/vehicles` |
| Services     | `services:read`     | `services:write`    | `GET /api/services`, `POST /api/services` |
| Appointments | `appointments:read` | `appointments:write`| `GET /api/appointments`, `POST /api/appointments` |
| Sales        | `sales:read`        | `sales:write`       | `GET /api/sales`, `POST /api/sales` |
| Expenses     | `expenses:read`     | `expenses:write`    | `GET /api/expenses`, `POST /api/expenses` |

## Regras gerais

1. Toda rota de negocio exige:
   - `authMiddleware`
   - `tenantMiddleware`
   - `requirePermission(...)` apropriado
2. `companyId` sempre deve vir do tenant autenticado, nunca do payload.
3. Falta de permissao deve responder `403`.
4. Token ausente/invalido deve responder `401`.

## Seed

As permissoes acima sao criadas no seed e associadas ao papel Admin por padrao.

## Testes automatizados

A suite cobre:
- autenticacao
- validacao de payload
- isolamento multi-tenant
- RBAC (`read/write` por modulo)
