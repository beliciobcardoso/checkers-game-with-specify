# Feature Specification: Jogo de Damas Multiplayer

**Feature Branch**: `001-checkers-game`  
**Created**: 2025-11-05  
**Status**: Draft  
**Input**: User description: "Construa um jogo de damas com regras claras, incluindo movimentação das peças, captura, promoção e condições de vitória que possa jogar dois play na rede ou contra um bot."

## Clarifications

### Session 2025-11-06

- Q: Qual biblioteca de autenticação usar para FR-030 a FR-037? → A: NextAuth.js 4.x
- Q: O que significa "estratégia aleatória ponderada" em FR-026? → A: Movimentos aleatórios com preferência 60% capturas
- Q: Profundidade exata para bot nível Médio em FR-027 (2-3 jogadas)? → A: Profundidade fixa de 3 jogadas
- Q: Timeout para W.O. em partida online - 2min ou 5min? → A: 5 minutos
- Q: Quais atributos a entidade Session deve ter? → A: id, userId, token, expires, createdAt

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Partida Local Dois Jogadores (Priority: P1)

Dois jogadores podem jogar uma partida completa de damas no mesmo dispositivo, alternando turnos, com validação automática de movimentos válidos e detecção de fim de jogo.

**Why this priority**: É o MVP essencial - valida toda a lógica do jogo (movimentação, captura, promoção, vitória) sem complexidades de rede ou IA. Permite testar e refinar a experiência de jogo antes de adicionar funcionalidades complexas.

**Independent Test**: Pode ser testado abrindo o jogo, iniciando partida local, fazendo movimentos válidos/inválidos, realizando capturas simples e múltiplas, promovendo peças a damas, e jogando até condição de vitória. Entrega valor imediato como jogo funcional.

**Acceptance Scenarios**:

1. **Given** tabuleiro inicial 8x8 com peças posicionadas corretamente, **When** jogador clica em peça própria e em casa válida, **Then** peça move para nova posição e turno passa para adversário
2. **Given** peça adversária adjacente com casa vazia após ela, **When** jogador move sua peça sobre a adversária, **Then** peça adversária é capturada e removida do tabuleiro
3. **Given** peça simples alcança última linha do tabuleiro, **When** movimento é concluído, **Then** peça é promovida a dama (visualmente diferenciada)
4. **Given** dama em posição central, **When** jogador seleciona a dama, **Then** sistema destaca todas as casas válidas em diagonais longas (movimento de dama)
5. **Given** jogador capturou peça mas há captura adicional disponível, **When** primeira captura é executada, **Then** sistema força continuação do movimento com a mesma peça
6. **Given** um jogador não tem peças ou movimentos válidos, **When** turno inicia, **Then** sistema declara vitória do adversário e exibe mensagem de fim de jogo

---

### User Story 2 - Partida Online Multiplayer (Priority: P2)

Dois jogadores em dispositivos diferentes podem encontrar-se online, jogar uma partida em tempo real com sincronização de movimentos, e retomar partidas em andamento.

**Why this priority**: Expande o valor do jogo para experiência social online. Depende da lógica de jogo (P1) estar sólida, mas é independente da IA.

**Independent Test**: Pode ser testado abrindo o jogo em dois dispositivos/navegadores, criando/entrando em sala de jogo, fazendo movimentos que aparecem em ambos os lados em tempo real, desconectando e reconectando para retomar partida. Entrega valor como jogo social online.

**Acceptance Scenarios**:

1. **Given** usuário autenticado no menu principal, **When** seleciona "Jogar Online" e "Criar Partida", **Then** sistema gera código único de sala e aguarda segundo jogador
2. **Given** código de sala válido inserido, **When** segundo jogador clica "Entrar na Partida", **Then** ambos os jogadores veem tabuleiro inicial e partida começa
3. **Given** partida online em andamento, **When** jogador faz movimento válido, **Then** movimento aparece instantaneamente no dispositivo do adversário (latência < 500ms)
4. **Given** partida online em andamento, **When** jogador fecha navegador/app, **Then** partida é salva e pode ser retomada ao reconectar dentro de 24 horas
5. **Given** jogador desconectado há mais de 5 minutos, **When** tempo expira, **Then** adversário recebe opção de declarar vitória por W.O. ou aguardar
6. **Given** partida online finalizada, **When** fim de jogo detectado, **Then** resultado é salvo no histórico de ambos os jogadores

