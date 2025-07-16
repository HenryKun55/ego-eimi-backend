import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ensureDatabaseExists } from './database/init.database'

async function bootstrap() {
  await ensureDatabaseExists()
  const app = await NestFactory.create(AppModule)
  await app.listen(3000)
}
void bootstrap()
