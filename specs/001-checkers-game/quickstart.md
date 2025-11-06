# Guia de Início Rápido - Jogo de Damas

Instruções para configurar e executar o projeto localmente em ambiente de desenvolvimento.

---

## Pré-requisitos

### Software Necessário

- **Node.js** 18.17+ ou 20.x (LTS recomendado)
- **npm** 9+ ou **pnpm** 8+ (recomendado para melhor performance)
- **PostgreSQL** 15+
- **Git** 2.x

### Verificar Versões

```bash
node --version  # Deve ser v18.17+ ou v20.x
npm --version   # Deve ser v9+
psql --version  # Deve ser 15+
git --version   # Qualquer 2.x
```

---

## Instalação

### 1. Clonar o Repositório

```bash
git clone <repository-url>
cd checkers-game-with-specify
```

### 2. Instalar Dependências

**Com npm**:
```bash
npm install
```

**Com pnpm** (recomendado):
```bash
pnpm install
```

---

## Configuração do Banco de Dados

### 1. Criar Banco de Dados PostgreSQL

**Opção A: Via psql**
```bash
psql -U postgres
CREATE DATABASE checkers_dev;
\q
```

**Opção B: Via Docker** (se preferir não instalar PostgreSQL localmente)
```bash
docker run --name checkers-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=checkers_dev \
  -p 5432:5432 \
  -d postgres:15
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.example .env
```

Edite `.env`:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/checkers_dev?schema=public"

# better-auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-secret-key-segura-aqui"  # Gere com: openssl rand -base64 32

# Node Environment
NODE_ENV="development"

# WebSocket (opcional - usa padrão se não definido)
WS_PORT=3001
```

**Gerar NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

### 3. Executar Migrações do Prisma

```bash
# Aplicar migrações
npx prisma migrate dev

# Verificar estado do banco
npx prisma migrate status
```

**Saída esperada**:
```
✅ Database in sync with migrations
```

### 4. (Opcional) Popular Banco com Dados de Teste

```bash
npm run db:seed
```

Cria:
- 3 usuários de exemplo (alice, bob, charlie)
- 2 partidas de exemplo em andamento
- 1 sala de espera

---

## Executar em Desenvolvimento

### Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

**Saída esperada**:
```
▲ Next.js 15.0.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Ready in 2.3s
○ Compiling / ...
✓ Compiled in 1.2s
```

Acesse: http://localhost:3000

### Verificar WebSocket

O servidor WebSocket inicia automaticamente junto com Next.js. Para confirmar:

```bash
# Em outro terminal
curl http://localhost:3000/api/health
```

**Resposta esperada**:
```json
{
  "status": "ok",
  "websocket": "running",
  "database": "connected"
}
```

---

## Executar Testes

### Testes Unitários (Jest)

```bash
# Todos os testes
npm test

# Modo watch (re-executa ao salvar)
npm test -- --watch

# Com cobertura
npm test -- --coverage
```

**Cobertura mínima**: 80% (statements, branches, functions, lines)

### Testes de Integração

```bash
# Testes de API
npm run test:integration

# Requer banco de teste separado
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/checkers_test" npm run test:integration
```

### Testes E2E (Playwright)

```bash
# Instalar navegadores (apenas primeira vez)
npx playwright install

# Executar testes E2E
npm run test:e2e

# Modo UI interativo
npm run test:e2e:ui
```

### Executar Todos os Testes

```bash
npm run test:all
```

---

## Ferramentas de Desenvolvimento

### Prisma Studio (Visualizar Banco de Dados)

Interface gráfica para ver e editar dados:

```bash
npx prisma studio
```

Acesse: http://localhost:5555

### Verificar Linting

```bash
# ESLint
npm run lint

# Corrigir automaticamente
npm run lint:fix
```

### Verificar Formatação

```bash
# Prettier
npm run format:check

