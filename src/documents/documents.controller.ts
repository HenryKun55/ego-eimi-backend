import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common'
import { DocumentsService } from './documents.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger'
import { CreateDocumentDto } from './dtos/create-document.dto'
import { UpdateDocumentDto } from './dtos/update-document.dto'
import { SearchDocumentsQueryDto } from './dtos/search-document.dto'
import { User } from '../users/entities/user.entity'

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  private getUserRoles(req: { user: User }): string[] {
    return req.user?.roles || []
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo documento' })
  @ApiResponse({ status: 201, description: 'Documento criado com sucesso' })
  async create(@Body(ValidationPipe) createDto: CreateDocumentDto) {
    const document = await this.documentsService.create(createDto)
    return {
      success: true,
      data: document,
      message: 'Documento criado com sucesso',
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os documentos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos retornada com sucesso',
  })
  async findAll(@Request() req: { user: User }) {
    const documents = await this.documentsService.findAll(
      this.getUserRoles(req)
    )
    return {
      success: true,
      data: documents,
      count: documents.length,
      message: 'Documentos listados com sucesso',
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar documentos por similaridade' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'scoreThreshold', required: false })
  async searchDocuments(
    @Query() queryDto: SearchDocumentsQueryDto,
    @Request() req: { user: User }
  ) {
    const { query, limit = 10, scoreThreshold = 0.7 } = queryDto
    const results = await this.documentsService.searchDocuments(
      query,
      this.getUserRoles(req),
      Number(limit),
      Number(scoreThreshold)
    )

    return {
      success: true,
      data: results,
      count: results.length,
      query,
      message: 'Busca realizada com sucesso',
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar documento por ID' })
  @ApiParam({ name: 'id', type: 'string' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: User }
  ) {
    const document = await this.documentsService.findOne(
      id,
      this.getUserRoles(req)
    )
    return {
      success: true,
      data: document,
      message: 'Documento encontrado com sucesso',
    }
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Obter estatísticas do documento' })
  @ApiParam({ name: 'id', type: 'string' })
  async getDocumentStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: User }
  ) {
    const stats = await this.documentsService.getDocumentStats(
      id,
      this.getUserRoles(req)
    )
    return {
      success: true,
      data: stats,
      message: 'Estatísticas do documento obtidas com sucesso',
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar documento' })
  @ApiParam({ name: 'id', type: 'string' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateDto: UpdateDocumentDto,
    @Request() req: { user: User }
  ) {
    const document = await this.documentsService.update(
      id,
      updateDto,
      this.getUserRoles(req)
    )
    return {
      success: true,
      data: document,
      message: 'Documento atualizado com sucesso',
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover documento' })
  @ApiParam({ name: 'id', type: 'string' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: User }
  ) {
    await this.documentsService.remove(id, this.getUserRoles(req))
    return {
      success: true,
      message: 'Documento removido com sucesso',
    }
  }
}
