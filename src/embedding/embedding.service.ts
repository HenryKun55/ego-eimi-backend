import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  EmbeddingResponseSchema,
  EmbeddingErrorSchema,
  type EmbeddingResponse,
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
  private readonly groqUrl = 'https://api.groq.com/openai/v1/embeddings'
  private readonly apiKey: string
  private readonly defaultModel = 'nomic-embed-text-v1'
  private readonly defaultBatchSize = 100
  private readonly defaultMaxRetries = 3
  private readonly defaultRetryDelay = 1000

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
      model = this.defaultModel,
      batchSize = this.defaultBatchSize,
      maxRetries = this.defaultMaxRetries,
      retryDelay = this.defaultRetryDelay,
    } = options

    this.logger.log(`Gerando embeddings para ${texts.length} textos`)

    const embeddings: number[][] = []

    const batches = this.chunkArray(texts, batchSize)

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      this.logger.debug(`Processando lote ${i + 1}/${batches.length}`)

      const batchEmbeddings = await this.processBatch(
        batch,
        model,
        maxRetries,
        retryDelay
      )

      embeddings.push(...batchEmbeddings)
    }

    this.logger.log(`Embeddings gerados com sucesso: ${embeddings.length}`)
    return embeddings
  }

  async generateSingleEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text], options)
    return embeddings[0]
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
      model = this.defaultModel,
      batchSize = this.defaultBatchSize,
      maxRetries = this.defaultMaxRetries,
      retryDelay = this.defaultRetryDelay,
    } = options

    this.logger.log(
      `Gerando embeddings com metadata para ${texts.length} textos`
    )

    const responses: EmbeddingResponse[] = []
    const batches = this.chunkArray(texts, batchSize)

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      this.logger.debug(`Processando lote ${i + 1}/${batches.length}`)

      const batchResponses = await this.processBatchWithMetadata(
        batch,
        model,
        maxRetries,
        retryDelay
      )

      responses.push(...batchResponses)
    }

    this.logger.log(`Embeddings com metadata gerados: ${responses.length}`)
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
      if (!text || text.trim().length === 0) {
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
      if (!text || text.trim().length === 0) {
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

        if (attempt < maxRetries) {
          await this.sleep(retryDelay * attempt)
        }
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
    try {
      const response = await fetch(this.groqUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        try {
          const errorJson = JSON.parse(errorText)
          const errorParsed = EmbeddingErrorSchema.safeParse(errorJson)

          if (errorParsed.success) {
            errorMessage = errorParsed.data.error.message
          }
        } catch (error) {
          this.logger.error('Error on parse: ', error)
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

      const embedding = parsed.data.data[0]?.embedding
      if (!embedding) {
        throw new HttpException(
          'Nenhum embedding retornado pela API',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      }

      return parsed.data
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }

      this.logger.error('Erro inesperado ao chamar API da Groq:', error)
      throw new HttpException(
        'Erro interno ao gerar embedding',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
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
