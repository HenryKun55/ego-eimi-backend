import { Client } from 'pg'
import { database } from './config.database'

export async function ensureDatabaseExists() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  })

  await client.connect()

  const res = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [database]
  )

  if (res.rowCount === 0) {
    console.log(`📦 Creating databse "${database}"...`)
    await client.query(`CREATE DATABASE ${database}`)
  } else {
    console.log(`✅ "${database}" already exists. `)
  }

  await client.end()
}
