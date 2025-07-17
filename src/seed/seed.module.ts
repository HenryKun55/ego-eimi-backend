import { Module } from '@nestjs/common'
import { SeedController } from './seed.controller'
import { UsersModule } from 'src/users/users.module'
import { DocumentsModule } from 'src/documents/documents.module'

@Module({
  imports: [UsersModule, DocumentsModule],
  controllers: [SeedController],
})
export class SeedModule {}
