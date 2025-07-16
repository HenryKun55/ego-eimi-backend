import { Module } from '@nestjs/common'
import { DocumentController } from './documents.controller'
import { DocumentsService } from './documents.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Document } from './entities/document.entity'
import { DocumentChunk } from './entities/document-chunk.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Document, DocumentChunk])],
  controllers: [DocumentController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
