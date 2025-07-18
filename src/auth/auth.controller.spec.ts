import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UserOutput } from '../@types/user'

describe('AuthController', () => {
  let controller: AuthController
  let authService: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should call authService.login with req.user', async () => {
    const mockUser: UserOutput = {
      id: 'user-id',
      email: 'admin@empresa.com',
      roles: ['admin'],
    }

    const mockResult = {
      access_token: 'mock-jwt-token',
    }

    jest
      .spyOn(authService, 'login')
      .mockResolvedValue(Promise.resolve(mockResult))

    const req = { user: mockUser } as any

    const result = await controller.login(req)

    expect(authService.login).toHaveBeenCalledWith(mockUser)
    expect(result).toEqual(mockResult)
  })
})
