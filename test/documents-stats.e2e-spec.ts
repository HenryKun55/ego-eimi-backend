import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'

describe('Documents (e2e) - Stats', () => {
  let app: INestApplication
  let accessToken: string
  let documentId: string

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()

    await request(app.getHttpServer()).post('/seed')

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'henrique@empresa.com', password: '123456' })

    accessToken = res.body.access_token

    const docsRes = await request(app.getHttpServer())
      .get('/documents')
      .set('Authorization', `Bearer ${accessToken}`)

    documentId = docsRes.body.data?.[0]?.id
  })

  it('GET /documents/:id/stats - retorna estatísticas do documento', async () => {
    const res = await request(app.getHttpServer())
      .get(`/documents/${documentId}/stats`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('data')
    expect(res.body).toHaveProperty(
      'message',
      'Estatísticas do documento obtidas com sucesso'
    )

    expect(res.body.data).toHaveProperty('document')
    expect(res.body.data).toHaveProperty('averageChunkSize')
    expect(res.body.data).toHaveProperty('totalChunks')
  })

  afterAll(async () => {
    await app.close()
  })
})
