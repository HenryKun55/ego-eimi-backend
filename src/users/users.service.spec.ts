import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { Repository } from 'typeorm'
import { ConflictException } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'

const createUserDto: CreateUserDto = {
  email: 'test@example.com',
  password: 'hashed-password',
  roles: ['admin'],
}

const userEntity = {
  id: 1,
  ...createUserDto,
}

describe('UsersService', () => {
  let service: UsersService
  let usersRepository: Partial<Repository<User>>

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a new user if email is not in use', async () => {
      ;(usersRepository.findOne as jest.Mock).mockResolvedValue(undefined)
      ;(usersRepository.create as jest.Mock).mockReturnValue(userEntity)
      ;(usersRepository.save as jest.Mock).mockResolvedValue(userEntity)

      const result = await service.create(createUserDto)

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      })
      expect(usersRepository.create).toHaveBeenCalledWith(createUserDto)
      expect(usersRepository.save).toHaveBeenCalledWith(userEntity)
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        roles: ['admin'],
      })
    })

    it('should throw ConflictException if email already exists', async () => {
      ;(usersRepository.findOne as jest.Mock).mockResolvedValue(userEntity)

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException
      )

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      })
      expect(usersRepository.create).not.toHaveBeenCalled()
      expect(usersRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('findByEmail', () => {
    it('should return user if email is found', async () => {
      ;(usersRepository.findOne as jest.Mock).mockResolvedValue(userEntity)

      const result = await service.findByEmail('test@example.com')

      expect(result).toEqual(userEntity)
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })

    it('should return undefined if email is not found', async () => {
      ;(usersRepository.findOne as jest.Mock).mockResolvedValue(undefined)

      const result = await service.findByEmail('notfound@example.com')

      expect(result).toBeUndefined()
    })
  })
})
