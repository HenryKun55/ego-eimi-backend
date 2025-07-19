import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module'

describe('Ask (e2e)', () => {
  let app: INestApplication
  let accessToken: string

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    await app.init()

    await request(app.getHttpServer()).post('/seed')

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'henrique@empresa.com', password: '123456' })

    accessToken = loginRes.body.access_token
  })

  it('POST /ask - retorna resposta do LLM para pergunta válida', async () => {
    const res = await request(app.getHttpServer())
      .post('/ask')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Quais os benefícios oferecidos pela empresa?' })
      .expect(201)

    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('answer')
    expect(typeof res.body.data.answer).toBe('string')
    expect(res.body).toHaveProperty('message', 'Resposta gerada com sucesso')
  })

  afterAll(async () => {
    await app.close()
  })
})
