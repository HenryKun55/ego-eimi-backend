import * as request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module'

describe('Documents (e2e) - GET by ID', () => {
  let app: INestApplication
  let accessToken: string
  let documentId: string

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

    // Pegar o primeiro documento
    const docRes = await request(app.getHttpServer())
      .get('/documents')
      .set('Authorization', `Bearer ${accessToken}`)

    documentId = docRes.body.data?.[0]?.id
  })

  it('GET /documents/:id - retorna documento específico', async () => {
    const res = await request(app.getHttpServer())
      .get(`/documents/${documentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('id', documentId)
    expect(res.body).toHaveProperty(
      'message',
      'Documento encontrado com sucesso'
    )
  })

  afterAll(async () => {
    await app.close()
  })
})
