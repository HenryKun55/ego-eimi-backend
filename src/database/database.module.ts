import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { database } from './config.database'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database,
      entities: [],
      synchronize: true,
    }),
  ],
})
export class DatabaseModule {}
