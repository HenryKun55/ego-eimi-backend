import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../users/users.service'
import * as bcrypt from 'bcrypt'
import { UserOutput } from '../@types/user'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<UserOutput | null> {
    const user = await this.usersService.findByEmail(email)
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user
      return result
    }
    return null
  }

  async login(user: UserOutput): Promise<{ access_token: string }> {
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
