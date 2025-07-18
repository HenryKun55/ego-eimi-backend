import { Test, TestingModule } from '@nestjs/testing'
import { DocumentUpdaterService } from './document-updater.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Document } from './entities/document.entity'
import { DocumentsChunkService } from '../documents-chunk/documents-chunk.service'
import { Repository } from 'typeorm'
import { UpdateDocumentDto } from './dtos/update-document.dto'
import { Logger } from '@nestjs/common'

describe('DocumentUpdaterService', () => {
  let service: DocumentUpdaterService
  let repo: Repository<Document>
  let chunkService: DocumentsChunkService

  const mockDocument = {
    id: 'doc-id-1',
    content: 'Original content',
    requiredRole: 'user',
    sourceName: 'source-1',
    metadata: { key: 'value' },
    chunks: [],
  } as Document

  const updatedDocument = { ...mockDocument, content: 'New content' }

  const mockRepo = {
    update: jest.fn(),
    findOneBy: jest.fn(),
  }

  const mockChunkService = {
    removeDocumentChunks: jest.fn(),
    chunkAndIndex: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentUpdaterService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockRepo,
        },
        {
          provide: DocumentsChunkService,
          useValue: mockChunkService,
        },
      ],
    }).compile()

    service = module.get(DocumentUpdaterService)
    repo = module.get(getRepositoryToken(Document))
    chunkService = module.get(DocumentsChunkService)

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should update document metadata only', async () => {
    const dto: UpdateDocumentDto = {
      sourceName: 'updated-source',
    }

    mockRepo.findOneBy.mockResolvedValue({ ...mockDocument, ...dto })

    const result = await service.execute('doc-id-1', dto, mockDocument)

    expect(mockRepo.update).toHaveBeenCalledWith('doc-id-1', {
      sourceName: 'updated-source',
    })
    expect(chunkService.removeDocumentChunks).not.toHaveBeenCalled()
    expect(chunkService.chunkAndIndex).not.toHaveBeenCalled()
    expect(result.sourceName).toBe('updated-source')
  })

  it('should reprocess chunks if content changed', async () => {
    const dto: UpdateDocumentDto = {
      content: 'New content',
      chunkingOptions: {},
      indexingOptions: {},
    }

    mockRepo.findOneBy.mockResolvedValue(updatedDocument)

    const result = await service.execute('doc-id-1', dto, mockDocument)

    expect(chunkService.removeDocumentChunks).toHaveBeenCalledWith('doc-id-1')
    expect(chunkService.chunkAndIndex).toHaveBeenCalledWith(
      'New content',
      'doc-id-1',
      {},
      {
        metadata: {
          documentId: 'doc-id-1',
          sourceName: mockDocument.sourceName,
          requiredRole: mockDocument.requiredRole,
        },
      }
    )
    expect(result.content).toBe('New content')
  })

  it('should throw if updated document is not found', async () => {
    mockRepo.findOneBy.mockResolvedValue(null)

    await expect(service.execute('doc-id-1', {}, mockDocument)).rejects.toThrow(
      'Erro ao atualizar documento'
    )
  })

  it('should throw if update process fails', async () => {
    mockRepo.update.mockRejectedValue(new Error('fail'))

    await expect(
      service.execute('doc-id-1', { sourceName: 'x' }, mockDocument)
    ).rejects.toThrow('Erro ao atualizar documento')
  })
})
