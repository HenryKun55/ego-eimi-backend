import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module'

describe('Seed (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it('POST /seed - deve criar usuários e documentos com sucesso', async () => {
    const res = await request(app.getHttpServer()).post('/seed').expect(201)

    expect(res.body).toEqual(
      expect.objectContaining({
        message: 'Seed realizado com sucesso',
        users: expect.any(Number),
        documents: expect.any(Number),
      })
    )

    expect(res.body.users).toBeGreaterThanOrEqual(3)
    expect(res.body.documents).toBeGreaterThanOrEqual(6)
  })

  afterAll(async () => {
    await app.close()
  })
})
