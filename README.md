# 🧠 Ego Eimi RAG Backend

Este é o backend de um sistema RAG (Retrieval-Augmented Generation), que permite fazer perguntas sobre documentos privados de forma segura, contextualizada e rápida. O projeto é parte de um desafio técnico da Ego Eimi e foi cuidadosamente desenvolvido como um MVP funcional, com atenção especial à arquitetura, boas práticas e extensibilidade.

---

## ⚙️ Tecnologias principais

- **NestJS** com arquitetura modular
- **Qdrant** para armazenamento vetorial
- **Groq Cloud (nomic-embed + LLM)** para embeddings e completions
- **TypeORM + PostgreSQL** para persistência de documentos e usuários
- **JWT Auth + RBAC (roles)** para segurança e controle de acesso
- **Zod** para validação de resposta da API
- **Swagger** para documentação automática

---

## 🧠 Como funciona (fluxo RAG com ACL)

```
┌──────────────┐
│ Usuário JWT  │
└──────┬───────┘
       │ pergunta
       ▼
┌──────────────┐
│ Busca vetorial (Qdrant)
│ com embeddings filtrados por ACL
└──────┬───────┘
       │ chunks relevantes
       ▼
┌──────────────┐
│ LLM (Groq/OpenAI)
│ responde com base no contexto
└──────┬───────┘
       │ resposta
       ▼
┌──────────────┐
│ Retorno final para usuário
└──────────────┘
```

---

## 🚀 Como rodar localmente

```bash
# 1. Clone o projeto
git clone https://github.com/seuusuario/ego-eimi-backend.git
cd ego-eimi-backend

# 2. Instale as dependências
npm install

# 3. Copie as variáveis de ambiente
cp .env.example .env
```

### 🔐 Variáveis de ambiente

```env
OPEN_API_KEY=sk-...
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
JWT_SECRET=supertoken
DATABASE_URL=postgres://user:pass@localhost:5432/db
```

### 🔄 Rodar com docker-compose (Qdrant + PostgreSQL)

```bash
docker-compose up -d
```

### 🧪 Rodar localmente

```bash
npm run start:dev
```

---

## 📌 Principais endpoints

### 🧾 Documentos

```
POST    /documents          # cria documento com chunks e embeddings
GET     /documents          # lista documentos permitidos (RBAC)
GET     /documents/search   # busca semântica ACL-aware
GET     /documents/:id      # detalhe
GET     /documents/:id/stats
PATCH   /documents/:id
DELETE  /documents/:id
```

### 💬 LLM + RAG

```
POST    /ask
```

Payload:

```json
{ "question": "Qual é a política de segurança da empresa?" }
```

Retorno:

```json
{ "data": { "answer": "A política é..." } }
```

### 🔐 Auth e usuários

```
POST    /auth/login         # retorna JWT
POST    /users              # cria novo usuário
```

---

## 🧪 Testes

Os testes serão implementados no sábado, incluindo:

- [ ] Unitários para services (`documents`, `llm`, `embedding`)
- [ ] E2E com supertest para `/ask` e `/documents/search`
- [ ] Mock para Groq e Qdrant

---

## 📁 Estrutura de pastas

```
src/
├── auth/              # login com JWT
├── users/             # criação e busca de usuários
├── documents/         # serviço principal de documentos
├── documents-chunk/   # indexação e split dos chunks
├── embedding/         # integração com Groq Embed
├── qdrant/            # armazenamento vetorial
├── llm/               # geração de resposta final (Groq chat)
├── ask/               # orquestrador do ciclo RAG
├── search/            # endpoint de debug de embeddings
└── main.ts
```

---

## 🧠 Trade-offs e decisões

| Decisão                                  | Justificativa                  |
| ---------------------------------------- | ------------------------------ |
| ✅ RAG com Groq e Qdrant                 | Alta performance + baixo custo |
| ✅ ACL via campo `requiredRole` no chunk | Flexível e simples             |
| ✅ Indexação por chunk e metadata        | Rápido, filtrável              |
| ✅ Zod para validar resposta da LLM      | Evita falhas em produção       |
| ✅ Design modular em services isolados   | Fácil de escalar               |

---

## ⏱ Log de desenvolvimento

- ✅ Estrutura inicial criada com NestJS
- ✅ Integração com Qdrant e Groq concluída
- ✅ Upload + indexação de documentos em chunk
- ✅ MVP do endpoint `/ask` funcional
- ✅ ACL por role de usuário
- ✅ Swagger disponível em `/api`

---

## 👤 Autor

Desenvolvido por [Flávio Henrique](https://github.com/seuusuario) como desafio técnico da Ego Eimi.

---

## 📬 Licença

MIT
