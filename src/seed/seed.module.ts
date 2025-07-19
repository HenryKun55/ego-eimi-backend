import { Module } from '@nestjs/common'
import { SeedController } from './seed.controller'
import { UsersModule } from '../users/users.module'
import { DocumentsModule } from '../documents/documents.module'

@Module({
  imports: [UsersModule, DocumentsModule],
  controllers: [SeedController],
})
export class SeedModule {}
