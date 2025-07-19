import { Module } from '@nestjs/common'
import { EmbeddingModule } from '../embedding/embedding.module'
import { QdrantModule } from '../qdrant/qdrant.module'
import { DocumentsChunkService } from './documents-chunk.service'

@Module({
  imports: [EmbeddingModule, QdrantModule],
  providers: [DocumentsChunkService],
  exports: [DocumentsChunkService],
})
export class DocumentsChunkModule {}
