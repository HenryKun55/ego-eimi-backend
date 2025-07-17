import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OPEN_API } from 'src/embedding/embedding.schema'

@Injectable()
export class LlmService {
  constructor(private readonly configService: ConfigService) {}

  async askLLM(question: string, context: string): Promise<string> {
    const url = 'https://api.groq.com/openai/v1/chat/completions'
    const apiKey = this.configService.get<string>('OPEN_API_KEY')

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content:
                'Você é um assistente útil que responde com base no contexto.',
            },
            {
              role: 'user',
              content: `${question}\n\nContexto:\n${context}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 1024,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('[LLM ERRO]', res.status, errorText)
        throw new HttpException(
          `Erro da API da LLM: ${res.statusText}`,
          res.status as HttpStatus
        )
      }

      const data = await res.json()
      return data.choices?.[0]?.message?.content ?? 'Erro ao gerar resposta.'
    } catch (error) {
      throw new HttpException(
        'Erro ao gerar resposta: ' + error,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
