import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { UserOutput } from 'src/@types/user'

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Usuário já existe' })
  create(@Body() createUserDto: CreateUserDto): Promise<UserOutput> {
    return this.usersService.create(createUserDto)
  }
}
