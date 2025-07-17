import { Controller, Post } from '@nestjs/common'
import { DocumentsService } from 'src/documents/documents.service'
import { UsersService } from 'src/users/users.service'
import { Logger } from '@nestjs/common'

@Controller('seed')
export class SeedController {
  private readonly logger = new Logger(SeedController.name)

  constructor(
    private readonly usersService: UsersService,
    private readonly documentsService: DocumentsService
  ) {}

  @Post()
  async seed() {
    const users = [
      { email: 'admin@empresa.com', password: '123456', roles: ['admin'] },
      {
        email: 'henrique@empresa.com',
        password: '123456',
        roles: ['employee'],
      },
      { email: 'felipe@empresa.com', password: '123456', roles: ['employee'] },
    ]

    for (const user of users) {
      await this.usersService.create(user)
    }

    const docs = [
      {
        sourceName: 'Política de Férias',
        content: `
Todo funcionário tem direito a 30 dias de férias por ano. 
O período pode ser dividido em até três partes, sendo uma delas com no mínimo 14 dias consecutivos.`,
        requiredRole: 'employee',
      },
      {
        sourceName: 'Benefícios da Empresa',
        content: `
A empresa oferece vale-alimentação, plano de saúde e auxílio home office. 
Esses benefícios são válidos a partir do primeiro mês de contratação.`,
        requiredRole: 'employee',
      },
    ]

    for (const doc of docs) {
      await this.documentsService.createWithChunksAndEmbedding(doc)
    }

    this.logger.log('Seed realizado com sucesso')
    return { message: 'Seed realizado com sucesso' }
  }
}