---

### User Story 3 - Partida Contra Bot (Priority: P3)

Jogador pode jogar contra inteligência artificial com diferentes níveis de dificuldade (Fácil, Médio, Difícil), recebendo desafio apropriado ao seu nível de habilidade.

**Why this priority**: Adiciona valor para jogador solo e prática, mas depende da lógica de jogo estar completa. Pode ser desenvolvida em paralelo com P2 por equipe diferente.

**Independent Test**: Pode ser testado selecionando "Jogar contra Bot", escolhendo dificuldade, e observando que bot faz movimentos válidos em tempo razoável (< 3s), com bot Fácil cometendo erros ocasionais e bot Difícil jogando otimamente. Entrega valor como modo treino/prática.

**Acceptance Scenarios**:

1. **Given** menu de novo jogo, **When** jogador seleciona "Jogar contra Bot" e nível "Fácil", **Then** partida inicia com jogador tendo primeiro turno
2. **Given** turno do bot nível Fácil, **When** bot calcula jogada, **Then** movimento é feito em até 3 segundos e pode incluir erros táticos ocasionais
3. **Given** turno do bot nível Médio, **When** bot calcula jogada, **Then** movimento considera 2-3 jogadas à frente e evita capturas óbvias
4. **Given** turno do bot nível Difícil, **When** bot calcula jogada, **Then** movimento é otimizado usando algoritmo minimax (profundidade 5+) e raramente comete erros
5. **Given** bot tem captura obrigatória disponível, **When** bot calcula movimento, **Then** bot sempre executa captura (respeitando regras oficiais)
6. **Given** jogador vence bot em qualquer dificuldade, **When** partida termina, **Then** vitória é registrada em estatísticas com indicação do nível do bot

---

### User Story 4 - Sistema de Autenticação e Perfil (Priority: P2)

Usuários podem criar conta, fazer login, visualizar histórico de partidas, estatísticas de vitórias/derrotas, e retomar partidas salvas.

**Why this priority**: Necessário para funcionalidade online (P2) e personalização. Pode ser desenvolvido em paralelo com lógica de jogo.

**Independent Test**: Pode ser testado criando nova conta, fazendo login, visualizando perfil vazio, jogando partidas (local ou online), e verificando que estatísticas e histórico são atualizados corretamente.

**Acceptance Scenarios**:

1. **Given** tela de entrada, **When** usuário fornece email válido e senha (mínimo 8 caracteres), **Then** conta é criada e usuário é autenticado automaticamente
2. **Given** usuário com conta existente, **When** insere credenciais corretas, **Then** sistema autentica e carrega perfil com estatísticas
3. **Given** usuário autenticado, **When** acessa "Meu Perfil", **Then** vê nome de usuário, total de partidas, vitórias, derrotas, taxa de vitória
4. **Given** usuário com partidas online inacabadas, **When** acessa "Partidas em Andamento", **Then** vê lista de partidas pendentes com adversário e última jogada
5. **Given** usuário selecionando partida em andamento, **When** clica em "Continuar", **Then** partida é carregada no estado exato em que foi salva
6. **Given** usuário autenticado, **When** fecha app sem fazer logout, **Then** sessão persiste por 7 dias e usuário permanece logado

---

### Edge Cases

