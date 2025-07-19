import { Test, TestingModule } from '@nestjs/testing'
import { DocumentsService } from './documents.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Document } from './entities/document.entity'
import { DocumentChunk } from '../documents-chunk/entities/document-chunk.entity'
import { DocumentCreatorService } from './document-creator.service'
import { DocumentUpdaterService } from './document-updater.service'
import { DocumentSearchService } from './document-search.service'
import { DocumentsChunkService } from '../documents-chunk/documents-chunk.service'
import { HttpException, Logger } from '@nestjs/common'

describe('DocumentsService', () => {
  let service: DocumentsService
  let creatorService: DocumentCreatorService
  let updaterService: DocumentUpdaterService
  let chunkService: DocumentsChunkService
  let searchService: DocumentSearchService
  let documentRepo: jest.Mocked<Repository<Document>>
  let chunkRepo: jest.Mocked<Repository<DocumentChunk>>

  const mockDocument = {
    id: 'doc-id-1',
    content: 'Lorem ipsum',
    requiredRole: 'user',
    sourceName: 'source-1',
    metadata: { key: 'value' },
    chunks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Document

  const queryBuilder: any = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useValue: {
            createQueryBuilder: jest.fn(() => queryBuilder),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DocumentChunk),
          useValue: {
            createQueryBuilder: jest.fn(() => queryBuilder),
          },
        },
        {
          provide: DocumentCreatorService,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DocumentUpdaterService,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DocumentSearchService,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DocumentsChunkService,
          useValue: {
            chunkAndIndex: jest.fn(),
            removeDocumentChunks: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get(DocumentsService)
    creatorService = module.get(DocumentCreatorService)
    updaterService = module.get(DocumentUpdaterService)
    chunkService = module.get(DocumentsChunkService)
    searchService = module.get(DocumentSearchService)
    documentRepo = module.get(getRepositoryToken(Document))
    chunkRepo = module.get(getRepositoryToken(DocumentChunk))

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should call creatorService.execute', async () => {
      jest.spyOn(creatorService, 'execute').mockResolvedValue(mockDocument)
      const result = await service.create(mockDocument as any)
      expect(result).toEqual(mockDocument)
    })
  })

  describe('createWithChunksAndEmbedding', () => {
    it('should create document and index chunks', async () => {
      jest.spyOn(creatorService, 'execute').mockResolvedValue(mockDocument)
      jest.spyOn(chunkService, 'chunkAndIndex').mockResolvedValue({
        failedChunks: 0,
        indexedChunks: 1,
        processingTime: 10,
        totalChunks: 1,
      })

      const result = await service.createWithChunksAndEmbedding({
        ...mockDocument,
        chunkingOptions: {},
        indexingOptions: {},
      })

      expect(result).toEqual(mockDocument)
      expect(chunkService.chunkAndIndex).toHaveBeenCalled()
    })

    it('should throw error if chunking fails', async () => {
      jest.spyOn(creatorService, 'execute').mockResolvedValue(mockDocument)
      jest
        .spyOn(chunkService, 'chunkAndIndex')
        .mockRejectedValue(new Error('fail'))

      await expect(
        service.createWithChunksAndEmbedding({
          ...mockDocument,
          chunkingOptions: {},
          indexingOptions: {},
        })
      ).rejects.toThrow('Erro ao indexar documento')
    })
  })

  describe('findAll', () => {
    it('should return [] if no roles', async () => {
      const result = await service.findAll(undefined)
      expect(result).toEqual([])
    })

    it('should return documents if roles exist', async () => {
      queryBuilder.getMany.mockResolvedValue([mockDocument])
      const result = await service.findAll(['user'])
      expect(result).toEqual([mockDocument])
    })
  })

  describe('findOne', () => {
    it('should return document by id and roles', async () => {
      queryBuilder.getOne.mockResolvedValue(mockDocument)
      const result = await service.findOne('doc-id-1', ['user'])
      expect(result).toEqual(mockDocument)
    })

    it('should throw 404 if not found', async () => {
      queryBuilder.getOne.mockResolvedValue(null)
      await expect(service.findOne('fail-id', ['user'])).rejects.toThrow(
        HttpException
      )
    })
  })

  describe('update', () => {
    it('should update document using updater service', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument)
      jest
        .spyOn(updaterService, 'execute')
        .mockResolvedValue({ ...mockDocument, content: 'updated' })

      const result = await service.update('doc-id-1', { content: 'updated' }, [
        'user',
      ])

      expect(result.content).toBe('updated')
    })
  })

  describe('remove', () => {
    it('should remove document and chunks', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument)
      jest
        .spyOn(documentRepo, 'delete')
        .mockResolvedValue({ affected: 1 } as any)

      await service.remove('doc-id-1', ['user'])

      expect(chunkService.removeDocumentChunks).toHaveBeenCalledWith('doc-id-1')
    })

    it('should throw if not deleted', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument)
      jest
        .spyOn(documentRepo, 'delete')
        .mockResolvedValue({ affected: 0 } as any)

      await expect(service.remove('doc-id-1', ['user'])).rejects.toThrow(
        'Nenhum documento removido'
      )
    })
  })

  describe('searchDocuments', () => {
    it('should call searchService.execute', async () => {
      const fakeResult = [{ document: mockDocument, score: 1 }]
      jest.spyOn(searchService, 'execute').mockResolvedValue(fakeResult as any)

      const result = await service.searchDocuments('query', ['user'])

      expect(result).toEqual(fakeResult)
      expect(searchService.execute).toHaveBeenCalled()
    })
  })

  describe('getDocumentStats', () => {
    it('should return chunk stats', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument)
      queryBuilder.getRawOne.mockResolvedValue({ total: '2', average: '100' })

      const result = await service.getDocumentStats('doc-id-1', ['user'])

      expect(result.totalChunks).toBe(2)
      expect(result.averageChunkSize).toBe(100)
    })
  })
})
