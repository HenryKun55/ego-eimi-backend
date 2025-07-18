import * as request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module'

describe('Documents (e2e) - Delete', () => {
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

  it('DELETE /documents/:id - remove documento existente', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        sourceName: 'Documento Temporário para DELETE',
        content: 'Conteúdo irrelevante',
        requiredRole: 'employee',
      })
      .expect(201)

    const documentId = createRes.body.data.id

    const res = await request(app.getHttpServer())
      .delete(`/documents/${documentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204)

    expect(res.body).toEqual({})
  })

  afterAll(async () => {
    await app.close()
  })
})
