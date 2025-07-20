import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module'

describe('Ask (e2e)', () => {
  let app: INestApplication
  let employeeToken: string
  let adminToken: string
  let viewerToken: string

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    await app.init()

    await request(app.getHttpServer()).post('/seed')

    const employeeLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'henrique@empresa.com', password: '123456' })

    employeeToken = employeeLogin.body.access_token

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@empresa.com', password: '123456' })

    adminToken = adminLogin.body.access_token

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'viewer@empresa.com',
        password: '123456',
        roles: ['viewer'],
      })

    const viewerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'viewer@empresa.com', password: '123456' })

    viewerToken = viewerLogin.body.access_token
  })

  it('employee deve acessar documento de funcionário', async () => {
    const res = await request(app.getHttpServer())
      .post('/ask')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ question: 'Quais os benefícios oferecidos pela empresa?' })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.answer.toLowerCase()).toMatch(/benefício|vale|plano/)
  })

  it('employee NÃO deve receber chunks de documentos de admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/ask')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ question: 'Qual é o lucro da empresa em 2025?' })
      .expect(200)

    expect(res.body.success).toBe(true)
    const chunks = res.body.data.chunks as any[]

    const contemAdmin = chunks.some((c) => c.metadata?.requiredRole === 'admin')

    expect(contemAdmin).toBe(false)
  })

  it('admin deve acessar qualquer documento', async () => {
    const res = await request(app.getHttpServer())
      .post('/ask')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ question: 'Qual é o lucro da empresa em 2025?' })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.answer.toLowerCase()).toMatch(/lucro|milh|finance/i)
  })

  it('viewer deve acessar apenas conteúdo público', async () => {
    const res = await request(app.getHttpServer())
      .post('/ask')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ question: 'Onde vejo o calendário da empresa?' })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.answer.toLowerCase()).toMatch(
      /calendário|eventos|datas/
    )
  })

  it('viewer NÃO deve acessar conteúdo restrito', async () => {
    const res = await request(app.getHttpServer())
      .post('/ask')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ question: 'Quais são os benefícios da empresa?' })
      .expect(200)

    expect(res.body.success).toBe(true)

    const answer = res.body.data.answer.toLowerCase()
    const restrictTerms = /vale[-\s]?alimentação|plano|home|auxílio/

    expect(answer).not.toMatch(restrictTerms)
    expect(answer).toMatch(/manual|calendário|valores|cultura|eventos/)
  })

  afterAll(async () => {
    await app.close()
  })
})