- **Captura múltipla obrigatória**: Se após uma captura a mesma peça pode capturar novamente, jogador DEVE continuar capturando (regra oficial)
- **Captura com dama**: Dama pode capturar em qualquer diagonal longa e pousar em qualquer casa vazia após a peça capturada
- **Empate por repetição**: Se mesma posição se repete 3 vezes ou 40 movimentos sem captura/promoção, partida termina em empate
- **Desconexão durante captura múltipla**: Se jogador desconecta no meio de sequência de capturas obrigatórias, movimento parcial é revertido ao reconectar
- **Dois jogadores tentam entrar na mesma sala simultaneamente**: Terceiro jogador recebe mensagem "Sala cheia"
- **Bot calculando quando jogador fecha o jogo**: Partida contra bot não é salva automaticamente (apenas partidas online)
- **Peça selecionada sem movimentos válidos**: Sistema exibe mensagem "Sem movimentos válidos para esta peça"
- **Tentativa de movimento inválido durante captura obrigatória**: Sistema destaca apenas capturas disponíveis e bloqueia outros movimentos

## Requirements *(mandatory)*

### Functional Requirements

#### Lógica do Jogo

- **FR-001**: Sistema DEVE renderizar tabuleiro 8x8 com padrão xadrez (casas claras e escuras alternadas)
- **FR-002**: Sistema DEVE posicionar 12 peças pretas nas três primeiras linhas (casas escuras) e 12 peças brancas nas três últimas linhas
- **FR-003**: Sistema DEVE validar movimentos de peças simples: 1 casa diagonal para frente em casas vazias
- **FR-004**: Sistema DEVE validar capturas simples: pulo diagonal sobre peça adversária com casa vazia após ela
- **FR-005**: Sistema DEVE detectar e forçar capturas múltiplas quando disponíveis (mesma peça continua capturando)
- **FR-006**: Sistema DEVE promover peça simples a dama quando alcança última linha do adversário
- **FR-007**: Sistema DEVE permitir damas moverem-se qualquer número de casas em diagonais (frente e trás)
- **FR-008**: Sistema DEVE permitir damas capturarem em diagonais longas, pousando em qualquer casa vazia após peça capturada
- **FR-009**: Sistema DEVE alternar turnos automaticamente após movimento válido completo
- **FR-010**: Sistema DEVE detectar vitória quando adversário não tem peças ou movimentos válidos
- **FR-011**: Sistema DEVE detectar empate por repetição de posição (3x) ou 40 movimentos sem captura/promoção
- **FR-012**: Sistema DEVE destacar visualmente casas de destino válidas ao selecionar peça

#### Modo Multiplayer Local

- **FR-013**: Sistema DEVE permitir iniciar partida local sem autenticação
- **FR-014**: Sistema DEVE indicar claramente qual jogador tem o turno atual
- **FR-015**: Sistema DEVE bloquear movimentos do jogador que não está no turno
- **FR-016**: Sistema DEVE exibir mensagem de vitória/empate ao final da partida com opção "Jogar Novamente"

#### Modo Multiplayer Online

- **FR-017**: Sistema DEVE gerar código único alfanumérico (6 caracteres) para cada sala de jogo
- **FR-018**: Sistema DEVE permitir segundo jogador entrar em sala usando código válido
- **FR-019**: Sistema DEVE sincronizar estado do tabuleiro em tempo real entre ambos os jogadores (latência < 1s)
- **FR-020**: Sistema DEVE salvar estado da partida online a cada movimento no backend
- **FR-021**: Sistema DEVE permitir reconexão e retomada de partida em andamento dentro de 24 horas
- **FR-022**: Sistema DEVE declarar vitória por W.O. se adversário desconectado por mais de 5 minutos
- **FR-023**: Sistema DEVE notificar jogador quando adversário desconecta/reconecta

#### Modo Contra Bot

- **FR-024**: Sistema DEVE oferecer três níveis de dificuldade: Fácil, Médio, Difícil
- **FR-025**: Bot DEVE fazer movimentos válidos de acordo com regras oficiais de damas
- **FR-026**: Bot nível Fácil DEVE calcular movimento em até 1 segundo com estratégia aleatória ponderada (60% preferência para capturas quando disponíveis)
- **FR-027**: Bot nível Médio DEVE calcular movimento em até 2 segundos considerando 3 jogadas à frente (profundidade fixa minimax)
- **FR-028**: Bot nível Difícil DEVE calcular movimento em até 5 segundos usando minimax com poda alpha-beta (profundidade 5+)
- **FR-029**: Bot DEVE sempre executar capturas obrigatórias quando disponíveis

