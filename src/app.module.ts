import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

// Infrastructure
import { DatabaseModule } from './database/database.module'

// Domain Modules
import { UsersModule } from './users/users.module'
import { DocumentsModule } from './documents/documents.module'
import { DocumentsChunkModule } from './documents-chunk/documents-chunk.module'

// Services
import { AuthModule } from './auth/auth.module'
import { EmbeddingModule } from './embedding/embedding.module'
import { QdrantModule } from './qdrant/qdrant.module'
import { AskModule } from './ask/ask.module'
import { LlmModule } from './llm/llm.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,

    // Domain
    UsersModule,
    DocumentsModule,
    DocumentsChunkModule,

    // Services
    AuthModule,
    EmbeddingModule,
    QdrantModule,

    AskModule,
    LlmModule,
  ],
})
export class AppModule {}
