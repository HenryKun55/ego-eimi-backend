import { Module } from '@nestjs/common'
import { DatabaseModule } from './database/database.module'
import { DocumentsModule } from './documents/documents.module'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import { QdrantModule } from './qdrant/qdrant.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    DocumentsModule,
    UsersModule,
    AuthModule,
    QdrantModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
