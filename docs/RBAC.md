cat > docs/RBAC.md << 'EOF'
# RBAC - Matriz de Permissões

Este documento descreve as permissões necessárias por módulo/endpoint.

## Convenção

- `module:read` → leitura (`GET`)
- `module:write` → escrita (`POST`, `PUT`, `PATCH`, `DELETE`)

## Matriz atual

| Módulo        | Permissão Read       | Permissão Write      | Endpoint(s) protegidos |
|---------------|----------------------|----------------------|------------------------|
| Clients       | `clients:read`       | `clients:write`      | `GET /api/client`, `POST /api/client` |
| Vehicles      | `vehicles:read`      | `vehicles:write`     | `GET /api/vehicles`, `POST /api/vehicles` |
| Services      | `services:read`      | `services:write`     | `GET /api/services`, `POST /api/services` |
| Appointments  | `appointments:read`  | `appointments:write` | `GET /api/appointments`, `POST /api/appointments` |
| Sales         | `sales:read`         | `sales:write`        | `GET /api/sales`, `POST /api/sales` |
| Expenses      | `expenses:read`      | `expenses:write`     | `GET /api/expenses`, `POST /api/expenses` |

## Regras gerais de segurança

1. Toda rota de negócio deve exigir:
   - `authMiddleware`
   - `tenantMiddleware`
   - `requirePermission(...)` apropriado

2. O `companyId` deve sempre ser derivado do tenant autenticado, nunca do payload do cliente.

3. Usuários sem a permissão requerida devem receber `403`.

## Seed

As permissões acima são criadas no seed e associadas ao papel Admin por padrão.

## Testes automatizados

A suíte inclui testes de integração cobrindo:
- autenticação
- validação de payload
- isolamento multi-tenant
- RBAC (read/write por módulo crítico)

EOF