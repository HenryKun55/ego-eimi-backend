import { Body, Controller, Post, Logger, UseGuards } from '@nestjs/common'
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
  async search(@Body() body: SearchDto) {
    const { text, limit = 5, scoreThreshold = 0.7 } = body

    this.logger.log(
      `Recebida requisição de busca para texto: "${text.slice(0, 30)}..."`
    )

    const [vector] = await this.embeddingService.generateEmbeddings([text])
    const results = await this.qdrantService.search(
      vector,
      limit,
      scoreThreshold
    )

    return { results }
  }
}
