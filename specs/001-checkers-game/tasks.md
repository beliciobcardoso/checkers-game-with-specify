# Tasks: Jogo de Damas Multiplayer

**Feature Branch**: `001-checkers-game`  
**Input**: Design documents from `/specs/001-checkers-game/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Testes são OBRIGATÓRIOS pela constituição do projeto (cobertura mínima: 80% código crítico, 60% código geral).  
Cada user story DEVE incluir testes unitários, de integração e de contrato quando aplicável.

**Organization**: Tarefas agrupadas por user story para permitir implementação e teste independente de cada história.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode executar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3, US4)
- Incluir caminhos exatos de arquivo nas descrições

## Path Conventions

Next.js 15 App Router structure:
- **App routes**: `src/app/`
- **Components**: `src/components/`
- **Business logic**: `src/lib/`
- **Services**: `src/services/`
- **Tests**: `tests/`

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Propósito**: Inicialização do projeto e estrutura básica

**Estimativa**: 2-3 horas

- [X] T001 Criar estrutura de diretórios do Next.js 15 conforme plan.md (src/app, src/components, src/lib, src/services, tests/, prisma/)
- [X] T002 Inicializar projeto Next.js 15 com TypeScript, configurar package.json com dependências: React 18, Prisma 5.x, Socket.io 4.x, Tailwind CSS 3.x, NextAuth.js 4.x, Zod
- [X] T003 [P] Configurar ESLint com regras do projeto e Prettier para formatação
- [X] T004 [P] Configurar Tailwind CSS 3.x em tailwind.config.js com tema dark/light e cores do tabuleiro
- [X] T005 [P] Criar arquivo .env.example com variáveis: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, NODE_ENV, WS_PORT
- [X] T006 [P] Configurar Jest para testes unitários em tests/setup/jest.config.js
- [X] T007 [P] Configurar Playwright para testes E2E em tests/setup/playwright.config.ts
- [X] T008 [P] Criar arquivo README.md seguindo quickstart.md com setup, arquitetura básica e propósito
- [X] T009 Criar workflow GitHub Actions em .github/workflows/ci.yml para CI/CD (lint, testes, build)

**Checkpoint**: ✅ Estrutura básica pronta, dependências instaladas, ferramentas de desenvolvimento configuradas

---

### Phase 2: Foundational Infrastructure [BLOCKING] (T010-T023) | Est: 15h
Priority: CRITICAL - Blocks all user stories
Required before any feature work

- [X] T010: Create Prisma schema | 1h | `prisma/schema.prisma`
- [X] T011: Run first migration (`prisma migrate dev --name init`) | 0.5h
- [X] T012: Create Prisma Client singleton [P] | 0.5h | `src/lib/prisma.ts`
- [X] T013: Configure NextAuth.js [P] | 1.5h | `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- [X] T014: Create auth middleware [P] | 1h | `src/middleware.ts`
- [X] T015: Create Repository pattern base [P] | 1h | `src/lib/repositories/base.repository.ts`
- [X] T016: Create Zod validators [P] | 1.5h | `src/lib/validators/`
- [X] T017: Create constants file [P] | 0.5h | `src/lib/constants.ts`
- [X] T018: Setup WebSocket server skeleton [P] | 1.5h | `src/lib/websocket/server.ts`
- [X] T019: Create error handling utilities [P] | 1h | `src/lib/errors.ts`
- [X] T020: Create logging utility [P] | 0.5h | `src/lib/logger.ts`
- [X] T021: Create base UI components [P] | 2h | `src/components/ui/`
- [X] T022: Create root layout [P] | 0.5h | `src/app/layout.tsx`
- [X] T023: Create home page [P] | 1h | `src/app/page.tsx`

**Checkpoint**: ✅ Infraestrutura fundacional completa - Prisma, NextAuth, middleware, validadores, WebSocket, error handling, logging, componentes UI base

---

## Phase 3: User Story 1 - Partida Local Dois Jogadores (Priority: P1) 🎯 MVP

**Goal**: Implementar jogo completo de damas local no mesmo dispositivo com validação de movimentos, capturas, promoção e detecção de vitória

**Independent Test**: Abrir jogo, iniciar partida local, fazer movimentos válidos/inválidos, realizar capturas simples e múltiplas, promover peça a dama, jogar até vitória/empate

**Estimativa**: 20-25 horas

### Testes para User Story 1 (OBRIGATÓRIO pela Constituição) ✅

**⚠️ CRÍTICO: Escrever estes testes PRIMEIRO, garantir que FALHAM antes da implementação (TDD)**

