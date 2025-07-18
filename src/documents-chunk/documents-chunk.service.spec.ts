import { Test, TestingModule } from '@nestjs/testing'
import { DocumentsChunkService } from './documents-chunk.service'
import { HttpException } from '@nestjs/common'
import { EmbeddingService } from '../embedding/embedding.service'
import { QdrantService } from '../qdrant/qdrant.service'

describe('DocumentsChunkService', () => {
  let service: DocumentsChunkService
  let embeddingService: EmbeddingService
  let qdrantService: QdrantService

  const mockEmbeddingService = {
    generateEmbeddings: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    generateSingleEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  }

  const mockQdrantService = {
    upsertPoints: jest.fn().mockResolvedValue(undefined),
    search: jest.fn().mockResolvedValue([
      {
        id: 'chunk-1',
        payload: { text: 'chunk text', documentId: 'doc-1' },
        score: 0.9,
      },
    ]),
    searchWithFilter: jest.fn().mockResolvedValue([]),
    deletePoints: jest.fn().mockResolvedValue(undefined),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsChunkService,
        { provide: EmbeddingService, useValue: mockEmbeddingService },
        { provide: QdrantService, useValue: mockQdrantService },
      ],
    }).compile()

    service = module.get(DocumentsChunkService)
    embeddingService = module.get(EmbeddingService)
    qdrantService = module.get(QdrantService)
  })

  afterEach(() => jest.clearAllMocks())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('chunkAndIndex', () => {
    it('should throw if content is empty', async () => {
      await expect(service.chunkAndIndex('', 'doc-1')).rejects.toThrow(
        HttpException
      )
    })

    it('should throw if documentId is empty', async () => {
      await expect(service.chunkAndIndex('texto', '')).rejects.toThrow(
        HttpException
      )
    })

    it('should index chunks and return result', async () => {
      const result = await service.chunkAndIndex(
        'Este é um conteúdo de teste para chunking e embedding.',
        'doc-1',
        {
          chunkSize: 200,
          minChunkSize: 50,
        }
      )

      expect(result.totalChunks).toBeGreaterThan(0)
      expect(mockQdrantService.upsertPoints).toHaveBeenCalled()
      expect(result.indexedChunks).toBeGreaterThan(0)
    })
  })

  describe('searchSimilarChunks', () => {
    it('should throw if query is empty', async () => {
      await expect(service.searchSimilarChunks('')).rejects.toThrow(
        HttpException
      )
    })

    it('should return formatted results', async () => {
      const results = await service.searchSimilarChunks('buscar algo')
      expect(results[0]).toEqual(
        expect.objectContaining({
          id: 'chunk-1',
          text: expect.any(String),
          metadata: expect.any(Object),
          score: expect.any(Number),
        })
      )
    })
  })

  describe('removeDocumentChunks', () => {
    it('should throw if documentId is empty', async () => {
      await expect(service.removeDocumentChunks('')).rejects.toThrow(
        HttpException
      )
    })

    it('should search and delete chunk IDs', async () => {
      jest.spyOn(qdrantService, 'searchWithFilter').mockResolvedValue([
        { id: 'c1', payload: {}, score: 0, version: 0 },
        { id: 'c2', payload: {}, score: 0, version: 0 },
      ])

      const count = await service.removeDocumentChunks('doc-1')
      expect(qdrantService.deletePoints).toHaveBeenCalledWith(['c1', 'c2'])
      expect(count).toBe(2)
    })
  })
})
