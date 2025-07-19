import { Test, TestingModule } from '@nestjs/testing'
import { AskController } from './ask.controller'
import { BadRequestException } from '@nestjs/common'
import { SearchService } from '../search/search.service'
import { LlmService } from '../llm/llm.service'
import { AskRequestDto } from './dtos/ask.dto'

describe('AskController', () => {
  let controller: AskController
  let searchService: SearchService
  let llmService: LlmService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AskController],
      providers: [
        {
          provide: SearchService,
          useValue: {
            searchChunks: jest.fn(),
          },
        },
        {
          provide: LlmService,
          useValue: {
            askLLM: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<AskController>(AskController)
    searchService = module.get<SearchService>(SearchService)
    llmService = module.get<LlmService>(LlmService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should throw BadRequestException if question is empty', async () => {
    const dto: AskRequestDto = { question: '   ' }
    const req: any = { user: { email: 'user@example.com', roles: [] } }

    await expect(controller.ask(dto, req)).rejects.toThrow(BadRequestException)
  })

  it('should return fallback message if no chunks found', async () => {
    const dto: AskRequestDto = { question: 'Qual o benefício?' }
    const req: any = {
      user: { email: 'user@example.com', roles: ['employee'] },
    }

    jest.spyOn(searchService, 'searchChunks').mockResolvedValue([])

    const result = await controller.ask(dto, req)

    expect(searchService.searchChunks).toHaveBeenCalledWith(
      dto.question,
      req.user
    )
    expect(result).toEqual({
      success: true,
      answer: 'Nenhum conteúdo relevante encontrado.',
      data: [],
      message: 'Sem resultados relevantes',
    })
  })

  it('should return answer and chunks from llmService', async () => {
    const dto: AskRequestDto = { question: 'Qual o benefício?' }
    const req: any = {
      user: { email: 'user@example.com', roles: ['employee'] },
    }

    const chunks = [
      {
        content: 'A empresa oferece vale-alimentação.',
        sourceName: 'Benefícios',
        requiredRole: 'employee',
        metadata: {
          text: 'teste',
          documentId: 'doc-id-1',
          requiredRole: 'employee',
        },

        score: 1,
      },
      {
        content: 'Plano de saúde incluso.',
        sourceName: 'Benefícios',
        requiredRole: 'employee',
        metadata: {
          text: 'teste',
          documentId: 'doc-id-2',
          requiredRole: 'employee',
        },
        score: 1,
      },
    ]

    const answer = 'A empresa oferece vale-alimentação e plano de saúde.'

    jest.spyOn(searchService, 'searchChunks').mockResolvedValue(chunks)
    jest.spyOn(llmService, 'askLLM').mockResolvedValue(answer)

    const result = await controller.ask(dto, req)

    expect(llmService.askLLM).toHaveBeenCalledWith(
      dto.question,
      expect.stringContaining('vale-alimentação'),
      'employee'
    )

    expect(result).toEqual({
      success: true,
      data: { answer, chunks },
      message: 'Resposta gerada com sucesso',
    })
  })
})
