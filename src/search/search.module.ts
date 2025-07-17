import { Module } from '@nestjs/common'
import { SearchController } from './search.controller'
import { EmbeddingService } from 'src/embedding/embedding.service'
import { QdrantService } from 'src/qdrant/qdrant.service'

@Module({
  controllers: [SearchController],
  providers: [EmbeddingService, QdrantService],
})
export class SearchModule {}
