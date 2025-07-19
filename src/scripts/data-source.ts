import { config } from 'dotenv'
import { DataSource } from 'typeorm'

config()

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'ego_eimi',
  entities: [
    process.env.NODE_ENV === 'production'
      ? __dirname + '/../**/*.entity.js'
      : __dirname + '/../**/*.entity.ts',
  ],
  migrations: [
    process.env.NODE_ENV === 'production'
      ? __dirname + '/../database/migrations/*.js'
      : __dirname + '/../database/migrations/*.ts',
  ],
  synchronize: false,
  migrationsRun: false,
  logging: true,
})

const driver: any = AppDataSource.driver
driver.supportedDataTypes.push('vector')
driver.withLengthColumnTypes.push('vector')

export default AppDataSource
