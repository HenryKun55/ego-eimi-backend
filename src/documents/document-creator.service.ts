import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Document } from './entities/document.entity'
import { DocumentsChunkService } from '../documents-chunk/documents-chunk.service'
import { CreateDocumentDto } from './dtos/create-document.dto'

@Injectable()
export class DocumentCreatorService {
  private readonly logger = new Logger(DocumentCreatorService.name)

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly documentsChunkService: DocumentsChunkService
  ) {}

  async execute(dto: CreateDocumentDto): Promise<Document> {
    const {
      sourceName,
      content,
      requiredRole,
      metadata,
      chunkingOptions,
      indexingOptions,
    } = dto

    this.logger.log(`Criando documento: ${sourceName}`)

    try {
      const document = this.documentRepository.create({
        sourceName,
        content,
        requiredRole,
      })

      const savedDocument = await this.documentRepository.save(document)

      const indexingResult = await this.documentsChunkService.chunkAndIndex(
        content,
        savedDocument.id.toString(),
        chunkingOptions,
        {
          ...indexingOptions,
          metadata: {
            documentId: savedDocument.id,
            sourceName: savedDocument.sourceName,
            requiredRole: savedDocument.requiredRole,
            ...(metadata || {}),
          },
        }
      )

      if (
        !indexingResult ||
        indexingResult.indexedChunks < indexingResult.totalChunks
      ) {
        this.logger.warn(
          `Indexação incompleta para doc ${savedDocument.id}: ` +
            `${indexingResult?.indexedChunks}/${indexingResult?.totalChunks}`
        )
      }

      this.logger.log(
        `Documento ${savedDocument.id} criado com sucesso. ` +
          `Chunks indexados: ${indexingResult.indexedChunks}/${indexingResult.totalChunks}`
      )

      return savedDocument
    } catch (error) {
      this.logger.error(
        `Erro ao criar e indexar documento: ${sourceName}`,
        error
      )
      throw new InternalServerErrorException(
        'Erro ao criar documento e indexar conteúdo'
      )
    }
  }
}
