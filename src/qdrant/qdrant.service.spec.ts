import { Test, TestingModule } from '@nestjs/testing'
import { QdrantService } from './qdrant.service'
import { QdrantClient } from '@qdrant/js-client-rest'

jest.mock('@qdrant/js-client-rest')

describe('QdrantService', () => {
  let service: QdrantService
  let clientMock: jest.Mocked<QdrantClient>

  const createClientMock = (): jest.Mocked<QdrantClient> =>
    ({
      getCollections: jest.fn().mockResolvedValue({ collections: [] }),
      createCollection: jest.fn().mockResolvedValue({}),
      upsert: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
    }) as unknown as jest.Mocked<QdrantClient>

  beforeEach(async () => {
    clientMock = createClientMock()
    ;(QdrantClient as jest.Mock).mockImplementation(() => clientMock)

    const module: TestingModule = await Test.createTestingModule({
      providers: [QdrantService],
    }).compile()

    service = module.get(QdrantService)
  })

  afterEach(() => jest.clearAllMocks())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('onModuleInit', () => {
    it('should create collection if not exists', async () => {
      clientMock.getCollections.mockResolvedValueOnce({ collections: [] })
      clientMock.createCollection.mockResolvedValueOnce(Promise.resolve(true))

      await service.onModuleInit()

      expect(clientMock.createCollection).toHaveBeenCalledWith(
        'document_chunks',
        {
          vectors: { size: 1536, distance: 'Cosine', on_disk: true },
        }
      )
    })

    it('should not create collection if already exists', async () => {
      clientMock.getCollections.mockResolvedValueOnce({
        collections: [{ name: 'document_chunks' }],
      })

      await service.onModuleInit()

      expect(clientMock.createCollection).toHaveBeenCalledTimes(1)
    })
  })

  describe('upsertPoints', () => {
    it('should call client.upsert with formatted points', async () => {
      const points = [
        { id: '1', vector: [1, 2, 3], payload: { test: true } },
        { id: '2', vector: [4, 5, 6] },
      ]

      await service.upsertPoints(points)

      expect(clientMock.upsert).toHaveBeenCalledWith('document_chunks', {
        wait: true,
        points: [
          { id: '1', vector: [1, 2, 3], payload: { test: true } },
          { id: '2', vector: [4, 5, 6], payload: {} },
        ],
      })
    })
  })

  describe('search', () => {
    it('should call client.search with correct params', async () => {
      const vector = [1, 2, 3]
      clientMock.search.mockResolvedValueOnce([
        {
          id: 1,
          version: 1,
          score: 10,
        },
      ])

      const res = await service.search(vector, 10, 0.8)

      expect(res).toEqual([
        {
          id: 1,
          version: 1,
          score: 10,
        },
      ])
      expect(clientMock.search).toHaveBeenCalledWith('document_chunks', {
        vector,
        limit: 10,
        score_threshold: 0.8,
        with_payload: true,
        with_vector: false,
      })
    })
  })

  describe('searchWithFilter', () => {
    it('should call client.search with filter', async () => {
      const vector = [1, 2, 3]
      const filter = { must: [{ key: 'documentId', match: { value: 'abc' } }] }
      clientMock.search.mockResolvedValueOnce([
        {
          id: 1,
          version: 1,
          score: 10,
        },
      ])

      const res = await service.searchWithFilter(vector, filter, 5, 0.7)

      expect(res).toEqual([
        {
          id: 1,
          version: 1,
          score: 10,
        },
      ])
      expect(clientMock.search).toHaveBeenCalledWith('document_chunks', {
        vector,
        filter,
        limit: 5,
        score_threshold: 0.7,
        with_payload: true,
        with_vector: false,
      })
    })
  })

  describe('deletePoints', () => {
    it('should call client.delete with given ids', async () => {
      await service.deletePoints(['a', 'b', 'c'])

      expect(clientMock.delete).toHaveBeenCalledWith('document_chunks', {
        wait: true,
        points: ['a', 'b', 'c'],
      })
    })
  })
})
