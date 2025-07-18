import { Test, TestingModule } from '@nestjs/testing'
import { SearchService } from './search.service'
import { ConfigService } from '@nestjs/config'
import { QdrantClient } from '@qdrant/js-client-rest'
import { InternalServerErrorException, Logger } from '@nestjs/common'
import { EmbeddingService } from '../embedding/embedding.service'

jest.mock('@qdrant/js-client-rest')

describe('SearchService', () => {
  let service: SearchService
  let embeddingService: EmbeddingService
  let qdrantClientMock: jest.Mocked<QdrantClient>

  beforeEach(async () => {
    const mockQdrantInstance = {
      search: jest.fn(),
    }

    ;(QdrantClient as jest.Mock).mockImplementation(() => mockQdrantInstance)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'QDRANT_URL') return 'http://localhost:6333'
              if (key === 'QDRANT_API_KEY') return 'dummy-key'
              if (key === 'QDRANT_COLLECTION') return 'test-collection'
              return null
            },
          },
        },
        {
          provide: EmbeddingService,
          useValue: {
            generateSingleEmbedding: jest
              .fn()
              .mockResolvedValue([0.1, 0.2, 0.3]),
          },
        },
      ],
    }).compile()

    service = module.get<SearchService>(SearchService)
    embeddingService = module.get<EmbeddingService>(EmbeddingService)
    qdrantClientMock = (service as any).qdrantClient

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return formatted chunks from qdrant', async () => {
    const query = 'busca de teste'
    const user = {
      email: 'usuario@teste.com',
      roles: ['admin'],
    }

    qdrantClientMock.search.mockResolvedValue([
      {
        id: 1,
        version: 1,
        score: 0.9,
        payload: {
          text: 'conteúdo',
          documentId: '123',
          requiredRole: 'admin',
        },
        vector: [0.1, 0.2, 0.3],
      },
    ])

    const results = await service.searchChunks(query, user as any)

    expect(embeddingService.generateSingleEmbedding).toHaveBeenCalledWith(query)
    expect(qdrantClientMock.search).toHaveBeenCalled()
    expect(results).toEqual([
      {
        content: 'conteúdo',
        metadata: {
          text: 'conteúdo',
          documentId: '123',
          requiredRole: 'admin',
        },
        score: 0.9,
      },
    ])
  })

  it('should return empty if user has no roles', async () => {
    const query = 'sem permissão'
    const user = {
      email: 'semrole@teste.com',
      roles: [],
    }

    const result = await service.searchChunks(query, user as any)
    expect(result).toEqual([])
  })

  it('should throw if QDRANT_URL is missing', () => {
    const config = new ConfigService()
    jest.spyOn(config, 'get').mockReturnValue(null)

    expect(() => {
      new SearchService(config, embeddingService)
    }).toThrow(InternalServerErrorException)
  })
})
