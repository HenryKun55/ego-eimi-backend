import { z } from 'zod'

export const EmbeddingDataSchema = z.object({
  embedding: z.array(z.number()).min(1),
  index: z.number().optional(),
  object: z.string().optional(),
})

export const EmbeddingResponseSchema = z.object({
  data: z.array(EmbeddingDataSchema).min(1),
  model: z.string(),
  object: z.string(),
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
    code: z.string().optional(),
  }),
})

// Tipos inferidos dos schemas
export type EmbeddingData = z.infer<typeof EmbeddingDataSchema>
export type EmbeddingResponse = z.infer<typeof EmbeddingResponseSchema>
export type EmbeddingError = z.infer<typeof EmbeddingErrorSchema>
