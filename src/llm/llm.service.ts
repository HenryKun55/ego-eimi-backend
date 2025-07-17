import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class LlmService {
  constructor(private readonly configService: ConfigService) {}

  async askLLM(question: string, context: string): Promise<string> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY')

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
        model: 'mixtral-8x7b-32768',
        temperature: 0.2,
        max_tokens: 1024,
      }),
    })

    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? 'Erro ao gerar resposta.'
  }
}
