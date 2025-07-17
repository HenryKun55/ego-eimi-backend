import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  EmbeddingResponseSchema,
  EmbeddingErrorSchema,
  type EmbeddingResponse,
  GROQ_API,
  EMBEDDING_MODELS,
  EMBEDDING_LIMITS,
} from './embedding.schema'

export interface EmbeddingOptions {
  model?: string
  batchSize?: number
  maxRetries?: number
  retryDelay?: number
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name)
  private readonly apiKey: string

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('GROQ_API_KEY')
  }

  async generateEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {}
  ): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      throw new HttpException(
        'Lista de textos não pode estar vazia',
        HttpStatus.BAD_REQUEST
      )
    }

    const {
      model = EMBEDDING_MODELS.LLAMA_4,
      batchSize = EMBEDDING_LIMITS.MAX_BATCH_SIZE,
      maxRetries = EMBEDDING_LIMITS.MAX_RETRIES,
      retryDelay = EMBEDDING_LIMITS.RETRY_DELAY,
    } = options

    const batches = this.chunkArray(texts, batchSize)
    const embeddings: number[][] = []

    for (const [i, batch] of batches.entries()) {
      this.logger.debug(`Processando lote ${i + 1}/${batches.length}`)
      const batchEmbeddings = await this.processBatch(
        batch,
        model,
        maxRetries,
        retryDelay
      )
      embeddings.push(...batchEmbeddings)
    }

    return embeddings
  }

  async generateSingleEmbedding(
    text: string,
    options?: EmbeddingOptions
  ): Promise<number[]> {
    const [embedding] = await this.generateEmbeddings([text], options)
    return embedding
  }

  async generateEmbeddingsWithMetadata(
    texts: string[],
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResponse[]> {
    if (!texts || texts.length === 0) {
      throw new HttpException(
        'Lista de textos não pode estar vazia',
        HttpStatus.BAD_REQUEST
      )
    }

    const {
      model = EMBEDDING_MODELS.LLAMA_4,
      batchSize = EMBEDDING_LIMITS.MAX_BATCH_SIZE,
      maxRetries = EMBEDDING_LIMITS.MAX_RETRIES,
      retryDelay = EMBEDDING_LIMITS.RETRY_DELAY,
    } = options

    const batches = this.chunkArray(texts, batchSize)
    const responses: EmbeddingResponse[] = []

    for (const [i, batch] of batches.entries()) {
      this.logger.debug(`Processando lote ${i + 1}/${batches.length}`)
      const batchResponses = await this.processBatchWithMetadata(
        batch,
        model,
        maxRetries,
        retryDelay
      )
      responses.push(...batchResponses)
    }

    return responses
  }

  private async processBatch(
    texts: string[],
    model: string,
    maxRetries: number,
    retryDelay: number
  ): Promise<number[][]> {
    const embeddings: number[][] = []

    for (const text of texts) {
      if (!text.trim()) {
        this.logger.warn('Texto vazio encontrado, pulando...')
        continue
      }

      const embedding = await this.generateSingleEmbeddingWithRetry(
        text,
        model,
        maxRetries,
        retryDelay
      )

      embeddings.push(embedding)
    }

    return embeddings
  }

  private async processBatchWithMetadata(
    texts: string[],
    model: string,
    maxRetries: number,
    retryDelay: number
  ): Promise<EmbeddingResponse[]> {
    const responses: EmbeddingResponse[] = []

    for (const text of texts) {
      if (!text.trim()) {
        this.logger.warn('Texto vazio encontrado, pulando...')
        continue
      }

      const response = await this.generateFullResponseWithRetry(
        text,
        model,
        maxRetries,
        retryDelay
      )

      responses.push(response)
    }

    return responses
  }

  private async generateSingleEmbeddingWithRetry(
    text: string,
    model: string,
    maxRetries: number,
    retryDelay: number
  ): Promise<number[]> {
    const response = await this.generateFullResponseWithRetry(
      text,
      model,
      maxRetries,
      retryDelay
    )

    return response.data[0].embedding
  }

  private async generateFullResponseWithRetry(
    text: string,
    model: string,
    maxRetries: number,
    retryDelay: number
  ): Promise<EmbeddingResponse> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.callGroqApi(text, model)
      } catch (error) {
        lastError = error as Error
        this.logger.warn(
          `Tentativa ${attempt}/${maxRetries} falhou: ${error.message}`
        )
        if (attempt < maxRetries) await this.sleep(retryDelay * attempt)
      }
    }

    throw new HttpException(
      `Falha ao gerar embedding após ${maxRetries} tentativas: ${lastError?.message}`,
      HttpStatus.INTERNAL_SERVER_ERROR
    )
  }

  private async callGroqApi(
    text: string,
    model: string
  ): Promise<EmbeddingResponse> {
    const url = `${GROQ_API.BASE_URL}${GROQ_API.EMBEDDINGS_ENDPOINT}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ input: text, model }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      try {
        const json = JSON.parse(errorText)
        const parsed = EmbeddingErrorSchema.safeParse(json)
        if (parsed.success) errorMessage = parsed.data.error.message
      } catch (error) {
        this.logger.error('Erro no parse:', error)
      }

      throw new HttpException(
        `Erro na API da Groq: ${errorMessage}`,
        this.mapHttpStatusCode(response.status)
      )
    }

    const json = await response.json()
    const parsed = EmbeddingResponseSchema.safeParse(json)

    if (!parsed.success) {
      this.logger.error(
        'Erro ao validar resposta da API:',
        parsed.error.format()
      )
      throw new HttpException(
        'Resposta inválida da API da Groq',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    return parsed.data
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private mapHttpStatusCode(status: number): HttpStatus {
    switch (status) {
      case 400:
        return HttpStatus.BAD_REQUEST
      case 401:
        return HttpStatus.UNAUTHORIZED
      case 403:
        return HttpStatus.FORBIDDEN
      case 404:
        return HttpStatus.NOT_FOUND
      case 429:
        return HttpStatus.TOO_MANY_REQUESTS
      case 500:
        return HttpStatus.INTERNAL_SERVER_ERROR
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR
    }
  }
}
