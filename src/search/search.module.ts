import { Module } from '@nestjs/common'
import { SearchController } from './search.controller'
import { EmbeddingModule } from '../embedding/embedding.module'
import { QdrantModule } from '../qdrant/qdrant.module'
import { SearchService } from './search.service'

@Module({
  imports: [EmbeddingModule, QdrantModule],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
