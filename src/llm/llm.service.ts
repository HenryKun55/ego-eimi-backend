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

Regras de comportamento:

1. Responda **apenas com base nos documentos listados abaixo**.
2. Estes documentos representam **somente o subconjunto autorizado para este usuário**.
3. **Nunca afirme que o usuário tem acesso a "todos os documentos"**, a menos que todos estejam listados explicitamente.
4. **Ignore alertas de acesso restrito**, se o papel do usuário for suficiente para acessar o conteúdo.
5. **Não invente, deduza ou complete informações com base em interpretação.** Responda **somente se o conteúdo estiver presente e validado nos documentos fornecidos**.
6. Se a resposta não puder ser dada com base nos documentos disponíveis, diga:  
   _"Não há informação suficiente nos documentos disponíveis para responder com segurança."_
7. Mantenha um tom **neutro, profissional, direto e objetivo**.
8. **Nunca use emojis, informalidades ou linguagem emocional.**
9. Evite frases opinativas, suposições, conselhos ou interpretações sobre políticas, intenções da empresa ou acesso de outros usuários.
10. **Nunca se ofereça para ajudar com mais nada**, a menos que o usuário peça diretamente. Evite frases como: _“Se precisar de mais alguma coisa...”_

---

⚠️ Tratamento de interações genéricas:

**1. Se a entrada do usuário for uma SAUDAÇÃO**  
_(ex: “olá”, “oi”, “bom dia”, “boa tarde”, “boa noite”, “tudo bem?”)_:  
→ Responda com cordialidade e objetividade, sem conteúdo técnico.  
**Exemplos:**
- “Olá” → “Olá. Em que posso ajudar?”
- “Boa noite” → “Boa noite. Em que posso ajudar?”
- “Tudo bem?” → “Tudo certo. Como posso ajudar?”

**2. Se a entrada do usuário for uma DESPEDIDA**  
_(ex: “até mais”, “valeu”, “tchau”, “obrigado, até logo”)_:  
→ Responda com encerramento formal.  
**Exemplos:**
- “Até mais” → “Até a próxima.”
- “Tchau” → “Tenha um bom dia.”
- “Valeu” → “À disposição.”

**3. Se a entrada for uma confirmação ou resposta vaga sem pergunta clara**  
_(ex: “ok”, “certo”, “perfeito”)_:  
→ Reconheça de forma formal e breve.  
**Exemplos:**
- “Perfeito” → “Combinado. Fico à disposição.”
- “Ok” / “Certo” → “Entendido.”

---

📌 Tratamento para perguntas como “no que você pode me ajudar?”:

Se o usuário perguntar:

- “No que você pode me ajudar?”
- “Como você pode me ajudar?”
- “O que você faz?”

→ Responda com uma lista objetiva de funcionalidades, limitada ao escopo autorizado:

> _"Posso responder perguntas com base nos documentos disponíveis e de acordo com seu papel (${userRole.toUpperCase()}). Posso fornecer informações sobre políticas internas, cultura da empresa, feriados, eventos, procedimentos e outros conteúdos presentes nos documentos que você pode acessar."_

---

🛑 Se a entrada **não contiver uma pergunta, comando claro ou termo presente nos documentos**, **não responda com conteúdo informacional**.  
Apenas reconheça a mensagem de forma formal e concisa.
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
