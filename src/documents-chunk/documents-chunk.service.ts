import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import {
  EmbeddingService,
  EmbeddingOptions,
} from 'src/embedding/embedding.service'
import { QdrantService } from 'src/qdrant/qdrant.service'

export interface ChunkingOptions {
  chunkSize?: number
  chunkOverlap?: number
  minChunkSize?: number
  separators?: string[]
  preserveFormatting?: boolean
}

export interface IndexingOptions {
  embeddingOptions?: EmbeddingOptions
  metadata?: Record<string, any>
  batchSize?: number
}

export interface DocumentChunk {
  id: string
  text: string
  metadata: Record<string, any>
  startIndex: number
  endIndex: number
}

export interface IndexingResult {
  totalChunks: number
  indexedChunks: number
  failedChunks: number
  processingTime: number
}

@Injectable()
export class DocumentsChunkService {
  private readonly logger = new Logger(DocumentsChunkService.name)
  private readonly defaultChunkSize = 500
  private readonly defaultChunkOverlap = 50
  private readonly defaultMinChunkSize = 100
  private readonly defaultSeparators = ['\n\n', '\n', '.', '!', '?', ';', ' ']
  private readonly defaultBatchSize = 50

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly qdrantService: QdrantService
  ) {}

  async chunkAndIndex(
    content: string,
    documentId: string,
    chunkingOptions: ChunkingOptions = {},
    indexingOptions: IndexingOptions = {}
  ): Promise<IndexingResult> {
    const startTime = Date.now()

    if (!content || content.trim().length === 0) {
      throw new HttpException(
        'Conteúdo do documento não pode estar vazio',
        HttpStatus.BAD_REQUEST
      )
    }

    if (!documentId || documentId.trim().length === 0) {
      throw new HttpException(
        'ID do documento é obrigatório',
        HttpStatus.BAD_REQUEST
      )
    }

    this.logger.log(`Iniciando processamento do documento: ${documentId}`)

    try {
      // 1. Dividir o texto em chunks
      const chunks = this.splitTextIntoChunks(content, chunkingOptions)
      this.logger.debug(`Documento dividido em ${chunks.length} chunks`)

      // 2. Gerar embeddings em lotes
      const { batchSize = this.defaultBatchSize, embeddingOptions } =
        indexingOptions
      const indexingResult = await this.indexChunks(
        chunks,
        documentId,
        batchSize,
        embeddingOptions,
        indexingOptions.metadata
      )

      const processingTime = Date.now() - startTime
      this.logger.log(
        `Documento ${documentId} processado em ${processingTime}ms - ` +
          `${indexingResult.indexedChunks}/${indexingResult.totalChunks} chunks indexados`
      )

      return {
        ...indexingResult,
        processingTime,
      }
    } catch (error) {
      this.logger.error(`Erro ao processar documento ${documentId}:`, error)
      throw error
    }
  }

  async searchSimilarChunks(
    query: string,
    limit = 5,
    scoreThreshold = 0.7,
    filter?: Record<string, any>
  ) {
    if (!query || query.trim().length === 0) {
      throw new HttpException(
        'Query não pode estar vazia',
        HttpStatus.BAD_REQUEST
      )
    }

    this.logger.debug(
      `Buscando chunks similares para: "${query.substring(0, 50)}..."`
    )

    try {
      // Gerar embedding da query
      const queryEmbedding =
        await this.embeddingService.generateSingleEmbedding(query)

      // Buscar no Qdrant
      const searchResults = filter
        ? await this.qdrantService.searchWithFilter(
            queryEmbedding,
            filter,
            limit,
            scoreThreshold
          )
        : await this.qdrantService.search(queryEmbedding, limit, scoreThreshold)

      this.logger.debug(`Encontrados ${searchResults.length} chunks similares`)

      return searchResults.map((result) => ({
        id: result.id,
        text: result.payload?.text || '',
        metadata: result.payload || {},
        score: result.score,
      }))
    } catch (error) {
      this.logger.error('Erro ao buscar chunks similares:', error)
      throw error
    }
  }

  async removeDocumentChunks(documentId: string): Promise<number> {
    if (!documentId || documentId.trim().length === 0) {
      throw new HttpException(
        'ID do documento é obrigatório',
        HttpStatus.BAD_REQUEST
      )
    }

    this.logger.log(`Removendo chunks do documento: ${documentId}`)

    try {
      // Buscar todos os chunks do documento
      const chunks = await this.qdrantService.searchWithFilter(
        new Array(1536).fill(0), // Vector dummy para busca
        { must: [{ key: 'documentId', match: { value: documentId } }] },
        1000, // Limite alto para pegar todos
        0 // Threshold baixo para pegar todos
      )

      if (chunks.length === 0) {
        this.logger.warn(
          `Nenhum chunk encontrado para o documento: ${documentId}`
        )
        return 0
      }

      // Remover chunks
      const chunkIds = chunks.map((chunk) => chunk.id)
      await this.qdrantService.deletePoints(chunkIds)

      this.logger.log(
        `Removidos ${chunkIds.length} chunks do documento: ${documentId}`
      )
      return chunkIds.length
    } catch (error) {
      this.logger.error(
        `Erro ao remover chunks do documento ${documentId}:`,
        error
      )
      throw error
    }
  }

  private splitTextIntoChunks(
    text: string,
    options: ChunkingOptions = {}
  ): DocumentChunk[] {
    const {
      chunkSize = this.defaultChunkSize,
      chunkOverlap = this.defaultChunkOverlap,
      minChunkSize = this.defaultMinChunkSize,
      separators = this.defaultSeparators,
      preserveFormatting = false,
    } = options

    if (!preserveFormatting) {
      text = text.replace(/\s+/g, ' ').trim()
    }

    const chunks: DocumentChunk[] = []
    let currentIndex = 0

    while (currentIndex < text.length) {
      const endIndex = Math.min(currentIndex + chunkSize, text.length)
      let chunkText = text.substring(currentIndex, endIndex)

      // Tentar quebrar em separadores naturais
      if (endIndex < text.length) {
        let bestBreakPoint = chunkText.length

        for (const separator of separators) {
          const lastSeparatorIndex = chunkText.lastIndexOf(separator)
          if (lastSeparatorIndex > minChunkSize) {
            bestBreakPoint = lastSeparatorIndex + separator.length
            break
          }
        }

        chunkText = chunkText.substring(0, bestBreakPoint).trim()
      }

      // Validar tamanho mínimo
      if (chunkText.length >= minChunkSize) {
        chunks.push({
          id: `chunk-${Date.now()}-${chunks.length}`,
          text: chunkText,
          metadata: {},
          startIndex: currentIndex,
          endIndex: currentIndex + chunkText.length,
        })
      }

      // Avançar com overlap
      currentIndex += chunkText.length
      if (currentIndex < text.length) {
        currentIndex = Math.max(currentIndex - chunkOverlap, currentIndex)
      }
    }

    return chunks
  }

  private async indexChunks(
    chunks: DocumentChunk[],
    documentId: string,
    batchSize: number,
    embeddingOptions?: EmbeddingOptions,
    baseMetadata?: Record<string, any>
  ): Promise<Omit<IndexingResult, 'processingTime'>> {
    let indexedChunks = 0
    let failedChunks = 0

    // Processar em lotes
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)

      try {
        const texts = batch.map((chunk) => chunk.text)
        const embeddings = await this.embeddingService.generateEmbeddings(
          texts,
          embeddingOptions
        )

        const points = embeddings.map((vector, index) => {
          const chunk = batch[index]
          return {
            id: chunk.id,
            vector,
            payload: {
              text: chunk.text,
              documentId,
              chunkIndex: i + index,
              startIndex: chunk.startIndex,
              endIndex: chunk.endIndex,
              ...baseMetadata,
              ...chunk.metadata,
            },
          }
        })

        await this.qdrantService.upsertPoints(points)
        indexedChunks += points.length

        this.logger.debug(
          `Lote ${Math.floor(i / batchSize) + 1} processado: ${points.length} chunks indexados`
        )
      } catch (error) {
        this.logger.error(
          `Erro ao processar lote ${Math.floor(i / batchSize) + 1}:`,
          error
        )
        failedChunks += batch.length
      }
    }

    return {
      totalChunks: chunks.length,
      indexedChunks,
      failedChunks,
    }
  }
}
