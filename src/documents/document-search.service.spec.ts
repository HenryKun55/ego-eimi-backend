import { Test, TestingModule } from '@nestjs/testing'
import { DocumentSearchService } from './document-search.service'
import { HttpException } from '@nestjs/common'
import { DocumentsChunkService } from '../documents-chunk/documents-chunk.service'

describe('DocumentSearchService', () => {
  let service: DocumentSearchService
  let chunkService: DocumentsChunkService

  const mockChunks = [
    {
      id: 'chunk-1',
      text: 'Texto relacionado ao query',
      metadata: {
        documentId: 'doc-1',
        sourceName: 'source-1',
        requiredRole: 'user',
      },
      score: 0.9,
    },
  ]

  const mockDocumentsChunkService = {
    searchSimilarChunks: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentSearchService,
        {
          provide: DocumentsChunkService,
          useValue: mockDocumentsChunkService,
        },
      ],
    }).compile()

    service = module.get(DocumentSearchService)
    chunkService = module.get(DocumentsChunkService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should throw if query is empty', async () => {
    await expect(service.execute('')).rejects.toThrow(HttpException)
    await expect(service.execute(' ')).rejects.toThrow(
      'Query de busca não pode estar vazia'
    )
  })

  it('should return mapped search results', async () => {
    mockDocumentsChunkService.searchSimilarChunks.mockResolvedValue(mockChunks)

    const result = await service.execute('query', ['user'], 5, 0.8)

    expect(result).toEqual([
      {
        id: 'chunk-1',
        text: 'Texto relacionado ao query',
        metadata: {
          documentId: 'doc-1',
          sourceName: 'source-1',
          requiredRole: 'user',
        },
        score: 0.9,
        document: {
          id: 'doc-1',
          sourceName: 'source-1',
          requiredRole: 'user',
        },
      },
    ])

    expect(chunkService.searchSimilarChunks).toHaveBeenCalledWith(
      'query',
      5,
      0.8,
      {
        should: [
          { key: 'requiredRole', match: { value: 'user' } },
          { key: 'requiredRole', match: { value: 'public' } },
        ],
      }
    )
  })

  it('should call chunkService with undefined filter if no roles', async () => {
    mockDocumentsChunkService.searchSimilarChunks.mockResolvedValue([])

    await service.execute('query', undefined, 3)

    expect(chunkService.searchSimilarChunks).toHaveBeenCalledWith(
      'query',
      3,
      0.7,
      undefined
    )
  })
})
