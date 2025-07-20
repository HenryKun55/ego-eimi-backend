import 'pgvector/pg'
import helmet from 'helmet'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'

const isProduction = process.env.NODE_ENV === 'production'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: isProduction
      ? ['error', 'warn']
      : ['log', 'error', 'warn', 'debug', 'verbose'],
  })
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
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:4173',
        'http://localhost:5173',
        'http://frontend:4173',
        'https://seu-front.vercel.app',
      ]

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS bloqueado para origem: ${origin}`))
      }
    },
    credentials: true,
  })

  const port: number = configService.get('PORT', 3000)
  await app.listen(port)

  logger.log(`🚀 Application running on port ${port}`)
}

void bootstrap()
