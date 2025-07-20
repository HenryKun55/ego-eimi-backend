import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  BadGatewayException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  LLM_API_URL,
  COMPLETIONS_ENDPOINT,
  DEFAULT_LLM_MODEL,
} from './llm.constants'

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name)

  constructor(private readonly configService: ConfigService) {}

  async askLLM(
    question: string,
    context: string,
    userRole: string
  ): Promise<string> {
    const url = `${LLM_API_URL}${COMPLETIONS_ENDPOINT}`
    const apiKey = this.configService.get<string>('OPEN_API_KEY')

    if (!apiKey) {
      this.logger.error('OPEN_API_KEY não encontrada no ambiente')
      throw new InternalServerErrorException('API key ausente')
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEFAULT_LLM_MODEL,
          messages: [
            {
              role: 'system',
              content: `
Você é um assistente interno.
O usuário atual tem o papel: ${userRole.toUpperCase()}.

Atenção:
- Os documentos abaixo representam apenas o subconjunto que este usuário tem permissão para acessar.
- Outros documentos existem, mas **não estão incluídos no contexto** por restrição de acesso.
- Nunca diga que o usuário tem acesso a "todos os documentos", a menos que todos estejam listados no contexto.
- Responda **somente com base nos documentos abaixo**.
- Ignore frases como "acesso restrito" caso o papel do usuário seja suficiente.
            `.trim(),
            },
            {
              role: 'user',
              content: `Pergunta: ${question}\n\nContexto:\n${context}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 1024,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        this.logger.error(`Erro da LLM para pergunta: "${question}"`, errorText)
        throw new BadGatewayException(`Erro da LLM: ${res.statusText}`)
      }

      const data = await res.json()
      return data.choices?.[0]?.message?.content ?? 'Erro ao gerar resposta.'
    } catch (error) {
      this.logger.error(`Erro ao consultar LLM`, error)
      throw new HttpException(
        'Erro ao gerar resposta via LLM',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