**Estimativa testes**: 8-10 horas

- [X] T024 [P] [US1] Teste unitário para validação de movimentos simples em tests/unit/game/validator.test.ts (peças simples movem 1 diagonal frente)
- [X] T025 [P] [US1] Teste unitário para validação de capturas simples em tests/unit/game/validator.test.ts (pulo sobre adversário)
- [X] T026 [P] [US1] Teste unitário para detecção de capturas múltiplas em tests/unit/game/validator.test.ts (sequência obrigatória)
- [X] T027 [P] [US1] Teste unitário para promoção de peças em tests/unit/game/engine.test.ts (última linha vira dama)
- [X] T028 [P] [US1] Teste unitário para movimentos de dama em tests/unit/game/validator.test.ts (diagonais longas frente/trás)
- [X] T029 [P] [US1] Teste unitário para detecção de vitória em tests/unit/game/engine.test.ts (adversário sem peças/movimentos)
- [X] T030 [P] [US1] Teste unitário para detecção de empate em tests/unit/game/engine.test.ts (repetição 3x, 40 movimentos)
- [X] T031 [P] [US1] Teste de integração para partida completa em tests/integration/local-game.test.ts (início ao fim, validar todos os cenários de aceitação)
- [X] T032 [P] [US1] Teste E2E com Playwright em tests/e2e/local-game.spec.ts (clique em peças, movimentos, captura, vitória)

### Implementação para User Story 1

**Estimativa implementação**: 12-15 horas

#### Lógica Core do Jogo

- [X] T033 [P] [US1] Criar tipos TypeScript em src/types/game.ts (Piece, BoardState, Move, GameStatus, Color)
- [X] T034 [P] [US1] Implementar gerador de tabuleiro inicial em src/lib/game/board.ts (24 peças posicionadas corretamente)
- [X] T035 [US1] Implementar validador de movimentos simples em src/lib/game/validator.ts função `validateSimpleMove(piece, toRow, toCol, board)` (depende de T033, T034)
- [X] T036 [US1] Implementar validador de capturas em src/lib/game/validator.ts função `validateCapture(piece, toRow, toCol, board)` (depende de T035)
- [X] T037 [US1] Implementar detector de capturas múltiplas em src/lib/game/validator.ts função `findMultipleCaptures(piece, board)` (depende de T036)
- [X] T038 [US1] Implementar validador de movimentos de dama em src/lib/game/validator.ts função `validateKingMove(piece, toRow, toCol, board)` (depende de T035)
- [X] T039 [US1] Implementar executor de movimento em src/lib/game/engine.ts função `executeMove(move, game)` com atualização de boardState (depende de T036, T037)
- [X] T040 [US1] Implementar lógica de promoção em src/lib/game/engine.ts função `checkPromotion(piece)` (depende de T039)
- [X] T041 [US1] Implementar detector de vitória em src/lib/game/engine.ts função `checkVictory(game)` (depende de T039)
- [X] T042 [US1] Implementar detector de empate em src/lib/game/engine.ts função `checkDraw(game)` (repetição posição + 40 movimentos) (depende de T039)
- [X] T043 [US1] Implementar detector de movimentos válidos em src/lib/game/engine.ts função `getValidMoves(piece, board)` para highlighting (depende de T035, T036, T038)

#### Componentes React

- [X] T044 [P] [US1] Criar componente Square em src/components/game/Square.tsx (casa do tabuleiro com evento onClick)
- [X] T045 [P] [US1] Criar componente Piece em src/components/game/Piece.tsx (peça branca/preta, simples/dama com ícones)
- [X] T046 [US1] Criar componente Board em src/components/game/Board.tsx renderizando 8x8 Squares com Pieces (depende de T044, T045)
- [X] T047 [US1] Criar componente GameControls em src/components/game/GameControls.tsx (turno atual, botão reiniciar, botão desistir) (depende de T046)
- [X] T048 [US1] Criar componente GameOverModal em src/components/game/GameOverModal.tsx (vitória/empate, botão jogar novamente)

#### Hooks e Estado

- [X] T049 [US1] Criar hook useLocalGame em src/hooks/useLocalGame.ts com estado (board, currentTurn, selectedPiece, validMoves) e funções (handleSquareClick, resetGame) (depende de T039, T041, T042, T043)

#### Página e Integração

