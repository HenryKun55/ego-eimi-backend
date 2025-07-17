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

export interface DocumentSearchResult {
  id: string | number
  text: string
  metadata: Record<string, any>
  score: number
  document: {
    id: string
    sourceName: string
    requiredRole: string
  }
}

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

  async findAll(userRoles?: string[]): Promise<Document[]> {
    try {
      const queryBuilder =
        this.documentRepository.createQueryBuilder('document')

      // Filtrar por roles se fornecido
      if (userRoles && userRoles.length > 0) {
        queryBuilder.where(
          'document.requiredRole IN (:...roles) OR document.requiredRole = :publicRole',
          {
            roles: userRoles,
            publicRole: 'public',
          }
        )
      }

      return await queryBuilder.getMany()
    } catch (error) {
      this.logger.error('Erro ao buscar documentos:', error)
      throw error
    }
  }

  async findOne(id: string, userRoles?: string[]): Promise<Document> {
    try {
      const queryBuilder = this.documentRepository
        .createQueryBuilder('document')
        .where('document.id = :id', { id })

      // Verificar permissão de roles
      if (userRoles && userRoles.length > 0) {
        queryBuilder.andWhere(
          'document.requiredRole IN (:...roles) OR document.requiredRole = :publicRole',
          {
            roles: userRoles,
            publicRole: 'public',
          }
        )
      }

      const document = await queryBuilder.getOne()

      if (!document) {
        throw new HttpException(
          'Documento não encontrado ou acesso negado',
          HttpStatus.NOT_FOUND
        )
      }

      return document
    } catch (error) {
      this.logger.error(`Erro ao buscar documento ${id}:`, error)
      throw error
    }
  }

  async update(id: string, dto: UpdateDocumentDto, userRoles?: string[]) {
    const existing = await this.findOne(id, userRoles)
    return this.documentUpdater.execute(id, dto, existing)
  }

  async remove(id: string, userRoles?: string[]): Promise<void> {
    this.logger.log(`Removendo documento: ${id}`)

    try {
      // 1. Verificar se documento existe e usuário tem permissão
      await this.findOne(id, userRoles)

      // 2. Remover chunks do Qdrant
      await this.documentsChunkService.removeDocumentChunks(id)

      // 3. Remover documento do banco (cascata remove chunks relacionados)
      await this.documentRepository.delete(id)

      this.logger.log(`Documento ${id} removido com sucesso`)
    } catch (error) {
      this.logger.error(`Erro ao remover documento ${id}:`, error)
      throw error
    }
  }

  async searchDocuments(
    query: string,
    userRoles?: string[],
    limit = 10,
    score = 0.7
  ) {
    return this.documentSearch.execute(query, userRoles, limit, score)
  }

  async getDocumentStats(
    id: string,
    userRoles?: string[]
  ): Promise<{
    document: Document
    totalChunks: number
    averageChunkSize: number
  }> {
    try {
      const document = await this.findOne(id, userRoles)

      // Buscar chunks do documento no banco
      const chunks = await this.documentChunkRepository.find({
        where: { documentId: id },
      })

      const totalChunks = chunks.length
      const averageChunkSize =
        totalChunks > 0
          ? chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) /
            totalChunks
          : 0

      return {
        document,
        totalChunks,
        averageChunkSize,
      }
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas do documento ${id}:`, error)
      throw error
    }
  }
}
