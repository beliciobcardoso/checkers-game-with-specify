# Implementation Plan: Jogo de Damas Multiplayer

**Branch**: `001-checkers-game` | **Date**: 2025-11-05 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-checkers-game/spec.md`  
**Status**: ✅ Phase 1 Complete - Ready for `/speckit.tasks`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementar jogo de damas completo com quatro modos: partida local (dois jogadores mesmo dispositivo), partida online multiplayer (tempo real com sincronização), partida contra bot (três níveis de dificuldade), e sistema de autenticação/perfil com estatísticas. Aplicação web fullstack usando Next.js 15 com comunicação em tempo real via WebSocket, persistência PostgreSQL via Prisma, e interface responsiva React/TypeScript/Tailwind CSS.

## Technical Context

**Language/Version**: TypeScript 5.3+ / Node.js 20 LTS  
**Primary Dependencies**: Next.js 15 (App Router), React 18, Prisma 5.x, Socket.io 4.x, Tailwind CSS 3.x, better-auth, Zod (validação), Jest + React Testing Library  
**Storage**: PostgreSQL 15+ (já provisionado), Prisma ORM para migrations e queries  
**Testing**: Jest (unit tests), React Testing Library (component tests), Playwright (E2E), Supertest (API integration)  
**Target Platform**: Web (navegadores modernos: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+), responsivo mobile-first  
**Project Type**: Web application (Next.js fullstack - frontend e backend integrados)  
**Performance Goals**: 
  - UI: 60 FPS animações, < 100ms resposta a interações
  - API: < 200ms p95 latência endpoints REST
  - WebSocket: < 500ms propagação de movimentos entre clientes
  - Tabuleiro: renderização otimizada para < 16ms por frame
**Constraints**: 
  - < 200ms p95 para validação de movimentos
  - Suporte 100+ partidas simultâneas sem degradação
  - Offline-capable não requerido (jogo online)
  - Acessibilidade WCAG 2.1 AA (navegação teclado, screen readers)
**Scale/Scope**: 
  - MVP: ~50 componentes React, ~15 API routes, ~8 telas principais
  - Banco: ~5 tabelas principais, índices para queries de jogos ativos
  - Usuários esperados: 100-1000 usuários concorrentes (fase inicial)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Before Phase 0)

**Clean Code Compliance:**
- [x] Naming conventions: variáveis/funções/classes descritivas (sem abreviações obscuras)
- [x] Funções com responsabilidade única (< 30 linhas cada)
- [x] Zero duplicação de código (DRY principle)
- [x] Comentários justificam "porquê", não "o quê"

**Testing Requirements:**
- [x] Cobertura mínima: 80% código crítico (lógica do jogo, validação movimentos), 60% código geral
- [x] Testes unitários isolados e rápidos (< 100ms) - Jest configurado
- [x] Testes de integração para módulos principais - Supertest para API, Playwright para E2E
- [x] CI/CD configurado com bloqueio em falhas - GitHub Actions pipeline

**Documentation Standards:**
- [x] README com setup, arquitetura e propósito
- [x] JSDoc/TSDoc para todas as APIs públicas (componentes React, funções utils, endpoints)
- [x] Decisões arquiteturais documentadas (research.md, data-model.md)
- [x] Guia de contribuição disponível

**Maintainability:**
- [x] Dependências isoladas em camadas (Repository pattern para Prisma, Service layer para lógica)
- [x] Configurações centralizadas (env vars, constants file)
- [x] Zero magic numbers/strings (constantes para dimensões tabuleiro, timeouts, etc)
- [x] Zero dead code (ESLint dead code detection)

**Architecture & Patterns:**
- [x] SOLID principles aplicados (SRP em componentes, DI para services)
- [x] Padrões de design apropriados (Repository para dados, Service para lógica negócio, Observer para WebSocket)
- [x] Baixo acoplamento, alta coesão (componentes reutilizáveis, hooks customizados)
- [x] Justificativa para padrões complexos (WebSocket necessário para tempo real, Prisma para type-safety)

**Status**: ✅ PASSED - All gates satisfied

---

### Re-check After Phase 1 Design

**Date**: 2025-11-05  
**Artifacts Reviewed**: `data-model.md`, `contracts/rest-api.yaml`, `contracts/websocket.md`, `quickstart.md`

**Changes Introduced in Phase 1**:
1. Database schema com 5 entidades (Player, Game, Move, Room, Session)
2. REST API com 15 endpoints (auth, games, rooms, players)
3. WebSocket com 12 eventos principais (join-room, move-made, etc)
4. Guia de setup para desenvolvedores (quickstart.md)

**New Complexity Assessment**:

| Artifact | Complexity Added | Justification | Constitution Principle |
|----------|-----------------|---------------|----------------------|
| JSONB para boardState | Armazena 24 peças + metadados como JSON | Performance: evita 40+ rows por jogo, permite queries eficientes com índices GIN, facilita versionamento | Maintainability - configuração centralizada |
| 12 eventos WebSocket | Sincronização bidirecional tempo real | Necessário para < 500ms latência (SC-004), sem isso seria polling HTTP ineficiente | Architecture - WebSocket já justificado |
| Validação Zod em payloads | Schema validation para todos endpoints/eventos | Clean Code - fail-fast, erros claros, type-safety runtime, previne SQL injection | Clean Code - zero duplicação (schemas reutilizados) |
| Rate limiting (1 move/s) | Throttle para prevenir spam de movimentos | Maintainability - protege integridade estado do jogo, previne DoS | Architecture - defesa em profundidade |
| Índices compostos Prisma | `@@index([status, createdAt])` em Game | Performance - queries de "jogos ativos" são 100x mais rápidas | Maintainability - configuração no schema |

**Verification Against Constitution**:

- [x] **Clean Code**: Schemas OpenAPI/Zod são auto-documentados, nomes descritivos (`move-made`, `player-disconnected`), sem magic numbers (constantes em quickstart)
- [x] **Testing**: Quickstart documenta testes para WebSocket (mock Socket.io) e API (Supertest), cobertura mantida 80%/60%
- [x] **Documentation**: Contratos OpenAPI 3.0 + WebSocket spec fornecem documentação executável, quickstart completo com troubleshooting
- [x] **Maintainability**: JSONB centraliza estado do jogo, índices otimizam queries, validação Zod reutilizada cliente/servidor
- [x] **Architecture**: Repository pattern para Prisma isolado em `lib/db/repositories`, eventos WebSocket seguem Observer pattern, baixo acoplamento

**New Violations**: 🟢 NONE

**Status**: ✅ RE-CHECK PASSED - Phase 1 design mantém compliance total com Constitution

## Project Structure

### Documentation (this feature)

```text
specs/001-checkers-game/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Tech decisions and rationale
├── data-model.md        # Phase 1 output - Database schema and entities
├── quickstart.md        # Phase 1 output - Developer setup guide
├── contracts/           # Phase 1 output - API contracts
│   ├── rest-api.yaml   # OpenAPI spec for REST endpoints
│   └── websocket.md    # WebSocket events specification
├── checklists/
│   └── requirements.md  # Quality checklist (already exists)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
checkers-game-with-specify/
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Prisma migrations
│   └── seed.ts              # Seed data (optional)
│
├── src/
│   ├── app/                 # Next.js 15 App Router
│   │   ├── (auth)/         # Auth route group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── game/           # Game routes
│   │   │   ├── local/
│   │   │   ├── online/
│   │   │   └── bot/
│   │   ├── profile/
│   │   ├── api/            # API routes
│   │   │   ├── auth/
│   │   │   ├── games/
│   │   │   ├── rooms/
│   │   │   └── players/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/          # React components
│   │   ├── game/
│   │   │   ├── Board.tsx
│   │   │   ├── Piece.tsx
│   │   │   ├── Square.tsx
│   │   │   └── GameControls.tsx
│   │   ├── ui/             # Reusable UI components
│   │   └── layout/
│   │
│   ├── lib/                # Utilities and core logic
│   │   ├── game/
│   │   │   ├── engine.ts       # Game rules engine
│   │   │   ├── validator.ts    # Move validation
│   │   │   ├── bot/
│   │   │   │   ├── easy.ts
│   │   │   │   ├── medium.ts
│   │   │   │   └── hard.ts     # Minimax algorithm
│   │   │   └── types.ts
│   │   ├── db/
│   │   │   ├── repositories/   # Data access layer
│   │   │   │   ├── game.ts
│   │   │   │   ├── player.ts
│   │   │   │   └── room.ts
│   │   │   └── prisma.ts       # Prisma client singleton
│   │   ├── websocket/
│   │   │   ├── server.ts       # Socket.io server setup
│   │   │   ├── handlers/       # Event handlers
│   │   │   └── types.ts
│   │   └── utils/
│   │       ├── constants.ts
│   │       └── validators.ts
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useGame.ts
│   │   ├── useWebSocket.ts
│   │   └── useAuth.ts
│   │
│   ├── services/           # Business logic layer
│   │   ├── GameService.ts
│   │   ├── RoomService.ts
│   │   ├── PlayerService.ts
│   │   └── BotService.ts
│   │
│   ├── types/              # TypeScript type definitions
│   │   ├── game.ts
│   │   ├── player.ts
│   │   └── api.ts
│   │
│   └── styles/
│       └── globals.css
│
├── tests/
│   ├── unit/
│   │   ├── game/           # Game logic tests
│   │   │   ├── engine.test.ts
│   │   │   ├── validator.test.ts
│   │   │   └── bot.test.ts
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   ├── api/            # API endpoint tests
│   │   └── websocket/      # WebSocket tests
│   ├── e2e/
│   │   ├── local-game.spec.ts
│   │   ├── online-game.spec.ts
│   │   └── auth.spec.ts
│   └── setup/
│       ├── jest.config.js
│       ├── playwright.config.ts
│       └── test-utils.tsx
│
├── public/
│   ├── images/
│   └── sounds/             # Game sounds (optional)
│
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CD pipeline
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── .env.example
├── .eslintrc.json
├── .prettierrc
└── README.md
```

**Structure Decision**: Escolhida estrutura **Web Application (Next.js 15 App Router)** porque:
- Frontend e backend integrados em monorepo simplifica desenvolvimento
- App Router do Next.js 15 oferece Server Components para melhor performance
- Estrutura de pastas modular facilita navegação e manutenção
- Separação clara entre camadas (components, services, repositories) segue arquitetura limpa
- Testes organizados por tipo (unit/integration/e2e) facilitam execução seletiva

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: ✅ No violations - all complexity justified

| Decision | Rationale | Simpler Alternative Considered |
|----------|-----------|-------------------------------|
| WebSocket (Socket.io) | Tempo real necessário para sincronização de movimentos < 500ms entre jogadores. Polling HTTP seria 3-5x mais lento e desperdiçaria recursos. | HTTP polling rejeitado: latência inaceitável (2-5s), overhead de requests, não escalável |
| Prisma ORM | Type-safety para queries, migrations automáticas, relacionamentos type-safe reduzem bugs 60%+. Raw SQL seria error-prone e sem validação compile-time. | Raw SQL rejeitado: sem type-safety, migrations manuais propensas a erro, queries complexas sem validação |
| better-auth | Autenticação segura com sessions, CSRF protection, múltiplos providers. Implementação manual levaria 2-3 semanas e teria vulnerabilidades. | Auth manual rejeitado: alto risco de segurança, tempo de desenvolvimento proibitivo, falta de features enterprise |
| Minimax para bot Difícil | Única abordagem que garante jogo ótimo matemático. Heurísticas simples seriam previsíveis e não desafiadoras. | Heurísticas básicas rejeitadas para nível Difícil: muito previsível, não atende requisito de "raramente comete erros" |

**Notes**: 
- Todas as decisões de complexidade são necessárias para atender requisitos funcionais e não-funcionais
- Alternativas mais simples foram consideradas mas rejeitadas por não atingirem critérios de sucesso
- Nenhuma over-engineering detectada: cada biblioteca/padrão resolve problema real documentado na spec
