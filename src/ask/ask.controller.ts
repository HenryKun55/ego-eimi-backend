import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { LlmService } from 'src/llm/llm.service'
import { SearchService } from 'src/search/search.service'
import { Request as ExpressRequest } from 'express'
import { LocalStrategyUserOutput } from 'src/auth/@types/user'

type AskRequest = {
  question: string
}

@Controller('ask')
export class AskController {
  constructor(
    private readonly searchService: SearchService,
    private readonly llmService: LlmService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async ask(
    @Body() body: AskRequest,
    @Req() req: ExpressRequest & { user: LocalStrategyUserOutput }
  ) {
    const user = req.user
    const question = body.question

    const chunks = await this.searchService.searchChunks(question, user)

    if (!chunks.length) {
      return { answer: 'Nenhum conteúdo relevante encontrado.' }
    }

    const context = chunks
      .map((chunk) => chunk.content)
      .join('\n---\n')
      .slice(0, 12000) // limitar tamanho

    const answer = await this.llmService.askLLM(question, context)

    return { answer }
  }
}
