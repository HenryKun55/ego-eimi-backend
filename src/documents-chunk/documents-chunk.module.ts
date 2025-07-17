import { Module } from '@nestjs/common'
import { EmbeddingModule } from 'src/embedding/embedding.module'
import { QdrantModule } from 'src/qdrant/qdrant.module'
import { DocumentsChunkService } from './documents-chunk.service'

@Module({
  imports: [EmbeddingModule, QdrantModule],
  providers: [DocumentsChunkService],
  exports: [DocumentsChunkService],
})
export class DocumentsChunkModule {}
