import { Client } from 'pg'
import { config } from 'dotenv'

config()

const DB_NAME = process.env.DB_DATABASE ?? 'ego_eimi'

async function ensureDatabaseExists() {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: 'postgres',
  })

  await client.connect()

  const res = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [DB_NAME]
  )
  const shouldCreateDb = res.rowCount === 0

  if (shouldCreateDb) {
    console.log(`📦 Criando database "${DB_NAME}"...`)
    await client.query(`CREATE DATABASE ${DB_NAME}`)
  } else {
    console.log(`✅ Database "${DB_NAME}" já existe.`)
  }

  await client.end()

  const dbClient = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: DB_NAME,
  })

  await dbClient.connect()

  console.log('📦 Verificando extensão pgvector...')
  await dbClient.query(`CREATE EXTENSION IF NOT EXISTS vector`)
  console.log('✅ Extensão vector criada ou já existia.')

  await dbClient.end()
}

ensureDatabaseExists()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erro ao preparar o banco de dados:', err)
    process.exit(1)
  })
