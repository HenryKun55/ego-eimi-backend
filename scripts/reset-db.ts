import { Client } from 'pg'
import { config } from 'dotenv'
import { database } from '../src/database/config.database'

config()

const DB_NAME = process.env.DB_NAME ?? database

async function dropDatabase() {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: 'postgres',
  })

  await client.connect()

  await client.query(
    `
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = $1
  `,
    [DB_NAME]
  )

  await client.query(`DROP DATABASE IF EXISTS ${DB_NAME}`)
  console.log(`❌ Database "${DB_NAME}" dropped.`)
  await client.end()
}

dropDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro ao dropar database:', err)
    process.exit(1)
  })
