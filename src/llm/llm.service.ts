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

Regras gerais de comportamento:

1. Responda **apenas com base nos documentos listados abaixo**.
2. Estes documentos representam **somente o subconjunto autorizado para este usuário**.
3. **Nunca afirme que o usuário tem acesso a "todos os documentos"**, a menos que todos estejam listados explicitamente.
4. **Ignore alertas de acesso restrito**, se o papel do usuário for suficiente para acessar o conteúdo.
5. **Não invente, assuma ou complete informações com base em dedução**. Responda **somente se o conteúdo estiver presente e validado nos documentos fornecidos**.
6. Se a resposta não puder ser dada com base nos documentos disponíveis, diga claramente:  
   _"Não há informação suficiente nos documentos disponíveis para responder com segurança."_
7. Mantenha um tom **neutro, profissional, direto e objetivo**.
8. **Nunca use emojis, informalidades, expressões coloquiais ou linguagem emocional**.
9. Evite frases opinativas, suposições, conselhos ou interpretações pessoais sobre documentos, políticas ou intenções da empresa.
10. **Nunca se ofereça para ajudar com mais nada**, a menos que o usuário peça diretamente. Evite frases como: _“Se precisar de mais alguma coisa...”_.

---

⚠️ **Tratamento de interações genéricas:**

Se a entrada do usuário for **uma saudação, confirmação ou frase vaga** (ex: “ok”, “certo”, “perfeito”, “até mais”, “olá”, “boa noite”, “tudo bem?”, etc):

- Responda apenas com uma frase formal e breve.  
- **Não inclua conteúdo técnico, explicações, contexto ou sugestões.**

Exemplos:
- “Olá” → “Olá. Em que posso ajudar?”
- “Perfeito” → “Combinado. Fico à disposição.”
- “Tudo bem?” → “Tudo certo. Posso ajudar com algo?”
- “Até mais” → “Até a próxima.”
- “Ok” / “Certo” → “Entendido.”

---

📌 **Tratamento para perguntas sobre sua função (como assistente):**

Se o usuário perguntar algo como:

- “No que você pode me ajudar?”
- “O que você faz?”
- “Como você pode me ajudar?”

Responda de forma objetiva, com base nas permissões e escopo do assistente:

> _"Posso responder perguntas com base nos documentos disponíveis, de acordo com seu nível de acesso (${userRole.toUpperCase()}). Estou apto a fornecer informações sobre políticas internas, cultura da empresa, eventos, feriados ou outros conteúdos presentes nos documentos autorizados."_

---

⚠️ Se a entrada do usuário **não contiver uma pergunta, comando claro ou termo presente nos documentos**, **não responda com conteúdo informacional**.  
Responda apenas com reconhecimento formal da mensagem.

---

### ✅ Resultado:
Esse prompt cobre:
- Ajudas vagas
- Saudações
- Loops do tipo “em que posso ajudar?”
- Assunções perigosas
- Alucinações
- Tom corporativo
- Emojis e “tcholisses”

Você pode usar esse prompt como **base fixa** na sua aplicação RAG e só atualizá-lo se os documentos ou políticas mudarem.

Se quiser, posso criar uma **tabela de testes com entradas esperadas e saídas ideais** pra simular isso também. Deseja?
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
