import { Module } from '@nestjs/common'
import { DocumentsService } from './documents.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Document } from './entities/document.entity'
import { DocumentChunk } from '../documents-chunk/entities/document-chunk.entity'
import { DocumentsController } from './documents.controller'
import { DocumentsChunkModule } from '../documents-chunk/documents-chunk.module'
import { DocumentCreatorService } from './document-creator.service'
import { DocumentUpdaterService } from './document-updater.service'
import { DocumentSearchService } from './document-search.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentChunk]),
    DocumentsChunkModule,
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentCreatorService,
    DocumentUpdaterService,
    DocumentSearchService,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
