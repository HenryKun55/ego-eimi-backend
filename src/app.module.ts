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
import { ThrottlerModule } from '@nestjs/throttler'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // ThrottlerModule.forRoot([
    //   {
    //     name: 'short',
    //     ttl: 1000,
    //     limit: 3,
    //   },
    //   {
    //     name: 'medium',
    //     ttl: 10000,
    //     limit: 20,
    //   },
    //   {
    //     name: 'long',
    //     ttl: 60000,
    //     limit: 100,
    //   },
    // ]),
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
