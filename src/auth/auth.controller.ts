import {
  Controller,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { AuthService } from './auth.service'
import { Request as ExpressRequest } from 'express'
import { UserOutput } from '../@types/user'
import { ApiBody, ApiTags } from '@nestjs/swagger'

@UseGuards(LocalAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiTags('auth')
  @ApiBody({
    schema: { example: { email: 'user@example.com', password: '123456' } },
  })
  async login(@Request() req: ExpressRequest & { user: UserOutput }) {
    return this.authService.login(req.user)
  }
}