- [X] T050 [US1] Criar página de partida local em src/app/game/local/page.tsx integrando Board, GameControls, useLocalGame (depende de T046, T047, T049)
- [X] T051 [US1] Adicionar validação visual em Board.tsx (highlight casas válidas ao selecionar peça, bloqueio de cliques no turno errado) (depende de T046, T049)
- [X] T052 [US1] Adicionar animações de movimento em Board.tsx usando Tailwind transitions (peça desliza para nova casa) (depende de T051)
- [X] T053 [US1] Adicionar feedback de erros em GameControls.tsx (toast/mensagem para movimento inválido) (depende de T047, T049)
- [X] T054 [US1] Implementar logging de eventos do jogo (movimento executado, captura, promoção, vitória) usando logger (depende de T050)

**Checkpoint**: User Story 1 completa e testável independentemente - jogo local totalmente funcional

---

## Phase 4: User Story 4 - Sistema de Autenticação e Perfil (Priority: P2)

**Goal**: Permitir criação de conta, login, visualização de perfil com estatísticas e histórico

**Independent Test**: Criar conta, fazer login, visualizar perfil vazio, jogar partidas (simular resultados), verificar atualização de estatísticas

**Nota**: US4 vem antes de US2 porque autenticação é pré-requisito para online multiplayer

**Estimativa**: 12-15 horas

### Testes para User Story 4 (OBRIGATÓRIO pela Constituição) ✅

**Estimativa testes**: 5-6 horas

- [X] T055 [P] [US4] Teste de contrato para POST /api/auth/register em tests/integration/api/auth.test.ts (validação email único, senha mínimo 8 chars)
- [X] T056 [P] [US4] Teste de contrato para POST /api/auth/login em tests/integration/api/auth.test.ts (credenciais válidas/inválidas)
- [X] T057 [P] [US4] Teste de contrato para GET /api/players/me em tests/integration/api/players.test.ts (retorna dados do jogador autenticado)
- [X] T058 [P] [US4] Teste de contrato para GET /api/players/me/stats em tests/integration/api/players.test.ts (retorna estatísticas corretas)
- [X] T059 [P] [US4] Teste unitário para hash de senha em tests/unit/services/PlayerService.test.ts (bcrypt, verificação)
- [X] T060 [P] [US4] Teste E2E de registro e login em tests/e2e/auth.spec.ts (criar conta, logout, login novamente)

### Implementação para User Story 4

**Estimativa implementação**: 7-9 horas

#### Repository e Service Layer

- [X] T061 [P] [US4] Criar PlayerRepository em src/lib/db/repositories/player.ts com métodos: create, findByEmail, findById, updateStats
- [X] T062 [US4] Criar PlayerService em src/services/PlayerService.ts com métodos: register, login, updateStatistics (hash bcrypt, validação Zod) (depende de T061)

#### API Endpoints

- [ ] T063 [US4] Implementar POST /api/auth/register em src/app/api/auth/register/route.ts usando PlayerService (depende de T062)
- [ ] T064 [US4] Implementar POST /api/auth/login em src/app/api/auth/login/route.ts usando PlayerService (depende de T062)
- [ ] T065 [P] [US4] Implementar POST /api/auth/logout em src/app/api/auth/logout/route.ts (limpar sessão)
- [ ] T066 [P] [US4] Implementar GET /api/players/me em src/app/api/players/me/route.ts (dados do jogador autenticado)
- [ ] T067 [P] [US4] Implementar GET /api/players/me/stats em src/app/api/players/me/stats/route.ts (estatísticas: wins, losses, draws, total)
- [ ] T068 [P] [US4] Implementar GET /api/players/me/history em src/app/api/players/me/history/route.ts (últimas 20 partidas com paginação)

#### Componentes de UI

- [ ] T069 [P] [US4] Criar componente LoginForm em src/components/auth/LoginForm.tsx com validação Zod (email, senha)
- [ ] T070 [P] [US4] Criar componente RegisterForm em src/components/auth/RegisterForm.tsx com validação Zod (email único, senha forte, username)
- [ ] T071 [P] [US4] Criar componente ProfileCard em src/components/profile/ProfileCard.tsx (username, email, data de cadastro)
- [ ] T072 [P] [US4] Criar componente StatsCard em src/components/profile/StatsCard.tsx (vitórias, derrotas, empates, taxa de vitória)
- [ ] T073 [P] [US4] Criar componente GameHistoryTable em src/components/profile/GameHistoryTable.tsx (tabela com adversário, resultado, data)

#### Páginas

