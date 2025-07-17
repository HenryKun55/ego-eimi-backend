import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class LlmService {
  private readonly apiKey: string
  private readonly model: string
  private readonly endpoint: string

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GROQ_API_KEY')
    this.model = 'llama3-8b-8192'
    this.endpoint = 'https://api.groq.com/openai/v1/chat/completions'
  }

  async askLLM(question: string, context: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content:
          'Você é um assistente que responde com base no contexto fornecido. Se não souber, diga que não sabe.',
      },
      {
        role: 'user',
        content: `Contexto:\n${context}\n\nPergunta:\n${question}`,
      },
    ]

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
      }),
    })

    const data = await response.json()
    return (
      data.choices?.[0]?.message?.content ??
      'Não foi possível obter resposta da IA.'
    )
  }
}
