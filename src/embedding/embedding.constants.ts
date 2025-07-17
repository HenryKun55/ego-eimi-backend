export const EMBEDDING_MODELS = {
  NOMIC_EMBED_TEXT_V1: 'nomic-embed-text-v1',
} as const

export const EMBEDDING_LIMITS = {
  MAX_TEXT_LENGTH: 8192,
  MAX_BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const

export const GROQ_API = {
  BASE_URL: 'https://api.groq.com/openai/v1',
  EMBEDDINGS_ENDPOINT: '/embeddings',
} as const

export type EmbeddingModel = keyof typeof EMBEDDING_MODELS
