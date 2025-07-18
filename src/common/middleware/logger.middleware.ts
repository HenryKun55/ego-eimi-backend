import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { UserOutput } from 'src/@types/user'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(
    req: Request & { user: UserOutput },
    res: Response,
    next: NextFunction
  ): void {
    const start = Date.now()
    const { method, originalUrl } = req
    const userAgent = req.get('user-agent') || ''

    res.on('finish', () => {
      const { statusCode } = res
      const duration = Date.now() - start
      this.logger.log(
        `${method} ${originalUrl} 
        ${statusCode} - ${userAgent} 
        User: ${JSON.stringify(req.user)} -  ${duration}ms`
      )
    })

    next()
  }
}
