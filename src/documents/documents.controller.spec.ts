import { Test, TestingModule } from '@nestjs/testing'
import { DocumentsController } from './documents.controller'
import { DocumentsService } from './documents.service'
import { CreateDocumentDto } from './dtos/create-document.dto'
import { UpdateDocumentDto } from './dtos/update-document.dto'
import { SearchDocumentsQueryDto } from './dtos/search-document.dto'
import { User } from '../users/entities/user.entity'

describe('DocumentsController', () => {
  let controller: DocumentsController
  let documentsService: DocumentsService

  const mockUser: User = {
    id: 'uuid-123',
    email: 'user@example.com',
    password: '$2b$10$hashedPassword',
    roles: ['user'],
    hashPassword: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            searchDocuments: jest.fn(),
            getDocumentStats: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<DocumentsController>(DocumentsController)
    documentsService = module.get<DocumentsService>(DocumentsService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should create a document', async () => {
    const dto: CreateDocumentDto = {
      sourceName: 'Test',
      content: 'Content',
      requiredRole: 'admin',
    }
    const mockDoc = {
      id: 'uuid',
      chunks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...dto,
    }

    jest.spyOn(documentsService, 'create').mockResolvedValue(mockDoc)

    const result = await controller.create(dto)
    expect(result).toEqual({
      success: true,
      data: mockDoc,
      message: 'Documento criado com sucesso',
    })
  })

  it('should return all documents', async () => {
    const docs = [
      {
        id: '1',
        sourceName: 'source-name',
        content: 'content',
        requiredRole: 'role',
        chunks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        sourceName: 'source-name',
        content: 'content',
        requiredRole: 'role',
        chunks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    jest.spyOn(documentsService, 'findAll').mockResolvedValue(docs)

    const result = await controller.findAll({ user: mockUser })
    expect(result).toEqual({
      success: true,
      data: docs,
      count: 2,
      message: 'Documentos listados com sucesso',
    })
  })

  it('should search documents', async () => {
    const dto: SearchDocumentsQueryDto = { query: 'férias' }
    const results = [
      {
        id: '123',
        text: 'text',
        metadata: {
          documentId: 'doc-id-1',
          requiredRole: 'admin',
          sourceName: 'source-name',
        },
        score: 0.9,
        document: {
          id: 'doc-id-1',
          sourceName: 'source-name',
          requiredRole: 'admin',
        },
      },
    ]

    jest.spyOn(documentsService, 'searchDocuments').mockResolvedValue(results)

    const result = await controller.searchDocuments(dto, { user: mockUser })
    expect(result).toEqual({
      success: true,
      data: results,
      count: results.length,
      query: dto.query,
      message: 'Busca realizada com sucesso',
    })
  })

  it('should find document by id', async () => {
    const mockDoc = {
      id: 'abc',
      title: 'Doc',
      sourceName: 'source-name',
      content: 'content',
      requiredRole: 'admin',
      chunks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    jest.spyOn(documentsService, 'findOne').mockResolvedValue(mockDoc)

    const result = await controller.findOne('abc', { user: mockUser })
    expect(result).toEqual({
      success: true,
      data: mockDoc,
      message: 'Documento encontrado com sucesso',
    })
  })

  it('should return document stats', async () => {
    const stats = {
      words: 100,
      document: {
        id: 'doc-id-1',
        sourceName: 'source-name',
        requiredRole: 'admin',
        content: 'content',
        chunks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      totalChunks: 2,
      averageChunkSize: 2,
    }
    jest.spyOn(documentsService, 'getDocumentStats').mockResolvedValue(stats)

    const result = await controller.getDocumentStats('abc', { user: mockUser })
    expect(result).toEqual({
      success: true,
      data: stats,
      message: 'Estatísticas do documento obtidas com sucesso',
    })
  })

  it('should update a document', async () => {
    const dto: UpdateDocumentDto = { content: 'Atualizado' }
    const updated = {
      id: 'abc',
      chunks: [],
      sourceName: 'source-name',
      requiredRole: 'admin',
      content: 'content',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    jest.spyOn(documentsService, 'update').mockResolvedValue(updated)

    const result = await controller.update('abc', dto, { user: mockUser })
    expect(result).toEqual({
      success: true,
      data: updated,
      message: 'Documento atualizado com sucesso',
    })
  })

  it('should remove a document', async () => {
    jest.spyOn(documentsService, 'remove').mockResolvedValue(undefined)

    const result = await controller.remove('abc', { user: mockUser })
    expect(result).toEqual({
      success: true,
      message: 'Documento removido com sucesso',
    })
  })
})
