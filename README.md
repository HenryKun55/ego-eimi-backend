# 🧠 Ego Eimi RAG Backend

Este é o backend de um sistema RAG (Retrieval-Augmented Generation), que permite fazer perguntas sobre documentos privados de forma segura, contextualizada e rápida. O projeto é parte do desafio técnico da Ego Eimi e foi cuidadosamente desenvolvido como um MVP funcional, com atenção à arquitetura, testes e extensibilidade.

---

## ⚙️ Tecnologias principais

- **NestJS** com arquitetura modular
- **Qdrant** para armazenamento vetorial
- **Groq Cloud (nomic-embed + LLM)** para embeddings e completions
- **TypeORM + PostgreSQL** para persistência
- **JWT Auth + RBAC** para segurança baseada em papéis
- **Zod** para validação robusta
- **Swagger** em `/api` para documentação automática
- **Bun** como runtime e gerenciador de pacotes

---

## 🧠 Fluxo RAG com ACL

```text
┌──────────────┐
│  Usuário JWT │
└──────┬───────┘
       │ pergunta
       ▼
┌────────────────────────┐
│ Busca vetorial (Qdrant)│ ← filtro por role (ACL)
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ LLM (Groq) responde    │ ← contexto + prompt
└────────────────────────┘
```

---

## ▶️ Como rodar

### Configure as variáveis de ambiente

Copie os arquivos de exemplo:

```bash
cp .env.example .env
```

Edite os arquivos `.env` com suas configurações locais (ou mantenha os valores padrão para rodar com Docker local).

---

## 🐳 Como rodar via Docker (recomendado)

Use o `docker-compose` da raiz do projeto:

```bash
docker compose up -d
```

---

### Manualmente (sem docker)

Configure o banco e Qdrant localmente, e use o `.env` correspondente (veja abaixo).

---

## ⚙️ Variáveis de Ambiente

### `.env`

```env
JWT_SECRET=...
OPEN_API_KEY=...
QDRANT_URL=...
QDRANT_API_KEY=...
QDRANT_COLLECTION=document_chunks
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_DATABASE=test
USE_EMBEDDING_MOCK=true
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
CLEAR_QDRANT_ON_BOOT=true
```

## Em seguida:

```bash
cd ego-eimi-backend
bun install
bun run prepare:full-clean
bun run dev
```

---

## 🧪 Testes

### Unitários

```bash
bun run test
```

### End-to-End (e2e)

```bash
bun run test:e2e
```

> ✅ Os testes e2e isolam o app e fazem seed local antes de cada suite. Use `--runInBand` se necessário.

---

# 📂 Estrutura do Projeto

Esta é a arquitetura de pastas do projeto, desenhada para ser modular, escalável e de fácil manutenção, seguindo as melhores práticas do NestJS.

```text
src/
├── 🔐 auth/            ← Autenticação JWT, guards e-strategies
├── 👥 users/            ← Gestão de usuários e permissões
├── 📄 documents/        ← CRUD de documentos, ACL e busca
├── 🧩 documents-chunk/  ← Chunking de documentos para RAG
├── 🤖 ask/              ← Endpoint RAG conversacional
├── 🔍 search/           ← Busca semântica avançada
├── 🧠 embedding/        ← Geração de embeddings (Groq)
├── 🦾 llm/              ← Integração com modelos de linguagem
├── 📊 qdrant/           ← Cliente para vector database (Qdrant)
├── 🗄️ database/         ← Configuração TypeORM e migrations
├── 🛠️ scripts/          ← Utilitários de banco e deploy
├── 🌱 seed/             ← População de dados para teste
├── 🔗 common/           ← Middlewares e utilitários globais
├── 📋 @types/           ← Definições TypeScript globais
├── 📱 app.module.ts     ← Módulo raiz da aplicação
└── 🚀 main.ts            ← Bootstrap do servidor NestJS
```

---

## 🤖 Uso de IA (transparência)

- Criação de testes baseados em cada módulo com prompt:

  > “Gere testes unitários baseados nos modules, services e controllers do Nest.”

- Geração de schemas Zod com ChatGPT + revisão manual.
- Geração de estrutura básica dos services e mocks.

---

## 🧠 Decisões & Trade-offs

- Mock de embedding ativado por `.env` para testes locais (sem API Key)
- `CLEAR_QDRANT_ON_BOOT=true` permite testes limpos com docker up/down
- Substituição de deploy real por ambiente local confiável

---

## 📈 Performance

- Busca vetorial ACL-aware com filtro dinâmico
- Indexação com controle de batch e retries
- Resposta mockada: ~600ms | real: depende do modelo

---

## 🧩 Integrações

- `POST /ask`: recebe pergunta e contexto opcional
- `POST /documents`: cria documentos com role mínima
- `GET /documents`: ACL-aware
- `POST /seed`: gera dados de teste (usuários, docs, etc)

---

> Feito com engenharia pragmática, cobertura de testes e uma coquinha gelada.
