import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { QdrantClient } from '@qdrant/js-client-rest'

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name)
  private readonly client: QdrantClient
  private readonly collectionName = 'documents'
  private readonly vectorSize = 1536

  constructor() {
    const url = process.env.QDRANT_URL || 'http://localhost:6333'
    this.client = new QdrantClient({ url })
  }

  async onModuleInit(): Promise<void> {
    try {
      const { collections } = await this.client.getCollections()
      const exists = collections.some((c) => c.name === this.collectionName)

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine',
          },
        })
        this.logger.log(`Coleção '${this.collectionName}' criada com sucesso.`)
      } else {
        this.logger.log(`Coleção '${this.collectionName}' já existe.`)
      }
    } catch (error) {
      this.logger.error('Erro ao inicializar o Qdrant:', error)
      throw error
    }
  }

  getClient(): QdrantClient {
    return this.client
  }

  getCollectionName(): string {
    return this.collectionName
  }

  async upsertPoints(
    points: {
      id: number | string
      vector: number[]
      payload?: Record<string, any>
    }[]
  ): Promise<void> {
    try {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: points.map(({ id, vector, payload }) => ({
          id,
          vector,
          payload: payload ?? {},
        })),
      })
    } catch (error) {
      this.logger.error('Erro ao inserir pontos no Qdrant:', error)
      throw error
    }
  }

  async search(vector: number[], limit = 5, scoreThreshold = 0.7) {
    try {
      return await this.client.search(this.collectionName, {
        vector,
        limit,
        score_threshold: scoreThreshold,
        with_payload: true,
        with_vector: false,
      })
    } catch (error) {
      this.logger.error('Erro na busca por similaridade:', error)
      throw error
    }
  }

  async searchWithFilter(
    vector: number[],
    filter: Record<string, any>,
    limit = 5,
    scoreThreshold = 0.7
  ) {
    try {
      return await this.client.search(this.collectionName, {
        vector,
        filter,
        limit,
        score_threshold: scoreThreshold,
        with_payload: true,
        with_vector: false,
      })
    } catch (error) {
      this.logger.error('Erro na busca com filtro:', error)
      throw error
    }
  }

  async deletePoints(ids: (number | string)[]): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        points: ids,
      })
      this.logger.log(`Removidos ${ids.length} pontos do Qdrant.`)
    } catch (error) {
      this.logger.error('Erro ao deletar pontos do Qdrant:', error)
      throw error
    }
  }
}
