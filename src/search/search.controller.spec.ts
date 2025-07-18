import { Test, TestingModule } from '@nestjs/testing'
import { SearchController } from './search.controller'
import { BadRequestException } from '@nestjs/common'
import { EmbeddingService } from '../embedding/embedding.service'
import { QdrantService } from '../qdrant/qdrant.service'
import { version } from 'os'

describe('SearchController', () => {
  let controller: SearchController
  let embeddingService: EmbeddingService
  let qdrantService: QdrantService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: EmbeddingService,
          useValue: {
            generateEmbeddings: jest.fn(),
          },
        },
        {
          provide: QdrantService,
          useValue: {
            search: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<SearchController>(SearchController)
    embeddingService = module.get<EmbeddingService>(EmbeddingService)
    qdrantService = module.get<QdrantService>(QdrantService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should throw BadRequestException if text is empty', async () => {
    await expect(controller.search({ text: '   ' })).rejects.toThrow(
      BadRequestException
    )
  })

  it('should return results from qdrantService', async () => {
    const text = 'O que é política de férias?'
    const fakeVector = [0.1, 0.2, 0.3]
    const fakeResults = [
      { id: 1, payload: { text: 'Texto 1' }, score: 0.9, version: 1 },
      { id: 2, payload: { text: 'Texto 2' }, score: 0.8, version: 1 },
    ]

    jest
      .spyOn(embeddingService, 'generateEmbeddings')
      .mockResolvedValue([fakeVector])

    jest.spyOn(qdrantService, 'search').mockResolvedValue(fakeResults)

    const result = await controller.search({ text })

    expect(embeddingService.generateEmbeddings).toHaveBeenCalledWith([text])
    expect(qdrantService.search).toHaveBeenCalledWith(fakeVector, 5, 0.7)
    expect(result).toEqual({ results: fakeResults })
  })

  it('should support custom limit and scoreThreshold', async () => {
    const text = 'valores'
    const limit = 10
    const scoreThreshold = 0.5
    const vector = [0.5, 0.4, 0.3]

    jest
      .spyOn(embeddingService, 'generateEmbeddings')
      .mockResolvedValue([vector])

    jest.spyOn(qdrantService, 'search').mockResolvedValue([])

    await controller.search({ text, limit, scoreThreshold })

    expect(qdrantService.search).toHaveBeenCalledWith(
      vector,
      limit,
      scoreThreshold
    )
  })
})
