import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get()
  teste() {
    return {
      ok: true,
      message: 'Auth funcionando',
    };
  }
}