- [ ] T074 [US4] Criar página de login em src/app/(auth)/login/page.tsx com LoginForm (depende de T069)
- [ ] T075 [US4] Criar página de registro em src/app/(auth)/register/page.tsx com RegisterForm (depende de T070)
- [ ] T076 [US4] Criar página de perfil em src/app/profile/page.tsx com ProfileCard, StatsCard, GameHistoryTable (depende de T071, T072, T073)

#### Integração com US1

- [ ] T077 [US4] Atualizar useLocalGame hook para salvar resultado de partida local via API se jogador autenticado (depende de T050, T062)
- [ ] T078 [US4] Adicionar link "Criar Conta" e "Login" no menu principal src/app/page.tsx (depende de T023)

**Checkpoint**: User Story 4 completa - sistema de autenticação funcional, perfil com estatísticas

---

## Phase 5: User Story 2 - Partida Online Multiplayer (Priority: P2)

**Goal**: Dois jogadores em dispositivos diferentes jogam em tempo real com sincronização via WebSocket

**Independent Test**: Abrir jogo em dois navegadores, criar sala, entrar com código, fazer movimentos que sincronizam < 500ms, desconectar e reconectar

**Estimativa**: 25-30 horas

### Testes para User Story 2 (OBRIGATÓRIO pela Constituição) ✅

**Estimativa testes**: 10-12 horas

- [ ] T079 [P] [US2] Teste de contrato para POST /api/rooms em tests/integration/api/rooms.test.ts (cria sala com código único 6 chars)
- [ ] T080 [P] [US2] Teste de contrato para POST /api/rooms/{code}/join em tests/integration/api/rooms.test.ts (entra em sala existente)
- [ ] T081 [P] [US2] Teste de contrato para POST /api/games em tests/integration/api/games.test.ts (cria partida online)
- [ ] T082 [P] [US2] Teste de contrato para POST /api/games/{id}/move em tests/integration/api/games.test.ts (registra movimento)
- [ ] T083 [P] [US2] Teste unitário para eventos WebSocket em tests/unit/websocket/handlers.test.ts (join-room, make-move, disconnect)
- [ ] T084 [P] [US2] Teste de integração WebSocket em tests/integration/websocket/online-game.test.ts (dois clientes conectam, sincronizam movimentos)
- [ ] T085 [P] [US2] Teste de reconexão em tests/integration/websocket/reconnection.test.ts (cliente desconecta e retoma partida)
- [ ] T086 [P] [US2] Teste E2E multiplayer em tests/e2e/online-game.spec.ts (dois navegadores Playwright, partida completa)

### Implementação para User Story 2

**Estimativa implementação**: 15-18 horas

#### Repository e Service Layer

- [ ] T087 [P] [US2] Criar RoomRepository em src/lib/db/repositories/room.ts com métodos: create (gera código 6 chars), findByCode, addPlayer, updateStatus
- [ ] T088 [P] [US2] Criar GameRepository em src/lib/db/repositories/game.ts com métodos: create, findById, updateBoardState, updateStatus, saveMove
- [ ] T089 [US2] Criar RoomService em src/services/RoomService.ts com lógica: criar sala, validar código, gerenciar jogadores (depende de T087)
- [ ] T090 [US2] Criar GameService em src/services/GameService.ts com lógica: criar partida online, executar movimento, salvar estado (depende de T088, reusar engine de T039)

#### API Endpoints

- [ ] T091 [US2] Implementar POST /api/rooms em src/app/api/rooms/route.ts (cria sala, retorna código) (depende de T089)
- [ ] T092 [US2] Implementar POST /api/rooms/[code]/join em src/app/api/rooms/[code]/join/route.ts (entra em sala) (depende de T089)
- [ ] T093 [US2] Implementar GET /api/rooms/[code] em src/app/api/rooms/[code]/route.ts (info da sala) (depende de T089)
- [ ] T094 [US2] Implementar POST /api/games em src/app/api/games/route.ts (cria partida online) (depende de T090)
- [ ] T095 [US2] Implementar GET /api/games em src/app/api/games/route.ts (lista partidas do jogador) (depende de T090)
- [ ] T096 [US2] Implementar GET /api/games/[id] em src/app/api/games/[id]/route.ts (detalhes da partida) (depende de T090)
- [ ] T097 [US2] Implementar POST /api/games/[id]/move em src/app/api/games/[id]/move/route.ts (registra movimento) (depende de T090)
- [ ] T098 [US2] Implementar POST /api/games/[id]/resign em src/app/api/games/[id]/resign/route.ts (desistir da partida) (depende de T090)

#### WebSocket Handlers

