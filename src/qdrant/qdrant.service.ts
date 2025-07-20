import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { QdrantClient } from '@qdrant/js-client-rest'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name)
  private readonly client: QdrantClient
  private readonly collectionName: string

  constructor(private readonly configService: ConfigService) {
    const url =
      this.configService.get<string>('QDRANT_URL') || 'http://localhost:6333'
    const apiKey = this.configService.get<string>('QDRANT_API_KEY') || undefined
    this.collectionName =
      this.configService.get<string>('QDRANT_COLLECTION') || 'document_chunks'

    this.client = new QdrantClient({ url, apiKey })
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
          on_disk: true,
        },
        optimizers_config: {
          default_segment_number: 1,
        },
      })
      this.logger.log(`Collection "${this.collectionName}" criada com sucesso.`)
    } catch (error: any) {
      if (error.status === 409) {
        this.logger.warn(`Collection "${this.collectionName}" já existe.`)
      } else {
        this.logger.error('Erro ao criar a collection no Qdrant:', error)
        throw error
      }
    }

    try {
      await this.client.createPayloadIndex(this.collectionName, {
        field_name: 'requiredRole',
        field_schema: 'keyword',
      })
      this.logger.log('Índice "requiredRole" criado com sucesso.')
    } catch (indexError: any) {
      if (indexError?.status === 409) {
        this.logger.warn('Índice "requiredRole" já existe.')
      } else {
        this.logger.error('Erro ao criar índice de payload:', indexError)
        throw indexError
      }
    }

    try {
      await this.client.createPayloadIndex(this.collectionName, {
        field_name: 'documentId',
        field_schema: 'uuid',
      })
      this.logger.log('Índice "documentId" criado com sucesso.')
    } catch (indexError: any) {
      if (indexError?.status === 409) {
        this.logger.warn('Índice "documentId" já existe.')
      } else {
        this.logger.error('Erro ao criar índice "documentId":', indexError)
        throw indexError
      }
    }

    if (this.configService.get('CLEAR_QDRANT_ON_BOOT') === 'true') {
      await this.clearCollection()
    }
  }

  async clearCollection(): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        filter: {},
      })
      this.logger.warn(
        `🧹 Collection "${this.collectionName}" limpa com sucesso.`
      )
    } catch (error) {
      this.logger.error(
        `❌ Erro ao limpar a collection "${this.collectionName}":`,
        error
      )
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
