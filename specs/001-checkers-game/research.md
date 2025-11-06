# Research & Technical Decisions

**Feature**: Jogo de Damas Multiplayer  
**Date**: 2025-11-05  
**Status**: Complete

## Overview

Esta pesquisa documenta as decisões técnicas para implementação do jogo de damas com quatro modos (local, online, bot, autenticação). Foco em tecnologias que suportam tempo real, type-safety, e desenvolvimento rápido mantendo qualidade.

---

## 1. Framework Frontend/Backend

### Decision: Next.js 15 (App Router)

**Rationale**:
- **Fullstack integrado**: Server Components + API Routes eliminam necessidade de backend separado
- **Performance**: Server Components reduzem bundle JavaScript em ~40%, melhor First Contentful Paint
- **SEO-friendly**: SSR nativo para páginas públicas (landing, regras do jogo)
- **Developer Experience**: Hot reload, TypeScript first-class, zero-config
- **Routing**: File-based routing simplifica navegação, route groups para organização

**Alternatives Considered**:
- **Vite + Express**: Rejeitado - requer configuração separada frontend/backend, sem SSR built-in, mais boilerplate
- **Create React App**: Rejeitado - deprecated, sem SSR, bundle maior, sem backend integrado
- **Remix**: Considerado - excelente DX, mas menor ecossistema que Next.js, menos familiaridade da equipe

**Best Practices**:
- Usar Server Components para dados estáticos (perfil, histórico)
- Client Components apenas para interatividade (tabuleiro, WebSocket)
- API Routes para endpoints REST simples
- Server Actions para mutations (criar partida, autenticar)

