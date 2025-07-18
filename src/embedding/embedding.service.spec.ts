import { Test, TestingModule } from '@nestjs/testing'
import { EmbeddingService } from './embedding.service'
import { ConfigService } from '@nestjs/config'
import { HttpException, HttpStatus } from '@nestjs/common'

const mockConfigService = {
  get: jest.fn(),
  getOrThrow: jest.fn(),
}

describe('EmbeddingService', () => {
  let service: EmbeddingService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    service = module.get<EmbeddingService>(EmbeddingService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should throw if texts array is empty', async () => {
    await expect(service.generateEmbeddings([])).rejects.toThrow(
      new HttpException(
        'Lista de textos não pode estar vazia',
        HttpStatus.BAD_REQUEST
      )
    )
  })

  it('should return mocked embeddings if useMock is true', async () => {
    mockConfigService.get.mockReturnValue('true')
    mockConfigService.getOrThrow.mockReturnValue('mock-api-key')

    const mockService = new EmbeddingService(mockConfigService as any)
    const result = await mockService.generateEmbeddings(['hello', 'world'])

    expect(result.length).toBe(2)
    expect(result[0].length).toBe(1536)
  })

  it('should return a single mocked embedding if useMock is true', async () => {
    mockConfigService.get.mockReturnValue('true')
    mockConfigService.getOrThrow.mockReturnValue('mock-api-key')

    const mockService = new EmbeddingService(mockConfigService as any)
    const result = await mockService.generateSingleEmbedding('hello')

    expect(result.length).toBe(1536)
  })

  it('should throw if text is empty in generateSingleEmbedding', async () => {
    await expect(service.generateSingleEmbedding('')).rejects.toThrow(
      new HttpException('Texto vazio', HttpStatus.BAD_REQUEST)
    )
  })
})