- [ ] T099 [P] [US2] Implementar handler join-room em src/lib/websocket/handlers/joinRoom.ts (jogador entra em sala Socket.io)
- [ ] T100 [P] [US2] Implementar handler make-move em src/lib/websocket/handlers/makeMove.ts (valida e broadcast movimento)
- [ ] T101 [P] [US2] Implementar handler disconnect em src/lib/websocket/handlers/disconnect.ts (notifica adversário, timer 5min)
- [ ] T102 [P] [US2] Implementar handler reconnect em src/lib/websocket/handlers/reconnect.ts (restaura estado, cancela timer)
- [ ] T103 [P] [US2] Implementar handler resign em src/lib/websocket/handlers/resign.ts (broadcast desistência)
- [ ] T104 [US2] Integrar handlers em src/lib/websocket/server.ts (registrar eventos, middleware de autenticação) (depende de T099, T100, T101, T102, T103)

#### Componentes React

- [ ] T105 [P] [US2] Criar componente CreateRoomModal em src/components/online/CreateRoomModal.tsx (botão criar sala, exibe código gerado)
- [ ] T106 [P] [US2] Criar componente JoinRoomModal em src/components/online/JoinRoomModal.tsx (input código, botão entrar)
- [ ] T107 [P] [US2] Criar componente WaitingRoom em src/components/online/WaitingRoom.tsx (aguardando segundo jogador, mostra código)
- [ ] T108 [P] [US2] Criar componente OnlineGameBoard em src/components/online/OnlineGameBoard.tsx (board com sincronização WebSocket, reutilizar Board de T046)
- [ ] T109 [P] [US2] Criar componente ConnectionStatus em src/components/online/ConnectionStatus.tsx (indicador conectado/desconectado/reconectando)
- [ ] T110 [P] [US2] Criar componente ActiveGamesList em src/components/online/ActiveGamesList.tsx (lista partidas em andamento, botão continuar)

#### Hooks e Cliente WebSocket

- [ ] T111 [US2] Criar hook useWebSocket em src/hooks/useWebSocket.ts (conecta Socket.io, handlers de eventos, reconexão automática) (depende de T018)
- [ ] T112 [US2] Criar hook useOnlineGame em src/hooks/useOnlineGame.ts (estado do jogo online, integra useWebSocket, sincroniza movimentos) (depende de T111, T100)

#### Páginas

- [ ] T113 [US2] Criar página online menu em src/app/game/online/page.tsx (botões: Criar Sala, Entrar em Sala, Partidas Ativas) (depende de T105, T106, T110)
- [ ] T114 [US2] Criar página sala de espera em src/app/game/online/room/[code]/page.tsx (WaitingRoom até segundo jogador) (depende de T107, T111)
- [ ] T115 [US2] Criar página partida online em src/app/game/online/play/[gameId]/page.tsx (OnlineGameBoard, ConnectionStatus, useOnlineGame) (depende de T108, T109, T112)

#### Funcionalidades de Reconexão

- [ ] T116 [US2] Implementar lógica de salvamento automático em GameService (salva a cada movimento) (depende de T090)
- [ ] T117 [US2] Implementar endpoint GET /api/players/me/active-games em src/app/api/players/me/active-games/route.ts (partidas em andamento)
- [ ] T118 [US2] Adicionar lógica de retomada em useOnlineGame hook (carrega estado ao reconectar) (depende de T112, T117)
- [ ] T119 [US2] Implementar timer de abandono em disconnect handler (5min, declara vitória por W.O.) (depende de T101)

#### Integração com US4

- [ ] T120 [US2] Atualizar PlayerService para registrar resultado de partidas online em estatísticas (depende de T062, T090)

**Checkpoint**: User Story 2 completa - multiplayer online funcional com sincronização tempo real, reconexão, e salvamento de estado

---

## Phase 6: User Story 3 - Partida Contra Bot (Priority: P3)

**Goal**: Jogador pode jogar contra IA com três níveis de dificuldade (Fácil, Médio, Difícil)

**Independent Test**: Selecionar "Jogar contra Bot", escolher dificuldade, verificar que bot faz movimentos válidos em tempo razoável, testar diferentes níveis

**Estimativa**: 18-22 horas

### Testes para User Story 3 (OBRIGATÓRIO pela Constituição) ✅

**Estimativa testes**: 7-8 horas

