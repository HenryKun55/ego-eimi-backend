import { z } from 'zod'

export const EmbeddingDataSchema = z.object({
  embedding: z.array(z.number()).min(1),
  index: z.number().optional(),
  object: z.string().optional(),
})

export const EmbeddingResponseSchema = z.object({
  object: z.string().optional(),
  data: z.array(EmbeddingDataSchema).min(1),
  model: z.string().optional(),
  usage: z
    .object({
      prompt_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
})

export const EmbeddingErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string(),
    code: z.union([z.string(), z.null()]).optional(),
    param: z.string().optional(),
  }),
})

export type EmbeddingData = z.infer<typeof EmbeddingDataSchema>
export type EmbeddingResponse = z.infer<typeof EmbeddingResponseSchema>
export type EmbeddingError = z.infer<typeof EmbeddingErrorSchema>

export const EMBEDDING_MODELS = {
  TEXT_EMBEDDING_GROQ: 'nomic-embed-text-v1',
} as const

export const EMBEDDING_LIMITS = {
  MAX_TEXT_LENGTH: 8192,
  MAX_BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const

export const EMBEDDING_API = {
  BASE_URL: 'https://api.groq.com/openai/v1',
  EMBEDDINGS_ENDPOINT: '/embeddings',
} as const
