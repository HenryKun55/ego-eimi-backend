import * as request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module'

describe('Documents (e2e)', () => {
  let app: INestApplication
  let accessToken: string

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    await app.init()

    // Executa o seed
    await request(app.getHttpServer()).post('/seed')

    // Login com funcionário
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'henrique@empresa.com', password: '123456' })

    accessToken = loginRes.body.access_token
  })

  it('GET /documents - retorna documentos com token válido (employee)', async () => {
    const res = await request(app.getHttpServer())
      .get('/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body).toHaveProperty(
      'message',
      'Documentos listados com sucesso'
    )
  })

  afterAll(async () => {
    await app.close()
  })
})
