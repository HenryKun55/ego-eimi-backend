import AppDataSource from './data-source'

AppDataSource.initialize()
  .then(() => {
    console.log('✅ DataSource inicializado')
    return AppDataSource.runMigrations()
  })
  .then((migrations) => {
    console.log(`✅ ${migrations.length} migrations aplicadas`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Erro ao rodar migrations:', err)
    process.exit(1)
  })
