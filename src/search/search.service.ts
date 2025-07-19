import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import { QdrantClient } from '@qdrant/js-client-rest'
import { ConfigService } from '@nestjs/config'
import { LocalStrategyUserOutput } from '../auth/@types/user'
import { EmbeddingService } from '../embedding/embedding.service'
import { DEFAULT_QDRANT_COLLECTION, QDRANT_LIMIT } from './search.constants'

interface ChunkPayload {
  text: string
  documentId: string
  requiredRole: string
  [key: string]: any
}

export interface SearchResultChunk {
  content: string
  metadata: ChunkPayload
  score: number
}

@Injectable()
export class SearchService {
  private readonly qdrantClient: QdrantClient
  private readonly collectionName: string
  private readonly logger = new Logger(SearchService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly embeddingService: EmbeddingService
  ) {
    const url = this.configService.get<string>('QDRANT_URL')
    const apiKey = this.configService.get<string>('QDRANT_API_KEY') || undefined
    const collectionName =
      this.configService.get<string>('QDRANT_COLLECTION') ||
      DEFAULT_QDRANT_COLLECTION

    if (!url) {
      this.logger.error('QDRANT_URL não definida no ambiente')
      throw new InternalServerErrorException('Qdrant URL não configurada')
    }

    this.qdrantClient = new QdrantClient({ url, apiKey })
    this.collectionName = collectionName
  }

  async getEmbedding(query: string): Promise<number[]> {
    return this.embeddingService.generateSingleEmbedding(query)
  }

  async searchChunks(
    query: string,
    user: LocalStrategyUserOutput
  ): Promise<SearchResultChunk[]> {
    const vector = await this.getEmbedding(query)

    if (!user.roles?.length) {
      this.logger.warn(`Usuário ${user.email} não possui roles para ACL`)
      return []
    }

    const result = await this.qdrantClient.search(this.collectionName, {
      vector,
      limit: QDRANT_LIMIT,
      filter: {
        must: [
          {
            key: 'requiredRole',
            match: { any: user.roles },
          },
        ],
      },
    })

    const chunks = result.map(
      (point): SearchResultChunk => ({
        content: (point.payload as ChunkPayload)?.text || '',
        metadata: point.payload as ChunkPayload,
        score: point.score,
      })
    )

    this.logger.log(
      `Busca por "${query}" retornou ${chunks.length} chunks para ${user.email}`
    )

    return chunks
  }
}
