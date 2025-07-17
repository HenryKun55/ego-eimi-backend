import { Module } from '@nestjs/common'
import { SearchController } from './search.controller'
import { EmbeddingModule } from 'src/embedding/embedding.module'
import { QdrantModule } from 'src/qdrant/qdrant.module'

@Module({
  imports: [EmbeddingModule, QdrantModule],
  controllers: [SearchController],
})
export class SearchModule {}
