import { Module } from '@nestjs/common'
import { AskController } from './ask.controller'
import { SearchModule } from 'src/search/search.module'
import { LlmModule } from 'src/llm/llm.module'

@Module({
  imports: [SearchModule, LlmModule],
  controllers: [AskController],
})
export class AskModule {}
