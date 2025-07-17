import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Document } from 'src/documents/entities/document.entity'
import { User } from 'src/users/entities/user.entity'
import { DataSource } from 'typeorm'
import { WithLengthColumnType } from 'typeorm/driver/types/ColumnTypes'
import { DocumentChunk } from 'src/documents-chunk/entities/document-chunk.entity'
import { ConfigService } from '@nestjs/config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASS'),
          database: configService.get<string>('DB_DATABASE'),
          entities: [Document, DocumentChunk, User],
          synchronize: false,
          migrationsRun: false,
          logging: true,
        }
      },
      dataSourceFactory: async (options) => {
        const dataSource = new DataSource(options)
        dataSource.driver.supportedDataTypes.push(
          'vector' as WithLengthColumnType
        )
        dataSource.driver.withLengthColumnTypes.push(
          'vector' as WithLengthColumnType
        )
        await dataSource.initialize()
        return dataSource
      },
    }),
  ],
})
export class DatabaseModule {}
