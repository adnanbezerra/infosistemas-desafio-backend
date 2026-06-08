# Desafio Backend Aivacol

API NestJS para gerenciamento de frota com marcas, modelos, veiculos, usuario administrador, SQL Server, Redis e TypeORM.

## Tecnologias

- Node.js
- NestJS
- TypeScript
- TypeORM
- SQL Server
- Redis
- Docker Compose
- Jest

## Pre-requisitos

- Node.js 22+
- npm
- Docker e Docker Compose

## Configuracao

Copie o exemplo de ambiente:

```bash
cp .env.example .env
```

Valores locais padrao:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=YourStrong!Passw0rd
DB_DATABASE=aivacol_fleet
DB_SYNCHRONIZE=false
DB_LOGGING=true
JWT_SECRET=change-me
JWT_EXPIRES_IN=1d
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL_SECONDS=60
DEFAULT_ADMIN_NICKNAME=aivacol
DEFAULT_ADMIN_PASSWORD=aivacol123
```

## Docker Compose

Subir SQL Server, criar database local e subir Redis:

```bash
docker compose up -d mssql mssql-init redis
```

Subir tambem a API pelo Compose:

```bash
docker compose up -d
```

Servicos expostos:

- API: `http://localhost:3000`
- SQL Server: `localhost:1433`
- Redis: `localhost:6379`

O servico `mssql-init` aguarda SQL Server aceitar conexao e cria o database `aivacol_fleet` se ele ainda nao existir.

## Instalacao

```bash
npm install
```

## Migrations

Gerar migration a partir das entities:

```bash
npm run migration:generate src/database/migrations/NomeDaMigration
```

Executar migrations:

```bash
npm run migration:run
```

Reverter ultima migration:

```bash
npm run migration:revert
```

## Seed

```bash
npm run seed
```

O seed cria o usuario administrador padrao e dados iniciais de marcas, modelos e veiculos.

Credenciais padrao:

```text
nickname: aivacol
password: aivacol123
```

## Execucao

Desenvolvimento local:

```bash
npm run start:dev
```

Producao local:

```bash
npm run build
npm run start:prod
```

## Testes

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Autenticacao

Login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nickname":"aivacol","password":"aivacol123"}'
```

Resposta esperada:

```json
{
  "access_token": "jwt-token",
  "user": {
    "id": "uuid",
    "nickname": "aivacol",
    "name": "Aivacol Admin",
    "email": "aivacol@example.com"
  }
}
```

Use o token nas rotas privadas:

```bash
Authorization: Bearer jwt-token
```

## Exemplos de requests

Criar marca:

```bash
curl -X POST http://localhost:3000/brands \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jwt-token" \
  -d '{"name":"Toyota"}'
```

Criar modelo:

```bash
curl -X POST http://localhost:3000/models \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jwt-token" \
  -d '{"name":"Corolla","brandId":"brand-uuid"}'
```

Criar veiculo:

```bash
curl -X POST http://localhost:3000/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jwt-token" \
  -d '{"licensePlate":"ABC1D23","chassis":"9BWZZZ377VT004251","renavam":"12345678901","year":2024,"modelId":"model-uuid"}'
```

Listar veiculos:

```bash
curl http://localhost:3000/vehicles \
  -H "Authorization: Bearer jwt-token"
```

Atualizar veiculo:

```bash
curl -X PATCH http://localhost:3000/vehicles/vehicle-uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jwt-token" \
  -d '{"year":2025}'
```

Remover veiculo:

```bash
curl -X DELETE http://localhost:3000/vehicles/vehicle-uuid \
  -H "Authorization: Bearer jwt-token"
```

## Cache Redis

A listagem e consulta por id de veiculos usam Redis real. Escritas em veiculos invalidam as chaves `vehicles:*` para evitar resposta antiga apos criar, atualizar ou remover registros.

O TTL local e definido por:

```env
REDIS_TTL_SECONDS=60
```

## Decisoes arquiteturais

- `synchronize` fica sempre desativado.
- SQL Server e Redis rodam no Compose do projeto para evitar dependencia de servicos externos no desenvolvimento.
- `created_by` deve vir do usuario autenticado no JWT, nunca do body.
- Rotas publicas previstas: `POST /auth/login` e `GET /health`.
- Remocao de marcas, modelos e veiculos usa hard delete. Marcas com modelos e modelos com veiculos associados nao podem ser removidos.

## Bonus

- Docker Compose com SQL Server, init de database, Redis e API.
- Seed idempotente para administrador e dados iniciais.
- Cache Redis para listagem e consulta por id de veiculos, com invalidacao em escritas.
