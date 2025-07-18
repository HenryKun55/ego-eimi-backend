import { Test, type TestingModule } from '@nestjs/testing'
import { DocumentsController } from './documents.controller'
import { DocumentsService } from './documents.service'

describe('DocumentsController', () => {
  let controller: DocumentsController

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
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
