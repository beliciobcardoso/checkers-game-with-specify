<!--
SYNC IMPACT REPORT - Constitution v1.0.0
========================================
Version Change: [INITIAL VERSION] → 1.0.0

Modified Principles: N/A (initial creation)

Added Sections:
  - I. Clean Code Principles
  - II. Testing & Quality Assurance
  - III. Documentation Standards
  - IV. Code Maintainability
  - V. Design Patterns & Architecture
  - Development Workflow
  - Code Review Requirements

Removed Sections: N/A

Templates Status:
  ✅ plan-template.md - updated with constitution-based gates and compliance checks
  ✅ spec-template.md - reviewed, already aligned (testing focus maintained)
  ✅ tasks-template.md - updated to make tests MANDATORY, added TDD emphasis, coverage requirements
  ⚠ checklist-template.md - not reviewed yet (will align when first used)
  ⚠ agent-file-template.md - not reviewed yet (will align when first used)

Template Changes Made:
  - plan-template.md: Added comprehensive Constitution Check section with specific gates for:
    * Clean code compliance
    * Testing requirements (80%/60% coverage)
    * Documentation standards
    * Maintainability checks
    * Architecture & patterns validation

  - tasks-template.md:
    * Changed tests from OPTIONAL to MANDATORY
    * Updated test sections to reference constitution compliance
    * Added TDD emphasis (write tests first)
    * Added Boy Scout Rule to refactoring tasks
    * Added ESLint/Prettier compliance check

Follow-up TODOs: None
-->

# Checkers Game Constitution

## Core Principles

### I. Clean Code Principles

**Código DEVE ser legível e autoexplicativo:**

- Nomes de variáveis, funções e classes DEVEM descrever claramente seu propósito
- Funções DEVEM ter responsabilidade única e fazer apenas uma coisa
- Blocos de código DEVEM ser pequenos (funções < 30 linhas, classes < 300 linhas)
- Comentários DEVEM explicar o "porquê", não o "o quê" (código autoexplicativo)
- Código duplicado é PROIBIDO - extrair para funções/módulos reutilizáveis

**Rationale:** Código limpo reduz tempo de manutenção, facilita onboarding de novos
desenvolvedores, minimiza bugs e melhora colaboração. Investimento inicial em
qualidade economiza recursos exponencialmente ao longo do ciclo de vida do projeto.

### II. Testing & Quality Assurance

**Testes DEVEM ser tratados como código de produção:**

- Cobertura mínima de testes: 80% para código crítico, 60% para código geral
- Testes unitários DEVEM ser rápidos (< 100ms cada), isolados e determinísticos
- Testes de integração DEVEM cobrir interações entre módulos principais
- Testes end-to-end DEVEM validar fluxos críticos de usuário
- CI/CD DEVE bloquear merge se testes falharem
- TDD é FORTEMENTE RECOMENDADO: escrever teste → falhar → implementar → passar → refatorar

**Rationale:** Testes automatizados são a rede de segurança que permite refatoração
confiante, detecta regressões precocemente e documenta comportamento esperado.
Investimento em testes reduz custo de bugs em produção em até 10x.

### III. Documentation Standards

**Documentação DEVE ser mantida atualizada e acessível:**

- README DEVE explicar: propósito do projeto, como rodar, arquitetura básica
- Código público (APIs, interfaces) DEVE ter JSDoc/TSDoc completo
- Decisões arquiteturais importantes DEVEM ser documentadas (ADRs quando aplicável)
- Documentação DEVE viver próxima ao código (evitar desatualização)
- Diagramas DEVEM ser gerados automaticamente quando possível (PlantUML, Mermaid)
- Guias de contribuição DEVEM estar disponíveis para novos colaboradores

**Rationale:** Documentação adequada acelera onboarding, reduz dependência de
conhecimento tribal e facilita manutenção futura. Documentação próxima ao código
tem maior probabilidade de permanecer atualizada.

### IV. Code Maintainability

**Código DEVE ser projetado para mudança:**

