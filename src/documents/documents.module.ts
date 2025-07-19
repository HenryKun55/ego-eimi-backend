import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Document } from './entities/document.entity'
import { DocumentChunk } from '../documents-chunk/entities/document-chunk.entity'
import { DocumentsController } from './documents.controller'
import { DocumentsService } from './documents.service'
import { DocumentCreatorService } from './document-creator.service'
import { DocumentUpdaterService } from './document-updater.service'
import { DocumentSearchService } from './document-search.service'
import { DocumentsChunkModule } from '../documents-chunk/documents-chunk.module'

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
