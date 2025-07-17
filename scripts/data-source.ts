import * as path from 'path'
import { config } from 'dotenv'
import { Document } from 'src/documents/entities/document.entity'
import { database } from 'src/database/config.database'
import { User } from 'src/users/entities/user.entity'
import { DataSource } from 'typeorm/data-source/DataSource'
import { DocumentChunk } from 'src/documents-chunk/entities/document-chunk.entity'

config()

console.log(path.join(__dirname, '../database/migrations/*.js'))

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? database,
  entities: [DocumentChunk, Document, User],
  migrations: [path.join(__dirname, '../src/database/migrations/*.js')],
  synchronize: false,
  migrationsRun: false,
  logging: true,
})

const driver: any = AppDataSource.driver
driver.supportedDataTypes.push('vector')
driver.withLengthColumnTypes.push('vector')

export { AppDataSource }
