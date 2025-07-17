import { Injectable } from '@nestjs/common'
import { QdrantClient } from '@qdrant/js-client-rest'
import { ConfigService } from '@nestjs/config'
import { LocalStrategyUserOutput } from 'src/auth/@types/user'
import { EMBEDDING_MODELS, OPEN_API } from 'src/embedding/embedding.schema'
import { EmbeddingService } from 'src/embedding/embedding.service'

type User = {
  id: string
  role: string
}

@Injectable()
export class SearchService {
  private readonly qdrantClient: QdrantClient
  private readonly collectionName: string

  constructor(
    private readonly configService: ConfigService,
    private readonly embeddingService: EmbeddingService
  ) {
    this.qdrantClient = new QdrantClient({
      url: configService.get<string>('QDRANT_URL'),
      apiKey: configService.get<string>('QDRANT_API_KEY') || undefined,
    })
    this.collectionName =
      configService.get<string>('QDRANT_COLLECTION') || 'document_chunks'
  }

  async getEmbedding(query: string): Promise<number[]> {
    return this.embeddingService.generateSingleEmbedding(query)
  }

  // async getEmbedding(text: string): Promise<number[]> {
  //   const url = `${OPEN_API.BASE_URL}${OPEN_API.EMBEDDINGS_ENDPOINT}`
  //   const res = await fetch(url, {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Bearer ${this.configService.get<string>('OPEN_API_KEY')}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       input: text,
  //       model: EMBEDDING_MODELS.TEXT_EMBEDDING_3_SMALL,
  //     }),
  //   })
  //
  //   const data = await res.json()
  //   return data.data?.[0]?.embedding ?? []
  // }

  async searchChunks(query: string, user: LocalStrategyUserOutput) {
    const vector = await this.getEmbedding(query)

    const result = await this.qdrantClient.search(this.collectionName, {
      vector,
      limit: 10,
      filter: {
        must: [
          {
            key: 'requiredRole',
            match: { any: user.roles },
          },
        ],
      },
    })

    return result.map((point) => ({
      content: (point.payload as any)?.text || '',
      metadata: point.payload,
      score: point.score,
    }))
  }
}
