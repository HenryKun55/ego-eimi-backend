import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module'

describe('Documents (e2e) - Update', () => {
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

    const docRes = await request(app.getHttpServer())
      .get('/documents')
      .set('Authorization', `Bearer ${accessToken}`)

    documentId = docRes.body.data?.[0]?.id
  })

  it('PATCH /documents/:id - atualiza documento existente', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/documents/${documentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ sourceName: 'Política de Férias Atualizada' })
      .expect(200)

    expect(res.body).toHaveProperty('success', true)
    expect(res.body.data).toHaveProperty('id', documentId)
    expect(res.body.data).toHaveProperty(
      'sourceName',
      'Política de Férias Atualizada'
    )
    expect(res.body).toHaveProperty(
      'message',
      'Documento atualizado com sucesso'
    )
  })

  afterAll(async () => {
    await app.close()
  })
})