**References**:
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [Server Components Best Practices](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

## 2. Real-Time Communication

### Decision: Socket.io 4.x

**Rationale**:
- **Fallback automático**: WebSocket → HTTP long-polling se WS bloqueado por firewall
- **Rooms nativos**: Perfeito para salas de jogo isoladas
- **Reconnection handling**: Reconexão automática com exponential backoff
- **Broadcasting**: Envio eficiente de movimentos para ambos os jogadores
- **Compression**: Compressão automática de mensagens grandes

**Alternatives Considered**:
- **Native WebSocket API**: Rejeitado - sem fallback, sem rooms, reconnection manual
- **Server-Sent Events (SSE)**: Rejeitado - unidirecional, não serve para envio cliente→servidor
- **WebRTC**: Rejeitado - over-engineering para jogo turn-based, complexidade desnecessária

**Implementation Pattern**:
```typescript
// Server-side (API route handler)
io.on('connection', (socket) => {
  socket.on('join-room', (roomCode) => {
    socket.join(roomCode);
    io.to(roomCode).emit('player-joined', socket.id);
  });
  
  socket.on('move', (move) => {
    // Validate move server-side
    if (isValidMove(move)) {
      io.to(move.roomCode).emit('move-made', move);
      saveMove(move); // Persist to DB
    }
  });
});
```

**Best Practices**:
- Sempre validar movimentos no servidor (nunca confiar em cliente)
- Usar namespaces para separar lógica (e.g., `/game`, `/chat`)
- Implementar heartbeat para detectar conexões mortas
- Rate limiting para prevenir spam de eventos

**References**:
- [Socket.io Docs](https://socket.io/docs/v4/)
- [Next.js + Socket.io Integration](https://socket.io/how-to/use-with-nextjs)

---

## 3. Database & ORM

### Decision: PostgreSQL 15+ + Prisma 5.x

**Rationale**:

**PostgreSQL**:
- **ACID compliant**: Transações garantem consistência (salvar partida atomicamente)
- **JSON support**: Armazenar estado do tabuleiro como JSONB (queries eficientes)
- **Performance**: Índices B-tree para queries de jogos ativos, partidas por usuário
- **Já provisionado**: Banco já disponível conforme requisitos

**Prisma**:
- **Type-safety**: Schema → tipos TypeScript gerados automaticamente
- **Migrations**: Versionamento de schema, rollback seguro
- **Relations**: Modelagem de relacionamentos (Player ↔ Game) com type-safety
- **DX**: Auto-complete para queries, validação em tempo de desenvolvimento

**Alternatives Considered**:
- **TypeORM**: Rejeitado - Active Record pattern mais verboso, migrations menos robustas
- **Drizzle**: Considerado - excelente performance, mas menos maduro, menor comunidade
- **Raw SQL**: Rejeitado - sem type-safety, migrations manuais, error-prone

**Schema Design Principles**:
- Normalização para dados de usuário (evitar duplicação)
- JSONB para estado do tabuleiro (flexível, queries eficientes com GIN index)
- Índices compostos para queries comuns (e.g., `games WHERE status='active' AND playerId=X`)
- Soft deletes para partidas (manter histórico)

**Best Practices**:
- Usar Prisma Client singleton (evitar múltiplas conexões)
- Repository pattern para isolar queries em camada de dados
- Transactions para operações compostas (criar partida + sala + associar jogadores)
- Connection pooling (Prisma gerencia automaticamente)

**References**:
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL JSONB Performance](https://www.postgresql.org/docs/current/datatype-json.html)

---

## 4. Authentication & Authorization

### Decision: better-auth (Auth.ts)

**Rationale**:
- **Security**: CSRF protection, secure session handling, password hashing built-in
- **Providers**: Suporta email/password + OAuth (futuro: Google, GitHub)
- **Session management**: JWT ou database sessions (escolher database para revogação)
- **Next.js integration**: Middleware para proteção de rotas
- **Type-safe**: TypeScript definitions para sessão

**Alternatives Considered**:
- **Clerk**: Rejeitado - vendor lock-in, custo em escala, over-featured para MVP
- **Auth0**: Rejeitado - complexidade desnecessária, custo, external dependency
- **Manual JWT**: Rejeitado - reinventar a roda, alto risco de vulnerabilidades

**Implementation Strategy**:
- Database sessions (não JWT) para poder revogar
- Bcrypt para hashing de senhas (work factor 12)
- Session duration: 7 dias (conforme requisito)
- Refresh token rotation para segurança

**Best Practices**:
- Validar email com regex + DNS check
- Rate limiting em endpoints de auth (prevenir brute force)
- Logs de tentativas de login falhadas
- HTTPS obrigatório em produção

**References**:
- [better-auth Documentation](https://www.better-auth.com/docs/introduction)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 5. UI Framework & Styling

### Decision: React 18 + Tailwind CSS 3.x

**Rationale**:

**React 18**:
- **Concurrent features**: useTransition para animações suaves do tabuleiro
- **Suspense**: Loading states para partidas sendo carregadas
- **Ecosystem**: Maior ecossistema de componentes e hooks

**Tailwind CSS**:
- **Utility-first**: Desenvolvimento rápido sem context switching para CSS
- **Responsivo**: Mobile-first classes (sm:, md:, lg:)
- **Performance**: PurgeCSS remove classes não usadas (bundle < 10KB)
- **Customização**: Fácil definir tema (cores das peças, tabuleiro)

**Alternatives Considered**:
- **Styled Components**: Rejeitado - runtime overhead, bundle maior, CSS-in-JS menos performático
- **CSS Modules**: Rejeitado - mais verboso, menos DX que Tailwind
- **Chakra UI**: Considerado - bom para protótipos, mas overhead de components complexos

**Component Strategy**:
- Design system básico: Button, Input, Card, Modal
- Componentes compostos para jogo: Board, Piece, Square
- Hooks customizados para lógica reutilizável: useGame, useWebSocket

**Accessibility**:
- ARIA labels para peças e casas
- Navegação por teclado (Tab, Enter, Arrows)
- Screen reader announcements para movimentos

**Best Practices**:
- Usar `clsx` ou `cn()` para composição de classes condicionais
- Extrair cores/espaçamentos para tema Tailwind
- Componentes pequenos (< 200 linhas)
- Props tipadas com TypeScript

**References**:
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/reusing-styles)
- [React Accessibility](https://react.dev/learn/accessibility)

---

## 6. Testing Strategy

### Decision: Jest + React Testing Library + Playwright

**Rationale**:

**Jest (Unit Tests)**:
- **Padrão Next.js**: Configuração simplificada com Next.js
- **Coverage**: Built-in coverage reports
- **Mocking**: Fácil mockar Prisma, Socket.io
- **Performance**: Testes paralelos, cache

**React Testing Library (Component Tests)**:
- **User-centric**: Testa como usuário interage (não implementação)
- **Queries semânticas**: getByRole, getByLabelText (força acessibilidade)
- **Integração**: Testa componentes com hooks e context

**Playwright (E2E Tests)**:
- **Multi-browser**: Chrome, Firefox, Safari
- **Real WebSocket**: Testa comunicação real entre clientes
- **Paralelo**: Testes E2E paralelos em workers
- **Screenshots/videos**: Debug de falhas

**Alternatives Considered**:
- **Cypress**: Rejeitado - mais lento que Playwright, sem suporte real multi-browser
- **Vitest**: Considerado - mais rápido que Jest, mas menos maduro para Next.js

**Test Coverage Goals**:
- **Lógica do jogo (engine, validator)**: 90%+ (código crítico)
- **Componentes UI**: 70%+ (interações principais)
- **API endpoints**: 80%+ (validação, edge cases)
- **Services**: 80%+ (lógica de negócio)

**Best Practices**:
- Testes unitários para lógica pura (move validation, bot AI)
- Testes de integração para API + DB (usar DB de teste)
- E2E para fluxos completos (criar partida → jogar → finalizar)
- Mock external services (WebSocket em unit tests)

**References**:
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

## 7. Bot AI Implementation

### Decision: Minimax com Alpha-Beta Pruning (Difícil) + Heurísticas (Fácil/Médio)

**Rationale**:

**Nível Fácil**: 
- Random ponderado (peças mais avançadas têm leve preferência)
- Erros intencionais 20% do tempo (ignora captura disponível ocasionalmente)
- O(n) - avalia movimentos disponíveis e escolhe aleatório

**Nível Médio**:
- Minimax profundidade 3
- Heurística: posição + capturas potenciais + controle centro
- O(b^3) onde b = branching factor (~8-10 movimentos médios)
- Calcula em < 2s (requisito)

**Nível Difícil**:
- Minimax profundidade 5-7 com alpha-beta pruning
- Heurística sofisticada: posição, mobilidade, estrutura de peões, damas
- Opening book para primeiros 6 movimentos (cache)
- Transposition table para evitar recalcular posições
- O(b^7) mas podado para ~O(b^4) com alpha-beta
- Calcula em < 5s (requisito)

**Alternatives Considered**:
- **Monte Carlo Tree Search**: Rejeitado - over-engineering para damas, mais lento
- **Neural Network**: Rejeitado - requer treinamento, overhead desnecessário, complexidade

**Implementation Strategy**:
```typescript
function minimax(board: Board, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
  if (depth === 0 || isGameOver(board)) {
    return evaluateBoard(board);
  }
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of generateMoves(board)) {
      const newBoard = applyMove(board, move);
      const eval = minimax(newBoard, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return maxEval;
  }
  // ... minimizing player
}
```

**Best Practices**:
- Executar bot em Web Worker (não bloquear UI)
- Timeout safeguard (retornar melhor movimento até agora se exceder 5s)
- Cache de avaliações de tabuleiro (transposition table)
- Ordenar movimentos (capturas primeiro) para melhor poda

**References**:
- [Minimax Algorithm](https://en.wikipedia.org/wiki/Minimax)
- [Alpha-Beta Pruning](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning)
- [Checkers AI Strategies](https://www.researchgate.net/publication/2457228_Solving_Checkers)

---

## 8. State Management

### Decision: React Context + Custom Hooks (sem Redux/Zustand)

**Rationale**:
- **Simplicidade**: State local dos componentes suficiente para maioria dos casos
- **Context para global**: Auth state, WebSocket connection
- **Server state**: React Query desnecessário (Next.js Server Components)
- **Performance**: Hooks otimizados (useMemo, useCallback) previnem re-renders

**Alternatives Considered**:
- **Redux**: Rejeitado - over-engineering para escopo do projeto, boilerplate excessivo
- **Zustand**: Considerado - mais simples que Redux, mas Context + hooks suficiente
- **Jotai/Recoil**: Rejeitado - atomic state desnecessário para este app

**State Organization**:
- **Local state**: Seleção de peça, UI transiente (modals, dropdowns)
- **Context**: User session, WebSocket connection, theme
- **Server state**: Partidas, perfil, histórico (fetch via Server Components ou SWR)

**Best Practices**:
- Co-locate state (manter próximo de onde é usado)
- Lift state apenas quando necessário
- useReducer para state complexo (game state machine)
- Memoização criteriosa (não prematura)

**References**:
- [React State Management](https://react.dev/learn/managing-state)
- [When to use Context](https://react.dev/learn/passing-data-deeply-with-context)

---

## 9. Performance Optimization

### Strategies

**Frontend**:
- **Code splitting**: Dynamic imports para bot AI (não carrega em modo local)
- **Image optimization**: Next.js Image component para assets
- **Memoization**: React.memo para componentes de peças (evitar re-render desnecessário)
- **Virtual scrolling**: Para histórico de partidas (se > 100 itens)
- **Debouncing**: Movimentos do mouse sobre tabuleiro

**Backend**:
- **Database indexing**: Índices em `gameId`, `playerId`, `status`, `createdAt`
- **Query optimization**: Select apenas campos necessários, join eficiente
- **Caching**: Cache de salas ativas em memória (Redis futuro)
- **Connection pooling**: Prisma gerencia automaticamente

**WebSocket**:
- **Binary encoding**: Protobuf para mensagens grandes (futuro)
- **Compression**: Socket.io compression habilitado
- **Throttling**: Rate limit de movimentos (prevenir spam)

**Best Practices**:
- Lighthouse CI no pipeline (score > 90)
- Bundle analyzer para detectar bloat
- Profiling com React DevTools
- Database query logging em dev

**References**:
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)

---

## 10. Development & Deployment

### Decision: Vercel (Hosting) + GitHub Actions (CI/CD)

**Rationale**:

**Vercel**:
- **Zero-config**: Deploy Next.js com git push
- **Edge functions**: API routes próximas aos usuários
- **Preview deploys**: Deploy automático de PRs para QA
- **PostgreSQL**: Vercel Postgres integration (ou Supabase)

**GitHub Actions**:
- **CI**: Lint, tests, type-check em cada PR
- **CD**: Deploy automático para Vercel em merge
- **Free**: Para repos públicos/privados limitados

**Alternatives Considered**:
- **AWS/GCP**: Rejeitado - complexidade de setup, over-engineering para MVP
- **Railway/Render**: Considerado - bons, mas Vercel melhor integração Next.js

**CI/CD Pipeline**:
```yaml
on: [push, pull_request]
jobs:
  test:
    - npm run lint
    - npm run type-check
    - npm run test:unit
    - npm run test:integration
    - npm run build
  deploy:
    - if: branch == 'main'
    - vercel deploy --prod
```

**Best Practices**:
- Environment variables seguras (não commitar .env)
- Staging environment (branch `develop`)
- Rollback strategy (Vercel permite instant rollback)
- Monitoring com Vercel Analytics ou Sentry

**References**:
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions for Next.js](https://github.com/vercel/next.js/tree/canary/examples/with-github-actions)

---

## Summary of Decisions

| Category | Technology | Rationale |
|----------|-----------|-----------|
| Framework | Next.js 15 | Fullstack, SSR, performance, DX |
| Real-time | Socket.io 4.x | Fallback, rooms, reconnection |
| Database | PostgreSQL 15 | ACID, JSONB, já provisionado |
| ORM | Prisma 5.x | Type-safety, migrations, DX |
| Auth | better-auth | Security, session management |
| UI | React 18 + Tailwind | Ecosystem, DX, performance |
| Testing | Jest + RTL + Playwright | Coverage, DX, multi-browser |
| Bot AI | Minimax + Alpha-Beta | Optimal play, performance |
| State | Context + Hooks | Simplicidade, suficiente |
| Hosting | Vercel | Zero-config, Next.js native |

**All decisions align with constitution principles**: type-safety, maintainability, testing, performance, and developer experience.
