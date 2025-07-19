import { Injectable, Logger } from '@nestjs/common'
import { LocalStrategyUserOutput } from '../auth/@types/user'
import { EmbeddingService } from '../embedding/embedding.service'
import { QdrantService } from '../qdrant/qdrant.service'
import { QDRANT_LIMIT } from './search.constants'

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
  private readonly logger = new Logger(SearchService.name)

  constructor(
    private readonly qdrantService: QdrantService,
    private readonly embeddingService: EmbeddingService
  ) {}

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

    const client = this.qdrantService.getClient()
    const collectionName = this.qdrantService.getCollectionName()

    const hierarchy = ['viewer', 'employee', 'admin']
    const expandedRoles = user.roles.flatMap((role) => {
      const index = hierarchy.indexOf(role)
      return index >= 0 ? hierarchy.slice(0, index + 1) : []
    })

    this.logger.log(
      `📚 ACL expandido para ${user.email}: [${expandedRoles.join(', ')}]`
    )

    const result = await client.search(collectionName, {
      vector,
      limit: QDRANT_LIMIT,
      filter: {
        must: [
          {
            key: 'requiredRole',
            match: { any: expandedRoles },
          },
        ],
      },
      with_payload: true,
      with_vector: false,
    })

    const rawChunks: SearchResultChunk[] = result.map((point) => ({
      content: (point.payload as ChunkPayload)?.text || '',
      metadata: point.payload as ChunkPayload,
      score: point.score,
    }))

    const uniqueChunks = rawChunks.filter(
      (chunk, index, self) =>
        index === self.findIndex((c) => c.content === chunk.content)
    )

    this.logger.log(
      `Busca por "${query}" retornou ${uniqueChunks.length} chunks únicos para ${user.email}`
    )

    return uniqueChunks
  }
}
