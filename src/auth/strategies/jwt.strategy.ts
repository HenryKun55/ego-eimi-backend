import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

interface JwtPayload {
  sub: string
  email: string
  roles: string[]
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secretOrKey = configService.get<string>('JWT_SECRET')
    if (!secretOrKey) {
      throw new Error('JWT_SECRET não está definido nas variáveis de ambiente')
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
    })
  }

  async validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, roles: payload.roles }
  }
}