- Dependências externas DEVEM ser isoladas em camadas (Repository, Service patterns)
- Configurações DEVEM estar centralizadas e versionadas
- Magic numbers e strings DEVEM ser substituídos por constantes nomeadas
- Código legado DEVE ser refatorado progressivamente (Boy Scout Rule)
- Debt técnica DEVE ser rastreada e priorizada regularmente
- Código não utilizado (dead code) DEVE ser removido imediatamente

**Rationale:** Software manutenível tem custo de mudança linear, não exponencial.
Isolamento de dependências facilita testes e migrações. Refatoração contínua
previne erosão arquitetural e acúmulo de débito técnico.

### V. Design Patterns & Architecture

**Arquitetura DEVE seguir princípios SOLID:**

- Single Responsibility: cada módulo/classe um único motivo para mudar
- Open/Closed: aberto para extensão, fechado para modificação
- Liskov Substitution: subtipos devem ser substituíveis por seus tipos base
- Interface Segregation: interfaces específicas melhor que interfaces genéricas
- Dependency Inversion: depender de abstrações, não de implementações concretas

**Padrões de design apropriados DEVEM ser aplicados:**

- Repository pattern para acesso a dados
- Service pattern para lógica de negócio
- Factory pattern para criação complexa de objetos
- Observer/Event pattern para comunicação desacoplada
- Evitar over-engineering: usar padrões apenas quando agregam valor claro

**Rationale:** SOLID e design patterns provados reduzem acoplamento, aumentam coesão
e facilitam evolução do sistema. Aplicação criteriosa evita complexidade desnecessária.

## Development Workflow

**Processo de desenvolvimento DEVE ser sistemático e rastreável:**

- Branch strategy: feature branches a partir de `main`, naming convention `###-feature-name`
- Commits DEVEM ser atômicos e com mensagens descritivas (Conventional Commits recomendado)
- Pull Requests DEVEM:
  - Ter descrição clara do problema e solução
  - Incluir testes relevantes
  - Passar em todos os checks de CI/CD
  - Ser revisados por pelo menos um desenvolvedor
- Deploys DEVEM ser automatizados e reversíveis
- Hotfixes DEVEM seguir processo expedito mas documentado

**Ferramentas obrigatórias:**

- Linter (ESLint) e formatter (Prettier) configurados
- Git hooks (pre-commit) para validações locais
- CI/CD pipeline para testes e build automático

## Code Review Requirements

**Code reviews DEVEM ser construtivos e eficientes:**

- Reviewers DEVEM verificar:
  - Aderência aos princípios desta constituição
  - Cobertura de testes adequada
  - Clareza e legibilidade do código
  - Ausência de vulnerabilidades de segurança óbvias
  - Performance aceitável (sem algoritmos claramente ineficientes)
- Feedback DEVE ser:
  - Específico e acionável
  - Construtivo e respeitoso
  - Focado no código, não na pessoa
- Aprovação DEVE ser bloqueante: código sem aprovação NÃO pode ser mergeado

**Rationale:** Code review é oportunidade de aprendizado mútuo, disseminação de
conhecimento e garantia de qualidade. Processo estruturado previne débito técnico.

## Governance

Esta constituição SUBSTITUI práticas anteriores conflitantes.

**Processo de emendas:**

1. Proposta de mudança DEVE ser documentada com justificativa
2. Mudanças DEVEM ser aprovadas por maioria dos desenvolvedores ativos
3. Plano de migração DEVE ser criado se mudança afetar código existente
4. Versionamento DEVE seguir semver:
   - MAJOR: mudanças incompatíveis em princípios fundamentais
   - MINOR: adição de novos princípios ou seções
   - PATCH: clarificações, correções de redação

**Compliance:**

- Todos os PRs/code reviews DEVEM verificar conformidade com estes princípios
- Violações DEVEM ser justificadas explicitamente (via tabela de complexidade no plan.md)
- Exceções NÃO justificadas DEVEM ser rejeitadas

**Referências de execução:**

- Desenvolvimento runtime: seguir templates em `.specify/templates/`
- Guidance específica de comandos: `.specify/templates/commands/*.md`

**Version**: 1.0.0 | **Ratified**: 2025-11-05 | **Last Amended**: 2025-11-05
