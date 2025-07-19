import { Test, TestingModule } from '@nestjs/testing'
import { DocumentCreatorService } from './document-creator.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Document } from './entities/document.entity'
import { Repository } from 'typeorm'
import { CreateDocumentDto } from './dtos/create-document.dto'
import { DocumentsChunkService } from '../documents-chunk/documents-chunk.service'

describe('DocumentCreatorService', () => {
  let service: DocumentCreatorService
  let repo: Repository<Document>

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
  }

  const mockDto: CreateDocumentDto = {
    content: 'Lorem ipsum',
    requiredRole: 'admin',
    sourceName: 'test-source',
    metadata: { test: 'meta' },
  }

  const mockDocument: Document = {
    id: 'doc-123',
    content: mockDto.content,
    requiredRole: mockDto.requiredRole,
    sourceName: mockDto.sourceName,
    chunks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentCreatorService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockRepo,
        },
        {
          provide: DocumentsChunkService,
          useValue: {
            chunkAndIndex: jest.fn().mockResolvedValue({
              failedChunks: 0,
              indexedChunks: 1,
              processingTime: 10,
              totalChunks: 1,
            }),
          },
        },
      ],
    }).compile()

    service = module.get(DocumentCreatorService)
    repo = module.get(getRepositoryToken(Document))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create and save a document', async () => {
    mockRepo.create.mockReturnValue(mockDocument)
    mockRepo.save.mockResolvedValue(mockDocument)

    const result = await service.execute(mockDto)

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        content: mockDto.content,
        requiredRole: mockDto.requiredRole,
        sourceName: mockDto.sourceName,
      })
    )
    expect(mockRepo.save).toHaveBeenCalledWith(mockDocument)
    expect(result).toEqual(mockDocument)
  })
})
