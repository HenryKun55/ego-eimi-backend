import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'

describe('UsersController', () => {
  let controller: UsersController
  let usersService: UsersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<UsersController>(UsersController)
    usersService = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should call usersService.create with dto', async () => {
    const dto: CreateUserDto = {
      email: 'test@empresa.com',
      password: '123456',
      roles: ['admin'],
    }

    const mockResult = {
      id: 'user-id',
      ...dto,
    }

    jest.spyOn(usersService, 'create').mockResolvedValue(mockResult)

    const result = await controller.create(dto)

    expect(usersService.create).toHaveBeenCalledWith(dto)
    expect(result).toEqual(mockResult)
  })
})
