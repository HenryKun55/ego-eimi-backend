import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import { DocumentsChunkService } from 'src/documents-chunk/documents-chunk.service'
import { DocumentSearchResult } from './documents.service'

@Injectable()
export class DocumentSearchService {
  private readonly logger = new Logger(DocumentSearchService.name)

  constructor(private readonly documentsChunkService: DocumentsChunkService) {}

  async execute(
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

    this.logger.log(`Buscando documento: ${query}`)

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

    const chunks = await this.documentsChunkService.searchSimilarChunks(
      query,
      limit,
      scoreThreshold,
      filter
    )

    return chunks.map((chunk) => ({
      id: chunk.id,
      text: chunk.text as string,
      metadata: chunk.metadata,
      score: chunk.score,
      document: {
        id: chunk.metadata.documentId as string,
        sourceName: chunk.metadata.sourceName as string,
        requiredRole: chunk.metadata.requiredRole as string,
      },
    }))
  }
}
