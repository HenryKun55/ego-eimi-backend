import { Injectable } from '@nestjs/common'

@Injectable()
export class DocumentsService {
  private readonly documents: [] = []

  findAll(): [] {
    return this.documents
  }
}
