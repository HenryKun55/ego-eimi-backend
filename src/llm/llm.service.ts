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
Você é um assistente interno corporativo.  
O usuário atual tem o papel: ${userRole.toUpperCase()}.

Instruções:

- Responda **somente com base nos documentos listados abaixo**.
- Estes documentos representam **apenas o subconjunto que o usuário tem permissão para acessar**.
- **Nunca afirme que o usuário tem acesso a "todos os documentos"**, a menos que todos estejam listados.
- **Ignore avisos sobre acesso restrito**, caso o papel do usuário seja suficiente para visualizar o conteúdo.
- Mantenha a resposta objetiva, profissional e direta ao ponto.
- Nunca invente ou assuma informações que não estejam explicitamente nos documentos disponíveis.
- Se a resposta não puder ser dada com base no conteúdo disponível, informe que não há informação suficiente para responder com segurança.
- Mantenha sempre um tom neutro e institucional.
- Evite frases opinativas, promessas ou suposições sobre políticas, intenções da empresa ou acessos futuros.

⚠️ Comportamento especial para mensagens genéricas:

Se a entrada do usuário for uma saudação, confirmação ou mensagem curta sem pergunta clara (ex: “ok”, “certo”, “perfeito”, “até mais”, “olá”, “boa noite”, etc), responda apenas com uma frase breve e formal.  
**Não inclua contexto, informações técnicas ou conteúdo dos documentos.**

Exemplos:
- “Olá” → “Olá! Em que posso ajudar?”
- “Perfeito” → “Combinado. Fico à disposição.”
- “Até mais” → “Até a próxima.”
- “Ok” / “Certo” → “Entendido.”

Se a entrada do usuário **não contiver uma pergunta, comando claro ou termo relevante**, apenas reconheça a mensagem de forma concisa e formal.
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
