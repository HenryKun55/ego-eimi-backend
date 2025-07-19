import { Test, TestingModule } from '@nestjs/testing'
import { SearchService } from './search.service'
import { QdrantService } from '../qdrant/qdrant.service'
import { EmbeddingService } from '../embedding/embedding.service'
import { QdrantClient } from '@qdrant/js-client-rest'

describe('SearchService', () => {
  let service: SearchService
  let embeddingService: EmbeddingService
  let qdrantClientMock: jest.Mocked<QdrantClient>

  beforeEach(async () => {
    qdrantClientMock = {
      search: jest.fn(),
    } as unknown as jest.Mocked<QdrantClient>

    const qdrantServiceMock = {
      getClient: () => qdrantClientMock,
      getCollectionName: () => 'document_chunks',
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: QdrantService,
          useValue: qdrantServiceMock,
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

    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
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
})
