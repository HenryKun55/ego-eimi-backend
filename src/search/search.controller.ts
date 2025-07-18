import {
  Body,
  Controller,
  Post,
  Logger,
  UseGuards,
  BadRequestException,
} from '@nestjs/common'
import { SearchDto } from './dtos/search.dto'
import { EmbeddingService } from 'src/embedding/embedding.service'
import { QdrantService } from 'src/qdrant/qdrant.service'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name)

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly qdrantService: QdrantService
  ) {}

  @Post()
  async search(@Body() body: SearchDto): Promise<{ results: any[] }> {
    const { text, limit = 5, scoreThreshold = 0.7 } = body

    if (!text?.trim()) {
      throw new BadRequestException('Texto para busca não pode estar vazio.')
    }

    this.logger.log(`Buscando por texto: "${text.slice(0, 40)}..."`)

    const [vector] = await this.embeddingService.generateEmbeddings([text])
    const results = await this.qdrantService.search(
      vector,
      limit,
      scoreThreshold
    )

    this.logger.log(`Encontrados ${results.length} resultados`)

    return { results }
  }
}
