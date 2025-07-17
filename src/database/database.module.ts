import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { database } from './config.database'
import { Document } from 'src/documents/entities/document.entity'
import { User } from 'src/users/entities/user.entity'
import { DataSource } from 'typeorm'
import { WithLengthColumnType } from 'typeorm/driver/types/ColumnTypes'
import { DocumentChunk } from 'src/documents-chunk/entities/document-chunk.entity'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'postgres',
        database,
        entities: [Document, DocumentChunk, User],
        synchronize: false,
        migrationsRun: false,
        logging: true,
      }),
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
