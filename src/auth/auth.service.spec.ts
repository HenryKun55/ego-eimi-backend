import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { User } from '../users/entities/user.entity'

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}))

describe('AuthService', () => {
  let service: AuthService
  let usersService: UsersService
  let jwtService: JwtService

  const mockUser: User = {
    id: 'uuid-123',
    email: 'user@example.com',
    password: '$2b$10$hashedPassword',
    roles: ['user'],
    hashPassword: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked-jwt-token'),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    usersService = module.get<UsersService>(UsersService)
    jwtService = module.get<JwtService>(JwtService)
  })

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await service.validateUser(mockUser.email, 'password123')

      expect(result).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
      })
    })

    it('should return null if user not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(undefined)

      const result = await service.validateUser('none@x.com', 'xxx')
      expect(result).toBeNull()
    })

    it('should return null if password is invalid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const result = await service.validateUser(mockUser.email, 'wrongpass')
      expect(result).toBeNull()
    })
  })

  describe('login', () => {
    it('should return a signed jwt token', async () => {
      const payload = {
        id: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
      }

      const result = await service.login(payload)

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: payload.id,
        email: payload.email,
        roles: payload.roles,
      })
      expect(result).toEqual({ access_token: 'mocked-jwt-token' })
    })
  })
})
