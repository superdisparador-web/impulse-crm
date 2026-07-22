import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

function meta(req: Request) { return { ip: req.ip, userAgent: req.headers['user-agent'], device: req.headers['sec-ch-ua-platform'] as string | undefined }; }

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registra o primeiro usuário administrador.' })
  register(@Body() data: RegisterDto) { return this.authService.register(data); }

  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Post('login')
  @ApiOperation({ summary: 'Autentica por e-mail e senha.' })
  login(@Body() data: LoginDto, @Req() req: Request) { return this.authService.login(data, meta(req)); }

  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Rotaciona refresh token e emite novo access token.' })
  refresh(@Body() data: RefreshDto, @Req() req: Request) { return this.authService.refresh(data, meta(req)); }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Encerra a sessão atual ou todos os dispositivos.' })
  logout(@CurrentUser('id') userId: string, @CurrentUser('sessionId') sessionId: string | undefined, @Body() data: LogoutDto, @Req() req: Request) { return this.authService.logout(userId, data, meta(req), sessionId); }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @ApiOperation({ summary: 'Altera a senha validando a senha atual.' })
  changePassword(@CurrentUser('id') userId: string, @Body() data: ChangePasswordDto, @Req() req: Request) { return this.authService.changePassword(userId, data, meta(req)); }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('sessions')
  @ApiOperation({ summary: 'Lista sessões ativas do usuário autenticado.' })
  sessions(@CurrentUser('id') userId: string) { return this.authService.sessions(userId); }
}