- [ ] T121 [P] [US3] Teste unitário para bot Fácil em tests/unit/game/bot/easy.test.ts (movimentos aleatórios válidos, < 1s)
- [ ] T122 [P] [US3] Teste unitário para bot Médio em tests/unit/game/bot/medium.test.ts (considera 2-3 jogadas, < 2s)
- [ ] T123 [P] [US3] Teste unitário para bot Difícil em tests/unit/game/bot/hard.test.ts (minimax alpha-beta, < 5s)
- [ ] T124 [P] [US3] Teste de integração para partida contra bot em tests/integration/bot-game.test.ts (partida completa, bot respeita regras)
- [ ] T125 [P] [US3] Teste de performance para bot Difícil em tests/unit/game/bot/hard.perf.test.ts (profundidade 5-7, tempo aceitável)
- [ ] T126 [P] [US3] Teste de contrato para POST /api/games com type BOT em tests/integration/api/games.test.ts
- [ ] T127 [P] [US3] Teste E2E de partida contra bot em tests/e2e/bot-game.spec.ts (seleciona dificuldade, joga até vitória)

### Implementação para User Story 3

**Estimativa implementação**: 11-14 horas

#### Algoritmos de IA

- [ ] T128 [P] [US3] Implementar bot Fácil em src/lib/game/bot/easy.ts (movimentos aleatórios ponderados, evita movimentos obviamente ruins)
- [ ] T129 [US3] Implementar bot Médio em src/lib/game/bot/medium.ts (lookahead 2-3 jogadas, heurística simples para avaliação) (depende de T128)
- [ ] T130 [US3] Implementar função de avaliação de tabuleiro em src/lib/game/bot/evaluation.ts (pontuação: peças, damas, posição, mobilidade) (depende de T129)
- [ ] T131 [US3] Implementar algoritmo Minimax com alpha-beta em src/lib/game/bot/minimax.ts (recursão com profundidade configurável) (depende de T130)
- [ ] T132 [US3] Implementar bot Difícil em src/lib/game/bot/hard.ts (usa minimax depth 5-7, ordenação de movimentos) (depende de T131)
- [ ] T133 [US3] Criar factory de bot em src/lib/game/bot/factory.ts (seleciona bot baseado em dificuldade) (depende de T128, T129, T132)

#### Service Layer

- [ ] T134 [US3] Criar BotService em src/services/BotService.ts (inicia partida contra bot, executa turno do bot, registra resultado) (depende de T133, reusar GameService de T090)

#### API Endpoints

- [ ] T135 [US3] Atualizar POST /api/games para suportar type BOT com botDifficulty (depende de T134)
- [ ] T136 [US3] Criar endpoint POST /api/games/[id]/bot-move em src/app/api/games/[id]/bot-move/route.ts (trigger movimento do bot) (depende de T134)

#### Componentes React

- [ ] T137 [P] [US3] Criar componente DifficultySelector em src/components/bot/DifficultySelector.tsx (radio buttons: Fácil, Médio, Difícil com descrições)
- [ ] T138 [P] [US3] Criar componente BotGameBoard em src/components/bot/BotGameBoard.tsx (board com loader durante cálculo do bot, reutilizar Board de T046)
- [ ] T139 [P] [US3] Criar componente BotThinking em src/components/bot/BotThinking.tsx (indicador "Bot está pensando..." com spinner)

#### Hooks

- [ ] T140 [US3] Criar hook useBotGame em src/hooks/useBotGame.ts (estado do jogo, trigger movimento do bot após jogador, polling ou WebSocket) (depende de T134, T136)

#### Páginas

- [ ] T141 [US3] Criar página seleção de dificuldade em src/app/game/bot/page.tsx (DifficultySelector, botão iniciar) (depende de T137)
- [ ] T142 [US3] Criar página partida contra bot em src/app/game/bot/play/[gameId]/page.tsx (BotGameBoard, BotThinking, useBotGame) (depende de T138, T139, T140)

#### Integração com US4

- [ ] T143 [US3] Atualizar PlayerService para registrar resultado de partidas contra bot em estatísticas com indicação de dificuldade (depende de T062, T134)

**Checkpoint**: User Story 3 completa - IA funcional com três níveis de dificuldade

---

## Phase 7: Polish & Cross-Cutting Concerns

**Propósito**: Melhorias que afetam múltiplas user stories, documentação final, otimizações

**Estimativa**: 8-12 horas