#### Autenticação e Perfil

- **FR-030**: Sistema DEVE permitir criação de conta com email único e senha (mínimo 8 caracteres)
- **FR-031**: Sistema DEVE validar formato de email e unicidade antes de criar conta
- **FR-032**: Sistema DEVE armazenar senhas usando hash seguro (bcrypt ou equivalente)
- **FR-033**: Sistema DEVE manter sessão de usuário autenticado por até 7 dias
- **FR-034**: Sistema DEVE exibir estatísticas do jogador: total de partidas, vitórias, derrotas, taxa de vitória
- **FR-035**: Sistema DEVE exibir histórico das últimas 20 partidas com resultado, adversário, e data
- **FR-036**: Sistema DEVE listar partidas online em andamento com informação de adversário e último movimento
- **FR-037**: Sistema DEVE permitir logout e limpar sessão local
- **FR-041**: Sistema DEVE usar NextAuth.js 4.x para gerenciamento de autenticação e sessões

#### Persistência e Dados

- **FR-038**: Sistema DEVE salvar estado completo de partidas online: posição de peças, turno atual, histórico de movimentos
- **FR-039**: Sistema DEVE registrar resultado de partidas (vitória/derrota/empate) no perfil de jogadores autenticados
- **FR-040**: Sistema DEVE limpar partidas abandonadas (sem atividade por 7 dias) do armazenamento

### Key Entities

- **Player**: Representa jogador (autenticado ou anônimo). Atributos: id único, nome de usuário, email (se autenticado), senha hash, estatísticas (vitórias, derrotas, empates), data de criação
- **Game**: Representa partida. Atributos: id único, tipo (local/online/bot), estado do tabuleiro (posição de cada peça), turno atual, histórico de movimentos, jogador branco, jogador preto, status (em andamento/finalizada), resultado, data de criação, última atualização
- **Piece**: Representa peça no tabuleiro. Atributos: cor (branca/preta), tipo (simples/dama), posição (linha, coluna)
- **Move**: Representa movimento. Atributos: peça movida, posição origem, posição destino, peças capturadas (se houver), timestamp
- **Room**: Representa sala de jogo online. Atributos: código único, id do jogo associado, jogadores conectados, status (aguardando/em andamento/finalizada)
- **Session**: Representa sessão de autenticação. Atributos: id único, userId (relação com Player), token (string aleatória), expires (timestamp de expiração), createdAt (timestamp de criação)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários conseguem completar partida local do início ao fim em menos de 15 minutos (assumindo jogadas em ritmo normal)
- **SC-002**: Sistema valida 100% dos movimentos corretamente (sem permitir movimentos inválidos ou bloquear movimentos válidos)
- **SC-003**: Sistema detecta corretamente todas as condições de vitória e empate em 100% das partidas
- **SC-004**: Partidas online sincronizam movimentos entre jogadores em menos de 500ms em conexões normais (> 1Mbps)
- **SC-005**: Sistema suporta pelo menos 100 partidas online simultâneas sem degradação de performance
- **SC-006**: 95% das partidas online salvas podem ser retomadas com sucesso após desconexão
- **SC-007**: Bot nível Difícil vence 80%+ das partidas contra bot nível Fácil
- **SC-008**: Bot calcula movimentos dentro dos tempos especificados (1s/2s/5s) em 95% dos casos
- **SC-009**: Taxa de conclusão de partidas online é de pelo menos 60% (não abandonadas)
- **SC-010**: 90% dos usuários conseguem criar conta e iniciar primeira partida em menos de 3 minutos
- **SC-011**: Interface responde a interações do usuário (clique em peça, movimento) em menos de 100ms
- **SC-012**: Sistema está disponível 99% do tempo (uptime) para partidas online
