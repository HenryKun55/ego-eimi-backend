import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from 'src/users/users.service'
import * as bcrypt from 'bcrypt'
import { LocalStrategyUserOutput } from './@types/user'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(
    email: string,
    pass: string
  ): Promise<LocalStrategyUserOutput | null> {
    const user = await this.usersService.findByEmail(email)
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user
      return result as LocalStrategyUserOutput
    }
    return null
  }

  async login(
    user: LocalStrategyUserOutput
  ): Promise<{ access_token: string }> {
    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles,
    }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }
}