- [ ] T144 [P] Adicionar testes de acessibilidade com Axe em tests/e2e/accessibility.spec.ts (navegação teclado, screen readers, WCAG 2.1 AA)
- [ ] T145 [P] Implementar seed script em prisma/seed.ts (3 usuários exemplo, 2 partidas em andamento, 1 sala de espera)
- [ ] T146 [P] Criar documentação de API com Swagger UI em src/app/api/docs usando OpenAPI spec de contracts/rest-api.yaml
- [ ] T147 [P] Implementar rate limiting em endpoints críticos (POST /api/games/[id]/move: 1 req/s, POST /api/rooms: 5 req/min)
- [ ] T148 [P] Adicionar animações de captura em Board.tsx (peça capturada desaparece com fade-out)
- [ ] T149 [P] Adicionar sons de movimento e captura (opcional, arquivos em public/sounds/)
- [ ] T150 [P] Implementar modo dark/light theme toggle em Header.tsx
- [ ] T151 [P] Adicionar toast notifications para eventos importantes (movimento inválido, adversário desconectou, vitória)
- [ ] T152 [P] Otimizar queries Prisma com select específico (evitar carregar campos desnecessários)
- [ ] T153 [P] Adicionar índices compostos no Prisma para queries de "partidas ativas" e "histórico de jogador"
- [ ] T154 Executar testes de performance com k6 ou Artillery (simular 100 partidas simultâneas, validar < 500ms latência)
- [ ] T155 Configurar monitoring com Vercel Analytics ou similar (rastrear latência, erros, uptime)
- [ ] T156 [P] Adicionar meta tags SEO em layout.tsx (Open Graph, Twitter Cards)
- [ ] T157 [P] Criar página de erro 404 customizada em src/app/not-found.tsx
- [ ] T158 [P] Criar página de erro 500 customizada em src/app/error.tsx
- [ ] T159 Executar validação de cobertura de testes (atingir 80% código crítico, 60% geral conforme constituição)
- [ ] T160 Executar ESLint e Prettier em todo o projeto, corrigir warnings
- [ ] T161 Executar build de produção e validar que não há erros TypeScript
- [ ] T162 Validar quickstart.md (seguir passo a passo em máquina limpa, garantir que funciona)
- [ ] T163 [P] Adicionar CONTRIBUTING.md com guidelines para novos desenvolvedores (convenções de commit, workflow de PR)
- [ ] T164 [P] Atualizar README.md com screenshots, badges de CI, link para demo

**Checkpoint Final**: Projeto completo, polido e pronto para produção

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: Sem dependências - pode começar imediatamente  
   **Estimativa**: 2-3 horas

2. **Foundational (Phase 2)**: Depende de Setup completo - **BLOQUEIA todas as user stories**  
   **Estimativa**: 6-8 horas

3. **User Stories (Phases 3-6)**: Todas dependem de Foundational completo
   - **US1 (Phase 3)**: Pode começar após Foundational - Sem dependências de outras stories  
     **Estimativa**: 20-25 horas
   - **US4 (Phase 4)**: Pode começar após Foundational - Sem dependências de outras stories (mas necessário para US2)  
     **Estimativa**: 12-15 horas
   - **US2 (Phase 5)**: Requer US4 completo (autenticação) - Pode usar lógica de jogo de US1  
     **Estimativa**: 25-30 horas
   - **US3 (Phase 6)**: Pode começar após Foundational - Pode usar lógica de jogo de US1  
     **Estimativa**: 18-22 horas

4. **Polish (Phase 7)**: Depende de todas as user stories desejadas estarem completas  
   **Estimativa**: 8-12 horas

### Parallel Opportunities

#### Dentro de Setup (Phase 1)
Podem executar em paralelo: T003, T004, T005, T006, T007, T008

#### Dentro de Foundational (Phase 2)
Podem executar em paralelo: T012, T013, T014, T015, T016, T017, T019, T020, T021, T022, T023

#### Entre User Stories (após Foundational completo)
- **Cenário 1 equipe**: US1 → US4 → US2 → US3 (sequencial)
- **Cenário 2 desenvolvedores**: 
  - Dev A: US1 (20-25h)
  - Dev B: US4 (12-15h) → ajuda em US2
- **Cenário 3+ desenvolvedores**:
  - Dev A: US1
  - Dev B: US4
  - Dev C: US3 (pode começar em paralelo)
  - Depois: Todos colaboram em US2

#### Dentro de Cada User Story

**US1 (Phase 3)**:
- Testes (T024-T032): Todos paralelos
- Implementação: T033, T034 paralelos; depois T044, T045, T048 paralelos

**US4 (Phase 4)**:
- Testes (T055-T060): Todos paralelos
- Implementação: T061 solo; depois T065, T066, T067, T068 paralelos; depois T069-T073 paralelos

