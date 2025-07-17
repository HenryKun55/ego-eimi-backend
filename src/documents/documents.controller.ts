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
import { User } from 'src/users/entities/user.entity'
import { CreateDocumentDto } from './dtos/create-document.dto'
import { UpdateDocumentDto } from './dtos/update-document.dto'

export class CreateDocumentBodyDto {
  sourceName: string
  content: string
  requiredRole: string
  metadata?: Record<string, any>
  chunkingOptions?: {
    chunkSize?: number
    chunkOverlap?: number
    separators?: string[]
  }
  indexingOptions?: {
    batchSize?: number
    retryAttempts?: number
  }
}

export class UpdateDocumentBodyDto {
  sourceName?: string
  content?: string
  requiredRole?: string
  metadata?: Record<string, any>
  chunkingOptions?: {
    chunkSize?: number
    chunkOverlap?: number
    separators?: string[]
  }
  indexingOptions?: {
    batchSize?: number
    retryAttempts?: number
  }
}

export class SearchDocumentsQueryDto {
  query: string
  limit?: number
  scoreThreshold?: number
}

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo documento' })
  @ApiResponse({
    status: 201,
    description: 'Documento criado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async create(
    @Body(ValidationPipe) createDocumentDto: CreateDocumentBodyDto,
    @Request() req: { user: User }
  ) {
    const userRoles = req.user.roles || []

    const createDto: CreateDocumentDto = {
      sourceName: createDocumentDto.sourceName,
      content: createDocumentDto.content,
      requiredRole: createDocumentDto.requiredRole,
      metadata: createDocumentDto.metadata,
      chunkingOptions: createDocumentDto.chunkingOptions,
      indexingOptions: createDocumentDto.indexingOptions,
    }

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
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async findAll(@Request() req: { user: User }) {
    const userRoles = req.user.roles || []
    const documents = await this.documentsService.findAll(userRoles)

    return {
      success: true,
      data: documents,
      count: documents.length,
      message: 'Documentos listados com sucesso',
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar documentos por similaridade' })
  @ApiQuery({
    name: 'query',
    description: 'Texto para busca por similaridade',
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Número máximo de resultados',
    required: false,
  })
  @ApiQuery({
    name: 'scoreThreshold',
    description: 'Threshold mínimo de score para retornar resultado',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados da busca retornados com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Query de busca inválida',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async searchDocuments(
    @Query() queryDto: SearchDocumentsQueryDto,
    @Request() req: { user: User }
  ) {
    const userRoles = req.user.roles || []
    const { query, limit = 10, scoreThreshold = 0.7 } = queryDto

    const results = await this.documentsService.searchDocuments(
      query,
      userRoles,
      Number(limit),
      Number(scoreThreshold)
    )

    return {
      success: true,
      data: results,
      count: results.length,
      query: query,
      message: 'Busca realizada com sucesso',
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar documento por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID do documento',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Documento encontrado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: User }
  ) {
    const userRoles = req.user.roles || []
    const document = await this.documentsService.findOne(id, userRoles)

    return {
      success: true,
      data: document,
      message: 'Documento encontrado com sucesso',
    }
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Obter estatísticas do documento' })
  @ApiParam({
    name: 'id',
    description: 'ID do documento',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas do documento retornadas com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async getDocumentStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: User }
  ) {
    const userRoles = req.user.roles || []
    const stats = await this.documentsService.getDocumentStats(id, userRoles)

    return {
      success: true,
      data: stats,
      message: 'Estatísticas do documento obtidas com sucesso',
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar documento' })
  @ApiParam({
    name: 'id',
    description: 'ID do documento',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Documento atualizado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateDocumentDto: UpdateDocumentBodyDto,
    @Request() req: { user: User }
  ) {
    const userRoles = req.user.roles || []

    const updateDto: UpdateDocumentDto = {
      sourceName: updateDocumentDto.sourceName,
      content: updateDocumentDto.content,
      requiredRole: updateDocumentDto.requiredRole,
      metadata: updateDocumentDto.metadata,
      chunkingOptions: updateDocumentDto.chunkingOptions,
      indexingOptions: updateDocumentDto.indexingOptions,
    }

    const document = await this.documentsService.update(
      id,
      updateDto,
      userRoles
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
  @ApiParam({
    name: 'id',
    description: 'ID do documento',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Documento removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: User }
  ) {
    const userRoles = req.user.roles || []
    await this.documentsService.remove(id, userRoles)

    return {
      success: true,
      message: 'Documento removido com sucesso',
    }
  }
}
