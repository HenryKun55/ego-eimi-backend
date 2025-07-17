// src/qdrant/qdrant.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { QdrantClient } from '@qdrant/js-client-rest'

@Injectable()
export class QdrantService implements OnModuleInit {
  private client = new QdrantClient({ url: 'http://localhost:6333' })
  private collectionName = 'documents'

  async onModuleInit() {
    const collections = await this.client.getCollections()
    const exists = collections.collections.some(
      (c) => c.name === this.collectionName
    )

    if (!exists) {
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      })
      console.log('Collection criada com sucesso!')
    } else {
      console.log('Collection já existe.')
    }
  }
}
