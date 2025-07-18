import { Test, TestingModule } from '@nestjs/testing'
import { SeedController } from './seed.controller'
import { UsersService } from '../users/users.service'
import { DocumentsService } from '../documents/documents.service'

describe('SeedController', () => {
  let controller: SeedController
  let usersService: UsersService
  let documentsService: DocumentsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeedController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: DocumentsService,
          useValue: {
            createWithChunksAndEmbedding: jest.fn(),
            findBySourceName: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<SeedController>(SeedController)
    usersService = module.get<UsersService>(UsersService)
    documentsService = module.get<DocumentsService>(DocumentsService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should call usersService.create and documentsService.createWithChunksAndEmbedding', async () => {
    const createUserMock = jest
      .spyOn(usersService, 'create')
      .mockResolvedValue({} as any)
    const createDocMock = jest
      .spyOn(documentsService, 'createWithChunksAndEmbedding')
      .mockResolvedValue({} as any)

    const result = await controller.seed()

    expect(createUserMock).toHaveBeenCalledTimes(4)
    expect(createDocMock).toHaveBeenCalledTimes(7)
    expect(result).toEqual({
      message: 'Seed realizado com sucesso',
      documents: 7,
      users: 4,
    })
  })
})
