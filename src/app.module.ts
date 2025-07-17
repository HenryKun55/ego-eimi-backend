import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { UsersModule } from './users/users.module'
import { DocumentsModule } from './documents/documents.module'
import { DocumentsChunkModule } from './documents-chunk/documents-chunk.module'
import { AuthModule } from './auth/auth.module'
import { EmbeddingModule } from './embedding/embedding.module'
import { QdrantModule } from './qdrant/qdrant.module'
import { AskModule } from './ask/ask.module'
import { LlmModule } from './llm/llm.module'
import { LoggerMiddleware } from './common/middleware/logger.middleware'
import { SeedModule } from './seed/seed.module'
import { SearchModule } from './search/search.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    DocumentsModule,
    DocumentsChunkModule,
    AuthModule,
    EmbeddingModule,
    QdrantModule,
    AskModule,
    LlmModule,
    SeedModule,
    SearchModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
