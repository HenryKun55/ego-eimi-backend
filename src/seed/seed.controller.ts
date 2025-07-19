import { Controller, Post, Logger } from '@nestjs/common'
import { DocumentsService } from '../documents/documents.service'
import { UsersService } from '../users/users.service'

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
      { email: 'viewer@empresa.com', password: '123456', roles: ['viewer'] },
    ]

    for (const user of users) {
      const existing = await this.usersService.findByEmail(user.email)
      if (!existing) {
        try {
          await this.usersService.create(user)
        } catch (error: any) {
          if (error.code === '23505') {
            this.logger.warn(`Usuário ${user.email} já existe. Ignorando...`)
          } else {
            throw error
          }
        }
      } else {
        this.logger.log(`Usuário ${user.email} já existe. Ignorando...`)
      }
    }

    const docs = [
      {
        sourceName: 'Guia do Funcionário',
        content: `Este documento ensina como usar o sistema interno, abrir chamados e consultar benefícios. Somente colaboradores devem acessar.`,
        requiredRole: 'employee',
      },
      {
        sourceName: 'Política de Férias',
        content: `Todo funcionário tem direito a 30 dias de férias por ano. O período pode ser dividido em até três partes, sendo uma delas com no mínimo 14 dias consecutivos.`,
        requiredRole: 'employee',
      },
      {
        sourceName: 'Benefícios da Empresa',
        content: `A empresa oferece vale-alimentação, plano de saúde e auxílio home office. Esses benefícios são válidos a partir do primeiro mês de contratação.`,
        requiredRole: 'employee',
      },
      {
        sourceName: 'Relatório Financeiro 2025',
        content: `O lucro líquido projetado para 2025 é de R$ 5,2 milhões. Acesso restrito a administradores.`,
        requiredRole: 'admin',
      },
      {
        sourceName: 'Plano Estratégico Interno',
        content: `Contém metas internas e confidenciais da empresa para os próximos 3 anos. Apenas o setor administrativo tem acesso.`,
        requiredRole: 'admin',
      },
      {
        sourceName: 'Manual de Boas-vindas',
        content: `Bem-vindo à empresa! Este manual apresenta os valores, a cultura e os primeiros passos para todos os novos integrantes.`,
        requiredRole: 'viewer',
      },
      {
        sourceName: 'Calendário Institucional',
        content: `Feriados, eventos e datas comemorativas da empresa estão disponíveis neste calendário. Acesso livre a todos.`,
        requiredRole: 'viewer',
      },
    ]

    this.logger.log(`🚀 Iniciando seed com ${docs.length} documentos...`)

    for (const doc of docs) {
      this.logger.log(`🔎 Verificando documento: "${doc.sourceName}"`)

      const existing = await this.documentsService.findBySourceName(
        doc.sourceName
      )

      if (existing) {
        await this.documentsService.remove(existing.id)
        this.logger.warn(
          `🗑 Documento "${doc.sourceName}" já existia — removido.`
        )
      }

      const created =
        await this.documentsService.createWithChunksAndEmbedding(doc)

      this.logger.log(
        `✅ Documento "${doc.sourceName}" criado com sucesso (ID: ${created.id})`
      )
    }

    this.logger.log('🎉 Seed realizado com sucesso!')
    return {
      message: 'Seed realizado com sucesso',
      documents: docs.length,
      users: users.length,
    }
  }
}
