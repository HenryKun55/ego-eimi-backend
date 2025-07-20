import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { WithLengthColumnType } from 'typeorm/driver/types/ColumnTypes'
import { ConfigService } from '@nestjs/config'
import * as path from 'path'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [path.join(__dirname, '..', '**', '*.entity.{js,ts}')],
        synchronize: false,
        migrationsRun: false,
        logging: false,
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
