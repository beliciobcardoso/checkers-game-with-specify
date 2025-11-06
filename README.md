# Checkers Game - Jogo de Damas Multiplayer

Jogo de damas completo com partida local, multiplayer online em tempo real, e bot com IA. Desenvolvido com Next.js 15, TypeScript, Prisma, Socket.io e Tailwind CSS.

## 🎮 Funcionalidades

- ✅ **Partida Local**: Dois jogadores no mesmo dispositivo
- 🌐 **Multiplayer Online**: Jogue com amigos via internet em tempo real
- 🤖 **Bot com IA**: Três níveis de dificuldade (Fácil, Médio, Difícil)
- 👤 **Perfil e Estatísticas**: Acompanhe seu histórico de partidas
- 📱 **Responsivo**: Interface adaptada para desktop e mobile

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18.17+ ou 20.x LTS
- PostgreSQL 15+
- npm ou pnpm

### Instalação

1. Clone o repositório
```bash
git clone <repository-url>
cd checkers-game-with-specify
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite .env e configure DATABASE_URL e NEXTAUTH_SECRET
```

4. Configure o banco de dados
```bash
npx prisma migrate dev
npm run db:seed  # Opcional: dados de exemplo
```

5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

Para mais detalhes, consulte [specs/001-checkers-game/quickstart.md](specs/001-checkers-game/quickstart.md)

## 🏗️ Arquitetura

### Stack Tecnológico

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Real-time**: Socket.io para multiplayer
- **Autenticação**: NextAuth.js
- **Testes**: Jest, React Testing Library, Playwright

### Estrutura do Projeto

```
src/
├── app/              # Next.js App Router (páginas e rotas API)
├── components/       # Componentes React
├── lib/              # Lógica de negócio e utilidades
├── services/         # Camada de serviços
├── hooks/            # Custom React Hooks
└── types/            # Definições TypeScript

tests/
├── unit/             # Testes unitários (Jest)
├── integration/      # Testes de integração
└── e2e/              # Testes end-to-end (Playwright)

prisma/
└── schema.prisma     # Schema do banco de dados
```

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes com cobertura
npm run test:coverage

# Testes E2E
npm run test:e2e

# Todos os testes
npm run test:all
```

## 📚 Documentação

- [Especificação Completa](specs/001-checkers-game/spec.md)
- [Plano de Implementação](specs/001-checkers-game/plan.md)
- [Modelo de Dados](specs/001-checkers-game/data-model.md)
- [API REST](specs/001-checkers-game/contracts/rest-api.yaml)
- [WebSocket Events](specs/001-checkers-game/contracts/websocket.md)
- [Guia de Setup](specs/001-checkers-game/quickstart.md)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma feature branch (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'feat: add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

Consulte [.specify/memory/constitution.md](.specify/memory/constitution.md) para princípios de desenvolvimento.

## 📝 Licença

Este projeto está sob a licença MIT.