# Formatar automaticamente
npm run format
```

### Verificar Tipos TypeScript

```bash
npm run type-check
```

---

## Estrutura do Projeto

```
checkers-game-with-specify/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # Grupo de autenticação
│   │   ├── game/         # Páginas do jogo
│   │   ├── api/          # API Routes
│   │   └── layout.tsx    # Layout raiz
│   ├── components/       # Componentes React
│   │   ├── ui/           # Componentes base (Button, Input, etc)
│   │   ├── game/         # Componentes do jogo (Board, Piece, etc)
│   │   └── layout/       # Componentes de layout (Header, Footer)
│   ├── lib/              # Lógica de negócio e utilidades
│   │   ├── game/         # Lógica do jogo de damas
│   │   ├── validation/   # Schemas Zod
│   │   ├── prisma.ts     # Cliente Prisma
│   │   └── socket.ts     # Cliente Socket.io
│   ├── services/         # Serviços (API calls, WebSocket handlers)
│   ├── hooks/            # Custom React Hooks
│   └── types/            # Definições de tipos TypeScript
├── prisma/
│   ├── schema.prisma     # Schema do banco
│   ├── migrations/       # Migrações SQL
│   └── seed.ts           # Script de seed
├── public/               # Arquivos estáticos
├── tests/
│   ├── unit/             # Testes Jest
│   ├── integration/      # Testes de API
│   └── e2e/              # Testes Playwright
└── .specify/             # Documentação e especificações
```

---

## Fluxo de Trabalho de Desenvolvimento

### 1. Criar Feature Branch

```bash
git checkout -b feature/nome-da-feature
```

### 2. Fazer Alterações

- Escrever testes primeiro (TDD - veja `.specify/memory/constitution.md`)
- Implementar feature
- Garantir que testes passam
- Verificar linting e formatação

### 3. Commit

```bash
git add .
git commit -m "feat: descrição da feature"
```

**Convenção de commits**: [Conventional Commits](https://www.conventionalcommits.org/)
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `refactor:` refatoração sem mudança de comportamento
- `test:` adicionar/modificar testes
- `docs:` documentação

### 4. Push e Pull Request

```bash
git push origin feature/nome-da-feature
```

Abra Pull Request no GitHub.

---

## Problemas Comuns

### Erro: "Cannot find module '@prisma/client'"

**Solução**: Gerar Prisma Client
```bash
npx prisma generate
```

### Erro: "Database not found"

**Solução**: Criar banco de dados
```bash
psql -U postgres -c "CREATE DATABASE checkers_dev;"
npx prisma migrate dev
```

### Erro: "Port 3000 already in use"

**Solução**: Mudar porta ou matar processo
```bash
# Opção 1: Usar outra porta
PORT=3001 npm run dev

# Opção 2: Matar processo na porta 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9

# Opção 3: Matar processo (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erro: "NEXTAUTH_SECRET environment variable is not set"

**Solução**: Adicionar ao `.env`
```bash
openssl rand -base64 32 >> .env
```

Edite `.env` e adicione `NEXTAUTH_SECRET=` antes do valor gerado.

### Testes E2E falhando

**Solução**: Instalar navegadores
```bash
npx playwright install chromium
```

### WebSocket não conecta

**Solução**: Verificar CORS e variáveis de ambiente
```bash
# Verificar se WS_PORT está definido corretamente
grep WS_PORT .env

# Verificar logs do servidor
npm run dev
# Procure por: "✓ WebSocket server listening on :3001"
```

---

## Comandos Úteis

### Desenvolvimento

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Executa build de produção |
| `npm run lint` | Verifica linting |
| `npm run format` | Formata código |
| `npm test` | Executa testes unitários |

### Banco de Dados

| Comando | Descrição |
|---------|-----------|
| `npx prisma migrate dev` | Criar e aplicar migração |
| `npx prisma migrate reset` | Resetar banco (⚠️ apaga dados) |
| `npx prisma studio` | Abrir Prisma Studio |
| `npx prisma generate` | Gerar Prisma Client |
| `npm run db:seed` | Popular banco com dados de teste |

### Git

| Comando | Descrição |
|---------|-----------|
| `git status` | Ver arquivos modificados |
| `git log --oneline` | Histórico de commits |
| `git branch` | Listar branches |
| `git checkout -b feature/x` | Criar nova branch |

---

## Recursos Adicionais

### Documentação

- [Next.js 15](https://nextjs.org/docs)
- [React 18](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [Socket.io](https://socket.io/docs/v4)
- [better-auth](https://www.better-auth.com/docs/introduction)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Especificações do Projeto

- `.specify/memory/constitution.md` - Princípios de desenvolvimento
- `specs/001-checkers-game/spec.md` - Especificação completa
- `specs/001-checkers-game/data-model.md` - Modelo de dados
- `specs/001-checkers-game/contracts/rest-api.yaml` - API REST
- `specs/001-checkers-game/contracts/websocket.md` - Eventos WebSocket

### Contato

- Abrir issue no GitHub para bugs ou dúvidas
- Consultar `CONTRIBUTING.md` para guidelines de contribuição

---

## Checklist de Setup

Marque conforme completa:

- [ ] Node.js 18.17+ instalado
- [ ] PostgreSQL 15+ instalado/rodando
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Banco de dados criado
- [ ] Arquivo `.env` configurado com DATABASE_URL e NEXTAUTH_SECRET
- [ ] Migrações aplicadas (`npx prisma migrate dev`)
- [ ] Servidor de dev rodando (`npm run dev`)
- [ ] Testes unitários passando (`npm test`)
- [ ] Prisma Studio acessível (`npx prisma studio`)
- [ ] http://localhost:3000 acessível no navegador

**Pronto!** 🎉 Agora você pode começar a desenvolver.
