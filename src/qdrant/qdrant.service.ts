import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { QdrantClient } from '@qdrant/js-client-rest'

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name)
  private readonly client: QdrantClient
  private readonly collectionName = 'documents'
  private readonly vectorSize = 1536

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    })
  }

  async onModuleInit(): Promise<void> {
    try {
      const collections = await this.client.getCollections()
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName
      )

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
    }
  }

  getClient() {
    return this.client
  }

  getCollectionName() {
    return this.collectionName
  }

  async upsertPoints(
    points: { id: number | string; vector: number[]; payload?: any }[]
  ) {
    try {
      return await this.client.upsert(this.collectionName, {
        wait: true,
        points: points.map((point) => ({
          id: point.id,
          vector: point.vector,
          payload: point.payload || {},
        })),
      })
    } catch (error) {
      this.logger.error('Error on upsertPoints: ', error)
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
      this.logger.error('Error on search: ', error)
      throw error
    }
  }

  async searchSimilar(
    vector: number[],
    score_threshold = 5,
    filter?: Record<string, any>
  ) {
    return this.client.search(this.collectionName, {
      vector,
      filter,
      score_threshold,
    })
  }

  async searchWithFilter(
    vector: number[],
    filter: any,
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
      this.logger.error('Error on searchWithFilter: ', error)
      throw error
    }
  }

  async deletePoints(ids: (number | string)[]) {
    try {
      return await this.client.delete(this.collectionName, {
        wait: true,
        points: ids,
      })
    } catch (error) {
      this.logger.error('Error on deletePoints: ', error)
      throw error
    }
  }
}
