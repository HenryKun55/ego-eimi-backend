import { execSync } from 'child_process'
import path from 'path'

const migrationName = process.argv[2]

if (!migrationName) {
  console.error(
    '❌ Name required.\nUse: bun run generate-migration create-users-table'
  )
  process.exit(1)
}

console.log(`📦 Gerando migration: ${migrationName}`)

execSync(
  `bunx typeorm migration:generate ${path.join(
    'src/database/migrations',
    migrationName
  )} --dataSource=./dist/scripts/data-source.js`,
  { stdio: 'inherit' }
)

console.log('Migration generated!')
