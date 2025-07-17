import { Body, Controller, Post } from '@nestjs/common'
import { SearchDto } from './dtos/search.dto'
import { EmbeddingService } from 'src/embedding/embedding.service'
import { QdrantService } from 'src/qdrant/qdrant.service'

@Controller('search')
export class SearchController {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly qdrantService: QdrantService
  ) {}

  @Post()
  async search(@Body() body: SearchDto) {
    const { text, score_threshold = 5 } = body

    const [vector] = await this.embeddingService.generateEmbeddings([text])
    const result = await this.qdrantService.searchSimilar(
      vector,
      score_threshold
    )

    return result
  }
}
