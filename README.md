# Checkers Game - Jogo de Damas Multiplayer

Jogo de damas completo desenvolvido com regras oficiais, incluindo partida local, multiplayer online em tempo real via WebSocket, e bot com IA em três níveis de dificuldade. Projeto construído com Next.js 15 (App Router), TypeScript, Prisma ORM, Socket.io e Tailwind CSS.

## 🎯 Spec-Driven Development

Este projeto está sendo desenvolvido usando **Spec-Driven Development** com [Specify (spec-kit)](https://github.com/github/spec-kit), uma metodologia que prioriza especificações claras e bem definidas antes da implementação.

### O que é Specify?

Specify é uma ferramenta CLI que facilita o desenvolvimento orientado por especificações, permitindo:

- 📝 Criar e gerenciar especificações de features
- 🗺️ Gerar planos de implementação estruturados
- ✅ Rastrear progresso através de checklists
- 🤖 Integração com IA para acelerar o desenvolvimento

### Instalação do Specify

Para trabalhar com as especificações deste projeto, instale o Specify:

**1. Instale o UV (gerenciador de pacotes Python ultrarrápido)**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

> 📖 Documentação completa: https://docs.astral.sh/uv/getting-started/installation/

**2. Instale o Specify CLI**

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

> 📖 Repositório oficial: https://github.com/github/spec-kit

**3. Verifique a instalação**

```bash
specify
```

### Usando Specify neste Projeto

Todas as especificações estão em `specs/001-checkers-game/`:

- `spec.md` - Especificação funcional completa
- `plan.md` - Plano de implementação
- `tasks.md` - Tarefas e progresso
- `checklists/requirements.md` - Requisitos rastreáveis

## 🎮 Funcionalidades

### Modos de Jogo

- ✅ **Partida Local**: Dois jogadores no mesmo dispositivo com alternância de turnos
- 🌐 **Multiplayer Online**: Partidas em tempo real via WebSocket com sincronização instantânea (< 500ms)
- 🤖 **Bot com IA**: Três níveis de dificuldade
  - **Fácil**: Movimentos aleatórios ponderados (60% preferência por capturas)
  - **Médio**: Análise com profundidade de 3 jogadas
  - **Difícil**: Algoritmo Minimax com profundidade 5+ jogadas

### Regras Oficiais Implementadas

- ✅ Movimentação diagonal em casas escuras
- ✅ Captura obrigatória (simples e múltipla sequencial)
- ✅ Promoção a dama na última linha
- ✅ Movimento longo de damas
- ✅ Detecção de empate (repetição de posição 3x ou 40 movimentos sem captura)
- ✅ Validação de movimentos em tempo real

### Sistema de Usuário

- 👤 **Autenticação**: Sistema completo com NextAuth.js 4.x
- 📊 **Estatísticas**: Total de partidas, vitórias, derrotas, taxa de vitória
- 📜 **Histórico**: Registro de todas as partidas com resultado e adversário
- 💾 **Retomar Partidas**: Partidas online salvas por até 24 horas
- 🔐 **Sessão Persistente**: Login mantido por 7 dias

### Recursos Técnicos

- **Responsivo**: Interface adaptada para desktop, tablet e mobile
- ⚡ **Real-time**: Sincronização via Socket.io com latência < 500ms
- 🎨 **UI Moderna**: Design com Tailwind CSS e componentes reutilizáveis
- 🔍 **Validação**: Zod para validação de dados em runtime
- 📝 **Logging**: Winston para rastreamento e debug

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js** v20.19.0 LTS (recomendado)
- **PostgreSQL** image: postgis/postgis:17-3.5
- **npm** 9+ ou **pnpm** 8+ (pnpm recomendado para melhor performance)
- **Git** 2.x

### Verificar Versões

```bash
node --version  # v18.17+ ou v20.x
npm --version   # v9+
psql --version  # PostgreSQL 15+
```

### Instalação

1. **Clone o repositório**

```bash
git clone <repository-url>
cd checkers-game-with-specify
```

2. **Instale as dependências**

```bash
npm install
# ou com pnpm (recomendado)
pnpm install
```

3. **Configure o banco de dados PostgreSQL**

Via psql:

```bash
psql -U postgres
CREATE DATABASE checkers_dev;
\q
```

Ou via Docker:

```bash
docker run --name checkers-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=checkers_dev \
  -p 5432:5432 \
  -d postgres:15
```

4. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
```

Edite `.env` com suas configurações:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/checkers_dev?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<gere-com-comando-abaixo>"
NODE_ENV="development"
WS_PORT=3001  # Porta do servidor WebSocket (opcional)
```

Gere o `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

5. **Execute as migrações do banco de dados**

```bash
npx prisma migrate dev
# ou
npm run db:migrate
```

6. **[Opcional] Popule com dados de exemplo**

```bash
npm run db:seed
```

7. **Inicie o servidor de desenvolvimento**

```bash
npm run dev
```

8. **Acesse a aplicação**

Abra [http://localhost:3000](http://localhost:3000) no navegador.

> **📖 Para instruções detalhadas**, consulte [specs/001-checkers-game/quickstart.md](specs/001-checkers-game/quickstart.md)

## 🏗️ Arquitetura

### Stack Tecnológico

#### Frontend

- **Next.js 15** (App Router) - Framework React com SSR e rotas API
- **React 18** - Biblioteca UI com hooks e context
- **TypeScript 5.3+** - Tipagem estática e segurança de tipos
- **Tailwind CSS 3.x** - Framework CSS utility-first
- **Socket.io Client 4.x** - Cliente WebSocket para real-time

#### Backend

- **Next.js API Routes** - Endpoints REST serverless
- **Prisma 5.x** - ORM type-safe para PostgreSQL
- **PostgreSQL 17-3.5** - Banco de dados relacional
- **Socket.io 4.x** - Servidor WebSocket para multiplayer
- **NextAuth.js 4.x** - Autenticação e gerenciamento de sessões
- **Zod 3.x** - Validação de schemas e dados
- **Winston 3.x** - Sistema de logging estruturado

#### Testes & Qualidade

- **Jest 29.x** - Framework de testes unitários e integração
- **React Testing Library 16.x** - Testes de componentes React
- **Playwright 1.x** - Testes end-to-end automatizados
- **ESLint** - Linter para qualidade de código
- **Prettier** - Formatação consistente de código

### Estrutura do Projeto

```
checkers-game-with-specify/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Rotas de autenticação (grupo de rota)
│   │   │   ├── login/           # Página de login
│   │   │   └── register/        # Página de registro
│   │   ├── api/                 # API Routes (REST endpoints)
│   │   │   ├── auth/            # Endpoints de autenticação
│   │   │   │   ├── [...nextauth]/  # NextAuth.js handler
│   │   │   │   ├── login/       # POST /api/auth/login
│   │   │   │   ├── logout/      # POST /api/auth/logout
│   │   │   │   └── register/    # POST /api/auth/register
│   │   │   └── players/         # Endpoints de jogadores
│   │   │       └── me/          # GET /api/players/me
│   │   │           ├── history/ # GET /api/players/me/history
│   │   │           └── stats/   # GET /api/players/me/stats
│   │   ├── game/                # Páginas de jogo
│   │   │   └── local/           # Partida local
│   │   ├── profile/             # Página de perfil
│   │   ├── layout.tsx           # Layout raiz
│   │   ├── page.tsx             # Página inicial
│   │   └── globals.css          # Estilos globais
│   │
│   ├── components/              # Componentes React reutilizáveis
│   │   ├── auth/                # Componentes de autenticação
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── game/                # Componentes do jogo
│   │   │   ├── Board.tsx        # Tabuleiro 8x8
│   │   │   ├── Square.tsx       # Casa do tabuleiro
│   │   │   ├── Piece.tsx        # Peça de damas
│   │   │   ├── GameControls.tsx # Controles de partida
│   │   │   └── GameOverModal.tsx
│   │   ├── profile/             # Componentes de perfil
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── GameHistoryTable.tsx
│   │   └── ui/                  # Componentes UI base
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── index.ts
│   │
│   ├── lib/                     # Lógica de negócio e utilidades
│   │   ├── game/                # Engine do jogo de damas
│   │   │   ├── engine.ts        # Lógica principal do jogo
│   │   │   ├── board.ts         # Gerenciamento do tabuleiro
│   │   │   └── validator.ts     # Validação de movimentos
│   │   ├── db/                  # Database layer
│   │   │   └── repositories/    # Padrão Repository
│   │   │       └── player.ts
│   │   ├── websocket/           # Servidor WebSocket
│   │   │   └── server.ts
│   │   ├── validators/          # Schemas Zod
│   │   │   └── index.ts
│   │   ├── auth.ts              # Configuração NextAuth.js
│   │   ├── prisma.ts            # Cliente Prisma singleton
│   │   ├── logger.ts            # Winston logger
│   │   ├── errors.ts            # Classes de erro customizadas
│   │   ├── constants.ts         # Constantes da aplicação
│   │   └── utils.ts             # Funções utilitárias
│   │
│   ├── services/                # Camada de serviços (business logic)
│   │   └── PlayerService.ts     # Serviços de jogador
│   │
│   ├── hooks/                   # Custom React Hooks
│   │   └── useLocalGame.ts      # Hook para partida local
│   │
│   ├── types/                   # Definições TypeScript
│   │   ├── game.ts              # Types do jogo
│   │   └── next-auth.d.ts       # Extensões NextAuth
│   │
│   └── middleware.ts            # Middleware Next.js (auth, etc)
│
├── tests/                       # Suíte de testes
│   ├── unit/                    # Testes unitários (Jest)
│   │   ├── game/
│   │   │   ├── engine.test.ts
│   │   │   └── validator.test.ts
│   │   └── services/
│   │       └── PlayerService.test.ts
│   ├── integration/             # Testes de integração
│   │   ├── local-game.test.ts
│   │   └── api/
│   │       ├── auth.test.ts
│   │       └── players.test.ts
│   ├── e2e/                     # Testes E2E (Playwright)
│   │   ├── auth.spec.ts
│   │   └── local-game.spec.ts
│   └── setup/
│       └── jest.setup.ts        # Setup Jest
│
├── prisma/                      # Prisma ORM
│   ├── schema.prisma            # Schema do banco
│   ├── migrations/              # Migrações SQL
│   └── seed.ts                  # Script de seed
│
├── specs/                       # Especificações do projeto
│   └── 001-checkers-game/
│       ├── spec.md              # Especificação funcional
│       ├── plan.md              # Plano de implementação
│       ├── data-model.md        # Modelo de dados
│       ├── quickstart.md        # Guia de setup
│       ├── tasks.md             # Tarefas do projeto
│       ├── research.md          # Pesquisa e referências
│       ├── checklists/
│       │   └── requirements.md
│       └── contracts/
│           ├── rest-api.yaml    # Spec OpenAPI 3.0
│           └── websocket.md     # Eventos WebSocket
│
└── [arquivos de configuração]
    ├── .env.example             # Template de variáveis ambiente
    ├── next.config.js           # Config Next.js
    ├── tsconfig.json            # Config TypeScript
    ├── tailwind.config.ts       # Config Tailwind
    ├── jest.config.ts           # Config Jest
    ├── playwright.config.ts     # Config Playwright
    ├── postcss.config.js        # Config PostCSS
    └── package.json             # Dependências e scripts
```

### Modelo de Dados (Prisma)

#### Entidades Principais

- **Player** - Usuários/jogadores do sistema
  - Campos: id, email, username, passwordHash, statistics (wins, losses, draws)
  - Relacionamentos: gamesAsWhite, gamesAsBlack, hostedRooms, sessions

- **Game** - Partidas de damas
  - Campos: id, type (LOCAL/ONLINE/BOT), status, result, boardState (JSON), currentTurn
  - Relacionamentos: whitePlayer, blackPlayer, moves, room

- **Move** - Movimentos realizados
  - Campos: id, gameId, moveNumber, from, to, captured, promoted

- **Room** - Salas de partida online
  - Campos: id, code (único), status, hostPlayerId
  - Relacionamentos: host, game

- **Session** - Sessões de autenticação NextAuth.js
  - Campos: id, userId, token, expires

### Fluxo de Dados

#### Partida Local

1. Usuário clica em peça → `useLocalGame` hook
2. Hook chama `validator.ts` para validar movimento
3. Se válido, atualiza estado via `engine.ts`
4. Board re-renderiza com novo estado

#### Partida Online

1. Cliente emite evento WebSocket `move:make`
2. Servidor valida movimento via `validator.ts`
3. Atualiza banco de dados (Prisma)
4. Broadcast do movimento para ambos os clientes
5. Clientes sincronizam estado local

#### Bot (IA)

1. Turno do bot é detectado
2. Engine calcula melhor movimento (Minimax ou Random)
3. Movimento é aplicado ao estado
4. Interface atualiza após delay (UX)

## 🧪 Testes

### Scripts Disponíveis

```bash
# Testes unitários (Jest)
npm test                    # Executa testes unitários
npm run test:watch          # Modo watch para desenvolvimento
npm run test:coverage       # Gera relatório de cobertura

# Testes de integração
npm run test:integration    # Testes de API e serviços

# Testes E2E (Playwright)
npm run test:e2e            # Executa testes end-to-end
npm run test:e2e:ui         # Modo UI interativo do Playwright

# Executar todos os testes + lint + type-check
npm run test:all

# Qualidade de código
npm run lint                # Verifica problemas de linting
npm run lint:fix            # Corrige problemas automaticamente
npm run format              # Formata código com Prettier
npm run format:check        # Verifica formatação
npm run type-check          # Verifica tipos TypeScript
```

### Estrutura de Testes

#### Testes Unitários (`tests/unit/`)

- **`game/engine.test.ts`** - Lógica do jogo (movimentação, captura, promoção)
- **`game/validator.test.ts`** - Validação de movimentos e regras
- **`services/PlayerService.test.ts`** - Serviços de jogador

#### Testes de Integração (`tests/integration/`)

- **`api/auth.test.ts`** - Endpoints de autenticação
- **`api/players.test.ts`** - Endpoints de jogadores
- **`local-game.test.ts`** - Fluxo completo de partida local

#### Testes E2E (`tests/e2e/`)

- **`auth.spec.ts`** - Fluxo de registro e login
- **`local-game.spec.ts`** - Partida local completa no navegador

### Cobertura de Testes

O projeto visa manter:

- **80%+** cobertura de código em lógica de negócio (`lib/`)
- **100%** cobertura em validadores e engine do jogo
- Testes E2E para fluxos críticos (autenticação, partidas)

## 📚 Documentação

### Especificações Técnicas

- **[Especificação Completa](specs/001-checkers-game/spec.md)** - User stories, cenários de aceitação e edge cases
- **[Plano de Implementação](specs/001-checkers-game/plan.md)** - Roadmap e priorização de features
- **[Modelo de Dados](specs/001-checkers-game/data-model.md)** - Schema Prisma e entidades
- **[Checklist de Requisitos](specs/001-checkers-game/checklists/requirements.md)** - Requisitos funcionais e não-funcionais
- **[Tasks](specs/001-checkers-game/tasks.md)** - Tarefas de implementação
- **[Research](specs/001-checkers-game/research.md)** - Pesquisa técnica e referências

### Contratos de API

- **[REST API (OpenAPI 3.0)](specs/001-checkers-game/contracts/rest-api.yaml)** - Especificação completa da API REST
  - Endpoints de autenticação (`/api/auth/*`)
  - Endpoints de jogadores (`/api/players/*`)
  - Schemas de request/response
- **[WebSocket Events](specs/001-checkers-game/contracts/websocket.md)** - Eventos Socket.io
  - `room:create`, `room:join`, `room:leave`
  - `move:make`, `move:sync`
  - `game:start`, `game:end`
  - `player:disconnect`, `player:reconnect`

### Guias de Desenvolvimento

- **[Guia de Setup](specs/001-checkers-game/quickstart.md)** - Instalação e configuração detalhada
  - Pré-requisitos e verificação de ambiente
  - Setup do banco de dados (PostgreSQL / Docker)
  - Configuração de variáveis de ambiente
  - Execução de migrações e seeds
  - Troubleshooting comum

### Documentação de Código

#### Principais Módulos

- **`src/lib/game/engine.ts`** - Engine principal do jogo
  - `createInitialBoard()` - Cria tabuleiro inicial 8x8
  - `makeMove()` - Executa movimento validado
  - `checkWinCondition()` - Verifica condições de vitória
  - `checkDrawCondition()` - Detecta empate
- **`src/lib/game/validator.ts`** - Validador de movimentos
  - `validateMove()` - Valida movimento simples ou captura
  - `getValidMoves()` - Retorna todos os movimentos válidos para uma peça
  - `getMandatoryCaptures()` - Detecta capturas obrigatórias
- **`src/lib/game/board.ts`** - Utilidades do tabuleiro
  - `isPieceAt()` - Verifica se há peça na posição
  - `getPieceAt()` - Obtém peça em posição
  - `updateBoard()` - Atualiza estado do tabuleiro

- **`src/services/PlayerService.ts`** - Serviço de jogadores
  - `createPlayer()` - Cria novo jogador
  - `updateStats()` - Atualiza estatísticas após partida
  - `getHistory()` - Retorna histórico de partidas

### Regras do Jogo

#### Movimentação Básica

- Peças movem **diagonalmente** em casas escuras
- Peças simples movem **apenas para frente**
- Damas movem **qualquer distância** em diagonais

#### Captura

- Captura é **obrigatória** quando disponível
- **Captura múltipla** sequencial deve ser completada
- Dama pode capturar em qualquer direção e distância

#### Promoção

- Peça simples vira **dama** ao alcançar última linha
- Dama tem **coroa visual** diferenciada

#### Vitória

- Jogador vence ao **capturar todas** as peças adversárias
- Jogador vence se adversário **não tem movimentos válidos**

#### Empate

- **Repetição de posição** 3 vezes
- **40 movimentos** sem captura ou promoção
- **Acordo mútuo** entre jogadores (online)

## 🚀 Scripts do Projeto

### Desenvolvimento

```bash
npm run dev              # Inicia servidor de desenvolvimento (localhost:3000)
npm run build            # Build de produção
npm start                # Inicia servidor de produção (após build)
npm run lint             # Verifica código com ESLint
npm run lint:fix         # Corrige problemas de lint automaticamente
npm run format           # Formata código com Prettier
npm run format:check     # Verifica formatação sem modificar
npm run type-check       # Verifica tipos TypeScript sem compilar
```

### Banco de Dados

```bash
npm run db:generate      # Gera Prisma Client a partir do schema
npm run db:push          # Sincroniza schema com DB (sem migração)
npm run db:migrate       # Cria e aplica nova migração
npm run db:reset         # Reseta DB e aplica todas as migrações
npm run db:seed          # Popula DB com dados de exemplo
npm run db:studio        # Abre Prisma Studio (GUI do banco)
```

### Testes

```bash
npm test                 # Testes unitários
npm run test:watch       # Testes em modo watch
npm run test:coverage    # Cobertura de testes
npm run test:integration # Testes de integração
npm run test:e2e         # Testes E2E (Playwright)
npm run test:e2e:ui      # Testes E2E em modo UI
npm run test:all         # Todos os testes + lint + type-check
```

## 🛠️ Desenvolvimento

### Padrões de Código

#### Convenções TypeScript

- Usar `interface` para types de objetos públicos
- Usar `type` para unions, intersections e types utilitários
- Sempre tipar parâmetros e retornos de funções
- Evitar `any`, usar `unknown` quando tipo for incerto

#### Estrutura de Componentes React

```typescript
// 1. Imports
import { useState } from 'react';
import type { ComponentProps } from '@/types';

// 2. Types/Interfaces
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

// 3. Componente
export function MyComponent({ title, onAction }: MyComponentProps) {
  // 3.1 Hooks
  const [state, setState] = useState();

  // 3.2 Handlers
  const handleClick = () => {
    // ...
  };

  // 3.3 Render
  return (
    <div>{title}</div>
  );
}
```

#### Nomenclatura

- **Componentes**: PascalCase (`GameBoard.tsx`)
- **Funções/Variáveis**: camelCase (`makeMove`, `isValidMove`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_PLAYERS`, `BOARD_SIZE`)
- **Types/Interfaces**: PascalCase com prefixo descritivo (`GameState`, `MoveResult`)
- **Arquivos de teste**: `*.test.ts` ou `*.spec.ts`

#### Git Commits (Conventional Commits)

```bash
feat: adiciona validação de captura múltipla
fix: corrige bug em promoção de dama
docs: atualiza README com instruções de setup
test: adiciona testes E2E para partida local
refactor: reorganiza estrutura de pastas
chore: atualiza dependências do projeto
```

### Workflow de Desenvolvimento

1. **Criar branch de feature**

```bash
git checkout -b feature/nome-da-feature
```

2. **Implementar alterações**
   - Escrever testes primeiro (TDD quando possível)
   - Implementar funcionalidade
   - Garantir que testes passam

3. **Verificar qualidade**

```bash
npm run test:all  # Executa testes + lint + type-check
```

4. **Commit e push**

```bash
git add .
git commit -m "feat: descrição da feature"
git push origin feature/nome-da-feature
```

5. **Abrir Pull Request**
   - Descrever mudanças claramente
   - Referenciar issues relacionadas
   - Aguardar review

### Debugging

#### VS Code Launch Configuration (`.vscode/launch.json`)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

#### Logs

- Usar `logger.ts` (Winston) para logs estruturados
- Níveis: `error`, `warn`, `info`, `debug`
- Logs salvos em `logs/` (development) e stdout (production)

### Variáveis de Ambiente

| Variável          | Descrição                    | Exemplo                                    |
| ----------------- | ---------------------------- | ------------------------------------------ |
| `DATABASE_URL`    | Connection string PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `NEXTAUTH_URL`    | URL base da aplicação        | `http://localhost:3000`                    |
| `NEXTAUTH_SECRET` | Secret para NextAuth.js      | `<gerado com openssl>`                     |
| `NODE_ENV`        | Ambiente de execução         | `development` / `production` / `test`      |
| `WS_PORT`         | Porta do servidor WebSocket  | `3001`                                     |

> **⚠️ Segurança**: Nunca commitar arquivo `.env` com credenciais reais. Use `.env.example` como template.

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos abaixo para contribuir:

### Processo de Contribuição

1. **Fork o projeto**

```bash
git clone https://github.com/seu-usuario/checkers-game-with-specify.git
cd checkers-game-with-specify
```

2. **Crie uma feature branch**

```bash
git checkout -b feature/nome-da-feature
# ou para correções de bugs
git checkout -b fix/descricao-do-bug
```

3. **Faça suas alterações**
   - Siga os padrões de código do projeto
   - Adicione testes para novas funcionalidades
   - Mantenha a cobertura de testes acima de 80%
   - Execute testes localmente: `npm run test:all`

4. **Commit suas mudanças** (Conventional Commits)

```bash
git add .
git commit -m 'feat: adiciona funcionalidade X'
# Tipos válidos: feat, fix, docs, test, refactor, chore, style, perf
```

5. **Push para o fork**

```bash
git push origin feature/nome-da-feature
```

6. **Abra um Pull Request**
   - Descreva claramente as mudanças
   - Referencie issues relacionadas (#123)
   - Aguarde review do mantenedor

### Diretrizes

#### Code Style

- Seguir configuração ESLint e Prettier do projeto
- Manter imports organizados (externos → internos → types)
- Documentar funções complexas com JSDoc
- Usar TypeScript strict mode

#### Testes

- **Obrigatório** para novas features e bug fixes
- Testes unitários para lógica de negócio
- Testes de integração para APIs
- Testes E2E para fluxos críticos

#### Documentação

- Atualizar README.md se adicionar features visíveis ao usuário
- Atualizar specs/ se modificar regras de negócio
- Adicionar comentários em código complexo
- Manter contratos de API (rest-api.yaml, websocket.md) atualizados

### Reportar Bugs

Ao reportar bugs, inclua:

- **Descrição clara** do problema
- **Passos para reproduzir** o bug
- **Comportamento esperado** vs comportamento atual
- **Screenshots** ou logs de erro (se aplicável)
- **Ambiente**: OS, Node.js version, navegador

### Sugerir Features

Para sugerir novas funcionalidades:

- Descreva o problema que a feature resolve
- Explique como a feature funcionaria
- Se possível, mostre exemplos ou mockups
- Indique prioridade/impacto esperado

### Código de Conduta

Este projeto segue os princípios de desenvolvimento definidos em `.specify/memory/constitution.md`:

- Respeito e profissionalismo
- Colaboração construtiva
- Foco em qualidade e boas práticas
- Comunicação clara e objetiva

## 📄 Licença

Este projeto está sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

```
MIT License

Copyright (c) 2025 checkers-game-with-specify

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🔗 Links Úteis

- **Documentação Next.js 15**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Socket.io Docs**: https://socket.io/docs/v4/
- **NextAuth.js**: https://next-auth.js.org/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Jest**: https://jestjs.io/docs/getting-started
- **Playwright**: https://playwright.dev/docs/intro

## 📞 Suporte

Para questões ou suporte:

- Abra uma [issue no GitHub](https://github.com/seu-usuario/checkers-game-with-specify/issues)
- Consulte a [documentação completa](specs/001-checkers-game/)
- Verifique as [FAQs no quickstart](specs/001-checkers-game/quickstart.md)

---

**Desenvolvido com ❤️ usando Next.js, TypeScript e Prisma**
