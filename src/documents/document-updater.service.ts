import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Document } from './entities/document.entity'
import { DocumentsChunkService } from 'src/documents-chunk/documents-chunk.service'
import { UpdateDocumentDto } from './dtos/update-document.dto'

@Injectable()
export class DocumentUpdaterService {
  private readonly logger = new Logger(DocumentUpdaterService.name)

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly documentsChunkService: DocumentsChunkService
  ) {}

  async execute(
    id: string,
    dto: UpdateDocumentDto,
    existing: Document
  ): Promise<Document> {
    const {
      sourceName,
      content,
      requiredRole,
      metadata,
      chunkingOptions,
      indexingOptions,
    } = dto

    const contentChanged = content && content !== existing.content

    const updateData: Partial<Document> = {}
    if (sourceName) updateData.sourceName = sourceName
    if (content) updateData.content = content
    if (requiredRole) updateData.requiredRole = requiredRole

    if (Object.keys(updateData).length > 0) {
      await this.documentRepository.update(id, updateData)
    }

    if (contentChanged) {
      await this.documentsChunkService.removeDocumentChunks(id)

      await this.documentsChunkService.chunkAndIndex(
        content,
        id,
        chunkingOptions,
        {
          ...indexingOptions,
          metadata: {
            documentId: id,
            sourceName: sourceName || existing.sourceName,
            requiredRole: requiredRole || existing.requiredRole,
            ...metadata,
          },
        }
      )

      this.logger.log(`Chunks do documento ${id} reprocessados`)
    }

    const updated = await this.documentRepository.findOneBy({ id })

    if (!updated) {
      throw new HttpException(
        'Erro ao recuperar documento atualizado',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    return updated
  }
}
