import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Document } from './entities/document.entity'
import { DocumentChunk } from '../documents-chunk/entities/document-chunk.entity'
import { DocumentsChunkService } from '../documents-chunk/documents-chunk.service'
import { DocumentCreatorService } from './document-creator.service'
import { CreateDocumentDto } from './dtos/create-document.dto'
import { UpdateDocumentDto } from './dtos/update-document.dto'
import { DocumentUpdaterService } from './document-updater.service'
import { DocumentSearchService } from './document-search.service'
import { DocumentSearchResult } from './@types/document-search-result.types'

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name)

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(DocumentChunk)
    private readonly documentChunkRepository: Repository<DocumentChunk>,
    private readonly documentCreator: DocumentCreatorService,
    private readonly documentUpdater: DocumentUpdaterService,
    private readonly documentSearch: DocumentSearchService,
    private readonly documentsChunkService: DocumentsChunkService
  ) {}

  async create(createDto: CreateDocumentDto): Promise<Document> {
    return this.documentCreator.execute(createDto)
  }

  async createWithChunksAndEmbedding(
    createDto: CreateDocumentDto
  ): Promise<Document> {
    const document = await this.create(createDto)

    const metadata = {
      documentId: document.id,
      requiredRole: createDto.requiredRole,
      sourceName: createDto.sourceName,
      ...(createDto.metadata || {}),
    }

    try {
      await this.documentsChunkService.chunkAndIndex(
        createDto.content,
        document.id.toString(),
        createDto.chunkingOptions,
        {
          metadata,
          embeddingOptions: undefined,
          batchSize: createDto.indexingOptions?.batchSize || 50,
        }
      )
    } catch (err) {
      this.logger.error(
        `Erro ao indexar chunks para documento ${document.id}:`,
        err
      )
      throw new HttpException(
        'Erro ao indexar documento',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    return document
  }

  async findAll(userRoles?: string[]): Promise<Document[]> {
    if (!userRoles?.length) {
      this.logger.warn('Requisição sem roles válidas – retornando vazio')
      return []
    }

    try {
      return await this.documentRepository
        .createQueryBuilder('document')
        .where('document.requiredRole IN (:...roles)', {
          roles: userRoles,
        })
        .orderBy('"document"."createdAt"', 'DESC')
        .getMany()
    } catch (error) {
      this.logger.error('Erro ao buscar documentos', error)
      throw error
    }
  }

  async findOne(id: string, userRoles?: string[]): Promise<Document> {
    try {
      const query = this.documentRepository
        .createQueryBuilder('document')
        .where('document.id = :id', { id })

      if (userRoles?.length) {
        query.andWhere('document.requiredRole IN (:...roles)', {
          roles: userRoles,
        })
      }

      const document = await query.getOne()

      if (!document) {
        throw new HttpException(
          'Documento não encontrado ou acesso negado',
          HttpStatus.NOT_FOUND
        )
      }

      return document
    } catch (error) {
      this.logger.error(`Erro ao buscar documento ${id}`, error)
      throw error
    }
  }

  async update(
    id: string,
    dto: UpdateDocumentDto,
    userRoles?: string[]
  ): Promise<Document> {
    const existing = await this.findOne(id, userRoles)
    return this.documentUpdater.execute(id, dto, existing)
  }

  async remove(id: string, userRoles?: string[]): Promise<void> {
    this.logger.log(`Removendo documento ${id}`)

    try {
      await this.findOne(id, userRoles)
      await this.documentsChunkService.removeDocumentChunks(id)
      const result = await this.documentRepository.delete(id)

      if (result.affected === 0) {
        throw new HttpException(
          'Nenhum documento removido',
          HttpStatus.NOT_FOUND
        )
      }

      this.logger.log(`Documento ${id} removido com sucesso`)
    } catch (error) {
      this.logger.error(`Erro ao remover documento ${id}`, error)
      throw error
    }
  }

  async searchDocuments(
    query: string,
    userRoles?: string[],
    limit = 10,
    score = 0.7
  ): Promise<DocumentSearchResult[]> {
    if (!userRoles?.length) return []
    return this.documentSearch.execute(query, userRoles, limit, score)
  }

  async getDocumentStats(id: string, userRoles?: string[]) {
    try {
      const document = await this.findOne(id, userRoles)

      const stats = await this.documentChunkRepository
        .createQueryBuilder('chunk')
        .select('COUNT(*)', 'total')
        .addSelect('AVG(LENGTH(chunk.content))', 'average')
        .where('chunk.documentId = :id', { id })
        .getRawOne()

      return {
        document,
        totalChunks: parseInt(stats.total, 10) || 0,
        averageChunkSize: parseFloat(stats.average) || 0,
      }
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas do documento ${id}`, error)
      throw error
    }
  }
}