**US2 (Phase 5)**:
- Testes (T079-T086): Todos paralelos
- Implementação: T087, T088 paralelos; depois T099-T103 paralelos; depois T105-T110 paralelos

**US3 (Phase 6)**:
- Testes (T121-T127): Todos paralelos
- Implementação: T128 solo; depois T137-T139 paralelos

#### Polish (Phase 7)
Quase todas tarefas podem executar em paralelo (T144-T164 exceto T154, T159, T161, T162)

---

## Implementation Strategy

### Estimativa Total

- **Setup**: 2-3 horas
- **Foundational**: 6-8 horas
- **US1 (MVP)**: 20-25 horas
- **US4 (Auth)**: 12-15 horas
- **US2 (Online)**: 25-30 horas
- **US3 (Bot)**: 18-22 horas
- **Polish**: 8-12 horas

**Total**: **91-115 horas** (aproximadamente 12-15 dias úteis para 1 desenvolvedor, ou 6-8 dias para 2 desenvolvedores)

### MVP First (User Story 1 Only) 🎯

**Objetivo**: Entregar jogo funcional local o mais rápido possível

**Tempo estimado**: 28-36 horas (3-5 dias)

1. ✅ Complete Phase 1: Setup (2-3h)
2. ✅ Complete Phase 2: Foundational (6-8h)
3. ✅ Complete Phase 3: User Story 1 (20-25h)
4. **STOP e VALIDAR**: Testar jogo local independentemente
5. Deploy/demo se estiver pronto

**Entrega**: Jogo de damas completo jogável localmente com validação de regras, capturas, promoção, detecção de vitória

### Incremental Delivery

**Objetivo**: Adicionar valor incrementalmente, cada user story testável independentemente

1. **Semana 1**: Setup + Foundational + US1 → **MVP funcional**
2. **Semana 2**: US4 (Auth) → Sistema de perfil e estatísticas
3. **Semana 3**: US2 (Online) → Multiplayer em tempo real
4. **Semana 4**: US3 (Bot) + Polish → IA e acabamento final

Cada incremento adiciona valor sem quebrar funcionalidades anteriores.

### Parallel Team Strategy

Com 2-3 desenvolvedores:

**Fase Inicial (juntos)**:
1. Setup + Foundational: 8-11 horas (1-2 dias)

**Paralelo após Foundational**:
- **Dev A**: US1 (jogo local) - 20-25h
- **Dev B**: US4 (autenticação) - 12-15h → depois ajuda em US2
- **Dev C** (se disponível): US3 (bot) - 18-22h

**Colaboração Final**:
- Todos em US2 (online multiplayer, mais complexa) - 25-30h
- Todos em Polish - 8-12h

**Tempo total com 2 devs**: ~6-8 dias úteis  
**Tempo total com 3 devs**: ~4-6 dias úteis

---

## Task Execution Checklist

Ao completar cada tarefa:

- [ ] Escrever testes PRIMEIRO (TDD - garantir que falham)
- [ ] Implementar funcionalidade
- [ ] Verificar que testes passam
- [ ] Executar linting (`npm run lint`)
- [ ] Verificar formatação (`npm run format:check`)
- [ ] Commitar mudanças (`git commit -m "feat: [TaskID] descrição"`)
- [ ] Atualizar documentação se necessário
- [ ] Marcar tarefa como completa neste arquivo

Ao completar cada User Story:

- [ ] Executar todos os testes da story (`npm test -- [pattern]`)
- [ ] Validar teste independente conforme especificação
- [ ] Executar build local (`npm run build`)
- [ ] Testar manualmente conforme cenários de aceitação
- [ ] Criar PR se em feature branch separada
- [ ] Demo/revisão com stakeholders

---

## Notes

- **[P] tasks**: Arquivos diferentes, sem dependências - podem executar em paralelo
- **[Story] label**: Mapeia tarefa para user story específica (rastreabilidade)
- **TDD obrigatório**: Testes devem FALHAR antes de implementar (constituição)
- **Cobertura mínima**: 80% código crítico (validação, engine, bot), 60% geral
- **Commit frequente**: Após cada tarefa ou grupo lógico
- **Boy Scout Rule**: Deixar código melhor que encontrou ao fazer refactoring
- **Constitution compliance**: Validar em cada checkpoint (naming, DRY, SOLID, docs)
- Cada user story deve ser independentemente testável e entregar valor
- Parar em qualquer checkpoint para validar story independentemente
- Evitar: tarefas vagas, conflitos de arquivo, dependências cross-story que quebram independência
