import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Document } from './entities/document.entity'
import { DocumentChunk } from '../documents-chunk/entities/document-chunk.entity'
import { DocumentsChunkService } from '../documents-chunk/documents-chunk.service'
import {
  ChunkingOptions,
  IndexingOptions,
} from '../documents-chunk/documents-chunk.service'

export interface CreateDocumentDto {
  sourceName: string
  content: string
  requiredRole: string
  metadata?: Record<string, any>
  chunkingOptions?: ChunkingOptions
  indexingOptions?: IndexingOptions
}

export interface UpdateDocumentDto {
  sourceName?: string
  content?: string
  requiredRole?: string
  metadata?: Record<string, any>
  chunkingOptions?: ChunkingOptions
  indexingOptions?: IndexingOptions
}

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
    private readonly documentsChunkService: DocumentsChunkService
  ) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    const {
      sourceName,
      content,
      requiredRole,
      metadata,
      chunkingOptions,
      indexingOptions,
    } = createDocumentDto

    this.logger.log(`Criando documento: ${sourceName}`)

    // Validações
    if (!content || content.trim().length === 0) {
      throw new HttpException(
        'Conteúdo do documento não pode estar vazio',
        HttpStatus.BAD_REQUEST
      )
    }

    if (!sourceName || sourceName.trim().length === 0) {
      throw new HttpException(
        'Nome do documento é obrigatório',
        HttpStatus.BAD_REQUEST
      )
    }

    try {
      // 1. Criar documento no banco
      const document = this.documentRepository.create({
        sourceName,
        content,
        requiredRole,
      })

      const savedDocument = await this.documentRepository.save(document)

      // 2. Processar chunks e indexar no Qdrant
      const indexingResult = await this.documentsChunkService.chunkAndIndex(
        content,
        savedDocument.id,
        chunkingOptions,
        {
          ...indexingOptions,
          metadata: {
            documentId: savedDocument.id,
            sourceName: savedDocument.sourceName,
            requiredRole: savedDocument.requiredRole,
            ...metadata,
          },
        }
      )

      this.logger.log(
        `Documento ${savedDocument.id} criado com sucesso. ` +
          `Chunks indexados: ${indexingResult.indexedChunks}/${indexingResult.totalChunks}`
      )

      return savedDocument
    } catch (error) {
      this.logger.error('Erro ao criar documento:', error)
      throw error
    }
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

  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
    userRoles?: string[]
  ): Promise<Document> {
    const {
      sourceName,
      content,
      requiredRole,
      metadata,
      chunkingOptions,
      indexingOptions,
    } = updateDocumentDto

    this.logger.log(`Atualizando documento: ${id}`)

    try {
      // 1. Verificar se documento existe e usuário tem permissão
      const existingDocument = await this.findOne(id, userRoles)

      // 2. Verificar se houve mudança no conteúdo
      const contentChanged = content && content !== existingDocument.content

      // 3. Atualizar documento no banco
      const updateData: Partial<Document> = {}
      if (sourceName) updateData.sourceName = sourceName
      if (content) updateData.content = content
      if (requiredRole) updateData.requiredRole = requiredRole

      if (Object.keys(updateData).length > 0) {
        await this.documentRepository.update(id, updateData)
      }

      // 4. Se o conteúdo mudou, reprocessar chunks
      if (contentChanged) {
        // Remover chunks antigos
        await this.documentsChunkService.removeDocumentChunks(id)

        // Criar novos chunks
        await this.documentsChunkService.chunkAndIndex(
          content,
          id,
          chunkingOptions,
          {
            ...indexingOptions,
            metadata: {
              documentId: id,
              sourceName: sourceName || existingDocument.sourceName,
              requiredRole: requiredRole || existingDocument.requiredRole,
              ...metadata,
            },
          }
        )

        this.logger.log(`Chunks do documento ${id} reprocessados`)
      }

      return await this.findOne(id, userRoles)
    } catch (error) {
      this.logger.error(`Erro ao atualizar documento ${id}:`, error)
      throw error
    }
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
    scoreThreshold = 0.7
  ): Promise<DocumentSearchResult[]> {
    if (!query || query.trim().length === 0) {
      throw new HttpException(
        'Query de busca não pode estar vazia',
        HttpStatus.BAD_REQUEST
      )
    }

    this.logger.debug(
      `Buscando documentos para query: "${query.substring(0, 50)}..."`
    )

    try {
      // Filtro por roles se fornecido
      const filter =
        userRoles && userRoles.length > 0
          ? {
              should: [
                ...userRoles.map((role) => ({
                  key: 'requiredRole',
                  match: { value: role },
                })),
                { key: 'requiredRole', match: { value: 'public' } },
              ],
            }
          : undefined

      // Buscar chunks similares
      const chunks = await this.documentsChunkService.searchSimilarChunks(
        query,
        limit,
        scoreThreshold,
        filter
      )

      // Mapear resultados com informações do documento
      const results: DocumentSearchResult[] = []

      for (const chunk of chunks) {
        const documentInfo = {
          id: chunk.metadata.documentId as string,
          sourceName: (chunk.metadata.sourceName as string) || '',
          requiredRole: (chunk.metadata.requiredRole as string) || '',
        }

        results.push({
          id: chunk.id,
          text: chunk.text as string,
          metadata: chunk.metadata,
          score: chunk.score,
          document: documentInfo,
        })
      }

      this.logger.debug(`Retornando ${results.length} resultados de busca`)
      return results
    } catch (error) {
      this.logger.error('Erro na busca de documentos:', error)
      throw error
    }
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
