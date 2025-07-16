import { Controller, Get, Request, UseGuards } from '@nestjs/common'
import { DocumentsService } from './documents.service'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'

@Controller('documents')
export class DocumentController {
  constructor(private documentsService: DocumentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    const userRoles = req.user.roles

    console.log(
      `Buscando documentos para o usuário com os papéis: ${userRoles}`
    )
    return this.documentsService.findAll()
  }
}
