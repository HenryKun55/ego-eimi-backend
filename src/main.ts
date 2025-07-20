import 'pgvector/pg'
import helmet from 'helmet'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const logger = new Logger('Bootstrap')

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hidePoweredBy: true,
    })
  )

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get('APP_NAME', 'Ego Eimi API'))
    .setDescription('API de documentos com embeddings e busca vetorial')
    .setVersion(configService.get('APP_VERSION', '1.0'))
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api', app, document)

  app.enableCors({
    origin: configService.get('FRONTEND_URL', 'http://localhost:5173'),
    credentials: configService.get('CORS_CREDENTIALS', true),
  })

  const port: number = configService.get('PORT', 3000)
  await app.listen(port)

  logger.log(`🚀 Application running on port ${port}`)
}

void bootstrap()
