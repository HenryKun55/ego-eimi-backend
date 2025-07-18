import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { LlmService } from 'src/llm/llm.service'
import { SearchService } from 'src/search/search.service'
import { Request as ExpressRequest } from 'express'
import { LocalStrategyUserOutput } from 'src/auth/@types/user'
import { AskRequestDto } from './dtos/ask.dto'

@Controller('ask')
export class AskController {
  private readonly logger = new Logger(AskController.name)

  constructor(
    private readonly searchService: SearchService,
    private readonly llmService: LlmService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
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

    const context = this.buildContext(chunks)

    const answer = await this.llmService.askLLM(question, context)

    this.logger.log(`Resposta gerada: ${answer.slice(0, 80)}...`)

    return {
      success: true,
      data: { answer },
      message: 'Resposta gerada com sucesso',
    }
  }

  private buildContext(chunks: { content: string }[]): string {
    return chunks
      .map((chunk) => chunk.content.trim())
      .join('\n---\n')
      .slice(0, 12000)
  }
}
