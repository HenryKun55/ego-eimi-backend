# 🧠 Ego Eimi – TeamBrain Challenge

> Enterprise knowledge engine that answers employee questions from internal documents using RAG and role-based access control.

---

## 📌 Overview

TeamBrain é um mecanismo de conhecimento interno que responde perguntas dos colaboradores com base em documentos previamente ingeridos e vetorizados. O sistema usa ACL-aware RAG para garantir que apenas informações permitidas sejam retornadas ao usuário.

---

## ⚙️ Tech Stack & Rationale

| Tecnologia         | Motivo de escolha                           |
| ------------------ | ------------------------------------------- |
| **NestJS**         | Estrutura modular e escalável para backend  |
| **TypeScript**     | Segurança de tipos e leitura clara          |
| **Qdrant**         | Vetor DB com filtros por payload (ACL)      |
| **Groq (LLM)**     | Respostas rápidas com modelos como `llama3` |
| **JWT Auth**       | Autenticação simples e eficaz               |
| **Docker Compose** | Setup local fácil com Qdrant e app backend  |

---

## 🧠 Arquitetura

```
┌─────────────┐
│ Auth Module │────────────┐
└────┬────────┘            ▼
     │               ┌──────────────┐
     ▼               │ DocumentSvc  │
User Login           └────┬─────────┘
                          ▼
                     Chunk + Embed
                          │
                          ▼
┌────────────┐      ┌───────────────┐      ┌─────────────┐
│ AskController│───▶│ SearchService │────▶│ Qdrant DB   │
└────────────┘      └───────────────┘      └─────────────┘
     │
     ▼
LLMService (Groq API)
     │
     ▼
   Resposta
```

---

## 🚀 Setup local

### 1. Pré-requisitos

- Node 18+
- Docker
- pnpm (ou bun)

### 2. Subir ambiente

```bash
docker-compose up -d
pnpm install
pnpm start:dev
```

### 3. Autenticar

Use a rota `POST /auth/login` com o usuário seedado.

---

## 🧪 Testes e Instrumentação

- Estrutura de testes com Jest pronta
- Foco nos serviços: `embedding.service`, `search.service`
- Planejado: logging via middleware (usuário, rota e duração)

---

## 🔒 Segurança & Privacidade

- JWT com roles por usuário
- ACL via `requiredRole` nos chunks
- `.env.example` incluso (sem segredos no repo)
- Futuros:
  - Rate limiting
  - SSO (fora do escopo MVP)

---

## 🤖 AI / Copilot Usage

- Uso do ChatGPT e Copilot para gerar:
  - `llm.service.ts` com integração Groq
  - Boilerplate de modules e guards
  - Refatoração do ciclo de embedding e chunking

---

## ⚖️ Trade-offs

- ❌ Não possui múltiplas fontes ainda (somente upload direto)
- ❌ Audit logging simplificado (pendente)
- ✅ Escolhido priorizar o fluxo completo de RAG e ACL
- ✅ Foco em retorno preciso e rápido ao usuário

---

## 📈 Performance (observações)

- Embeddings Groq: ~200ms
- Busca vetorial Qdrant: ~20-40ms
- LLM (Groq): ~600-900ms
- Resposta completa: ~1.1s

---

## 🛣️ Futuro Roadmap

1. 🧾 Multi-source ingestion (Google Drive, Notion, etc)
2. 🔍 Interface para gerenciamento dos documentos
3. 📊 Dashboard com métricas de uso por usuário e tempo
4. ✅ Autolog/Audit por requisição

---

## ⏱️ Time log

| Área         | Tempo estimado |
| ------------ | -------------- |
| Infra        | 2h             |
| Backend core | 6h             |
| Embeddings   | 2h             |
| Auth/ACL     | 1.5h           |
| RAG/LLM      | 2h             |
| Docs + video | 1.5h           |
| **Total**    | **~13h**       |

---

## ✉️ Submissão

- Vídeo de demonstração: (link Loom/Youtube)
- Repositório: (link do GitHub)
