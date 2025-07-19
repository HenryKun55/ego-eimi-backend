import { randomUUID } from 'crypto'
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import {
  EmbeddingService,
  EmbeddingOptions,
} from '../embedding/embedding.service'
import { QdrantService } from '../qdrant/qdrant.service'

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

    if (!content?.trim()) {
      throw new HttpException(
        'Conteúdo do documento não pode estar vazio',
        HttpStatus.BAD_REQUEST
      )
    }

    if (!documentId?.trim()) {
      throw new HttpException(
        'ID do documento é obrigatório',
        HttpStatus.BAD_REQUEST
      )
    }

    this.logger.log(`Iniciando processamento do documento: ${documentId}`)

    try {
      const chunks = this.splitTextIntoChunks(content, {
        chunkSize: 300,
        chunkOverlap: 60,
        minChunkSize: 80,
        ...chunkingOptions,
      })
      this.logger.log(`Chunking: ${content.slice(0, 80)}...`)
      this.logger.log(`Documento ${documentId} gerou ${chunks.length} chunks`)

      const { batchSize = 50, embeddingOptions, metadata } = indexingOptions
      const indexing = await this.indexChunks(
        chunks,
        documentId,
        batchSize,
        embeddingOptions,
        metadata
      )

      return {
        ...indexing,
        processingTime: Date.now() - startTime,
      }
    } catch (error) {
      this.logger.error(`Erro ao processar documento ${documentId}:`, error)
      throw error
    }
  }

  private splitTextIntoChunks(
    text: string,
    options: ChunkingOptions = {}
  ): DocumentChunk[] {
    const {
      chunkSize = 300,
      chunkOverlap = 60,
      minChunkSize = 80,
      separators = ['\n\n', '\n', '.', '!', '?', ';', ' '],
      preserveFormatting = false,
    } = options

    const cleanText = preserveFormatting
      ? text
      : text.replace(/\s+/g, ' ').trim()

    this.logger.log(
      `🧪 Texto recebido para chunking: (${cleanText.length} chars) → "${cleanText}"`
    )

    if (cleanText.length < minChunkSize) {
      this.logger.warn(`📏 Conteúdo muito curto, criando chunk único`)
      return [
        {
          id: randomUUID(),
          text: cleanText,
          metadata: {},
          startIndex: 0,
          endIndex: cleanText.length,
        },
      ]
    }

    const chunks: DocumentChunk[] = []
    let index = 0

    while (index < cleanText.length) {
      let end = Math.min(index + chunkSize, cleanText.length)
      let chunk = cleanText.slice(index, end)

      if (end < cleanText.length) {
        for (const sep of separators) {
          const sepIndex = chunk.lastIndexOf(sep)
          if (sepIndex > minChunkSize) {
            end = index + sepIndex + sep.length
            chunk = cleanText.slice(index, end)
            break
          }
        }
      }

      if (chunk.length >= minChunkSize) {
        chunks.push({
          id: randomUUID(),
          text: chunk.trim(),
          metadata: {},
          startIndex: index,
          endIndex: end,
        })
      }

      index = Math.max(end - chunkOverlap, index + 1)
    }

    this.logger.log(`🧪 Total de chunks após processamento: ${chunks.length}`)
    chunks.forEach((c, i) => {
      this.logger.log(
        `🔹 Chunk #${i + 1}: (${c.text.length} chars) "${c.text}"`
      )
    })

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

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)

      try {
        const embeddings = await this.embeddingService.generateEmbeddings(
          batch.map((c) => c.text),
          embeddingOptions
        )

        const points = embeddings.map((vector, j) => {
          const text = batch[j].text
          return {
            id: batch[j].id,
            vector,
            payload: {
              text,
              documentId,
              chunkIndex: i + j,
              startIndex: batch[j].startIndex,
              endIndex: batch[j].endIndex,
              length: text.length,
              wordCount: text.split(/\s+/).length,
              ...baseMetadata,
              ...batch[j].metadata,
            },
          }
        })

        this.logger.log(`Payload do chunk: ${points[0].payload.text}`)

        await this.qdrantService.upsertPoints(points)
        indexedChunks += points.length
      } catch (error) {
        this.logger.error(`Erro ao indexar lote ${i / batchSize + 1}`, error)
        failedChunks += batch.length
      }
    }

    return {
      totalChunks: chunks.length,
      indexedChunks,
      failedChunks,
    }
  }

  async searchSimilarChunks(
    query: string,
    limit = 5,
    scoreThreshold = 0.7,
    filter?: Record<string, any>
  ) {
    if (!query?.trim()) {
      throw new HttpException(
        'Query não pode estar vazia',
        HttpStatus.BAD_REQUEST
      )
    }

    const queryEmbedding =
      await this.embeddingService.generateSingleEmbedding(query)

    const results = filter
      ? await this.qdrantService.searchWithFilter(
          queryEmbedding,
          filter,
          limit,
          scoreThreshold
        )
      : await this.qdrantService.search(queryEmbedding, limit, scoreThreshold)

    return results.map((r) => ({
      id: r.id,
      text: r.payload?.text || '',
      metadata: r.payload || {},
      score: r.score,
    }))
  }

  async removeDocumentChunks(documentId: string): Promise<number> {
    if (!documentId?.trim()) {
      throw new HttpException(
        'ID do documento é obrigatório',
        HttpStatus.BAD_REQUEST
      )
    }

    const dummyVector: number[] = new Array(1536).fill(0)

    const results = await this.qdrantService.searchWithFilter(
      dummyVector,
      { must: [{ key: 'documentId', match: { value: documentId } }] },
      1000,
      0
    )

    const chunkIds = results.map((r) => r.id)
    if (chunkIds.length === 0) {
      return 0
    }
    await this.qdrantService.deletePoints(chunkIds)
    return chunkIds.length
  }
}
