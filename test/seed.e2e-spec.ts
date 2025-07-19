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

  it('POST /seed - deve popular usuários e documentos', async () => {
    const res = await request(app.getHttpServer())
      .post('/seed')
      .expect((res) => {
        expect([201, 409]).toContain(res.status)
      })

    expect(res.body).toHaveProperty('message')
  })

  afterAll(async () => {
    await app.close()
  })
})
