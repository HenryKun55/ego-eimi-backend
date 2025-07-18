import * as request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module'

describe('Documents (e2e) - Search', () => {
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

  it('GET /documents/search - retorna resultados com query válida', async () => {
    const res = await request(app.getHttpServer())
      .get('/documents/search')
      .query({ query: 'férias' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body).toHaveProperty('query', 'férias')
    expect(res.body).toHaveProperty('message', 'Busca realizada com sucesso')
  })

  afterAll(async () => {
    await app.close()
  })
})
