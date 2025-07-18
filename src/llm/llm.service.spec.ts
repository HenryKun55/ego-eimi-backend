import { ConfigService } from '@nestjs/config'
import { LlmService } from './llm.service'
import {
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'

global.fetch = jest.fn()

describe('LlmService', () => {
  let service: LlmService
  let configService: ConfigService

  const silenceNestLogger = () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {})
  }

  beforeEach(() => {
    configService = {
      get: jest.fn((key) => {
        if (key === 'OPEN_API_KEY') return 'test-key'
        return null
      }),
    } as any

    silenceNestLogger()

    service = new LlmService(configService)
    jest.clearAllMocks()
  })

  it('should call the LLM API and return the response content', async () => {
    const mockContent = 'Esta é a resposta da LLM.'
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: mockContent } }],
      }),
    })

    const result = await service.askLLM(
      'Qual a capital da França?',
      'Paris é a capital da França.'
    )
    expect(result).toBe(mockContent)

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat/completions'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        }),
        body: expect.any(String),
      })
    )
  })

  it('should throw if OPEN_API_KEY is missing', async () => {
    const brokenService = new LlmService({
      get: jest.fn().mockReturnValue(undefined),
    } as any)

    await expect(brokenService.askLLM('pergunta', 'contexto')).rejects.toThrow(
      InternalServerErrorException
    )
  })

  it('should throw BadGatewayException if response is not ok', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      text: async () => 'Erro do modelo',
    })

    await expect(service.askLLM('falha', 'falha')).rejects.toThrow(
      HttpException
    )
  })

  it('should throw HttpException if fetch throws error', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Falha de rede'))

    await expect(service.askLLM('falhou', 'rede')).rejects.toThrow(
      HttpException
    )
  })
})
