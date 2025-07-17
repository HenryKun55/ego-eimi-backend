import { Injectable } from '@nestjs/common'
import { QdrantClient } from '@qdrant/js-client-rest'
import { ConfigService } from '@nestjs/config'
import { LocalStrategyUserOutput } from 'src/auth/@types/user'

type User = {
  id: string
  role: string
}

@Injectable()
export class SearchService {
  private readonly qdrantClient: QdrantClient
  private readonly collectionName: string

  constructor(private readonly configService: ConfigService) {
    this.qdrantClient = new QdrantClient({
      url: configService.get<string>('QDRANT_URL'),
      apiKey: configService.get<string>('QDRANT_API_KEY'),
    })
    this.collectionName =
      configService.get<string>('QDRANT_COLLECTION') || 'document_chunks'
  }

  async getEmbedding(text: string): Promise<number[]> {
    const res = await fetch('https://api.groq.com/openai/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.configService.get<string>('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'nomic-embed-text-v1',
      }),
    })

    const data = await res.json()
    return data.data?.[0]?.embedding ?? []
  }

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

    return result.map((point) => point.payload as { content: string })
  }
}
