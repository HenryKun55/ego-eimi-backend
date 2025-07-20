import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Logger,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { LlmService } from '../llm/llm.service'
import { SearchService } from '../search/search.service'
import { Request as ExpressRequest } from 'express'
import { LocalStrategyUserOutput } from '../auth/@types/user'
import { AskRequestDto } from './dtos/ask.dto'

@UseGuards(JwtAuthGuard)
@Controller('ask')
export class AskController {
  private readonly logger = new Logger(AskController.name)

  constructor(
    private readonly searchService: SearchService,
    private readonly llmService: LlmService
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async ask(
    @Body() body: AskRequestDto,
    @Req() req: ExpressRequest & { user: LocalStrategyUserOutput }
  ) {
    const user = req.user
    const question = body.question?.trim()

    if (!question) {
      throw new BadRequestException('A pergunta não pode estar vazia.')
    }

    this.logger.log(`Pergunta recebida de ${user.email}: "${question}"`)

    const chunks = await this.searchService.searchChunks(question, user)

    if (!chunks.length) {
      this.logger.warn(`Nenhum chunk encontrado para ${user.email}`)
      return {
        success: true,
        answer: 'Nenhum conteúdo relevante encontrado.',
        data: [],
        message: 'Sem resultados relevantes',
      }
    }

    const userRole = user.roles?.[0] ?? 'unknown'
    const context = this.buildContext(chunks, userRole)
    const answer = await this.llmService.askLLM(question, context, userRole)

    this.logger.log(`Resposta gerada: ${answer.slice(0, 80)}...`)

    return {
      success: true,
      data: { answer, chunks },
      message: 'Resposta gerada com sucesso',
    }
  }

  private buildContext(
    chunks: { content: string; sourceName?: string; requiredRole?: string }[],
    userRole: string
  ): string {
    const roleHierarchy = ['viewer', 'employee', 'admin']
    const userLevel = roleHierarchy.indexOf(userRole)

    return chunks
      .filter((chunk) => {
        const chunkRole = chunk.requiredRole ?? 'viewer'
        const chunkLevel = roleHierarchy.indexOf(chunkRole)
        return userLevel >= chunkLevel
      })
      .map((chunk) => {
        const source = chunk.sourceName || 'Fonte desconhecida'
        const required = chunk.requiredRole || 'desconhecido'
        return `### Fonte: ${source}\n(Requer: ${required} | Usuário: ${userRole}) ✅ Acesso concedido\n${chunk.content.trim()}`
      })
      .join('\n---\n')
      .slice(0, 12000)
  }
}
