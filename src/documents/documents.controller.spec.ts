import { Test, type TestingModule } from '@nestjs/testing'
import { DocumentController } from './documents.controller'

describe('DocumentController', () => {
  let controller: DocumentController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
    }).compile()

    controller = module.get<DocumentController>(DocumentController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
