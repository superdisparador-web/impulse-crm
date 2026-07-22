import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccessContextService } from './access-context.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { getJwtAccessSecret } from './jwt-env';
import { JwtStrategy } from './jwt.strategy';
import { AuthThrottlerGuard, AUTH_THROTTLER_GUARD } from './guards/auth-throttler.guard';
import { LocalStrategy } from './strategies/local.strategy';
import { PasswordService } from './security/password.service';
import { UsersModule } from '../users/users.module';

type ThrottlerPackage = { ThrottlerModule: { forRoot: (options: unknown) => DynamicModule }; ThrottlerGuard: new (...args: never[]) => unknown };

function resolveThrottlerImports(): DynamicModule[] {
  try {
    const throttler = (module.require('@nestjs/throttler')) as ThrottlerPackage;
    return [throttler.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }])];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND') throw error;
    return [];
  }
}

function resolveThrottlerProviders(): Provider[] {
  try {
    const throttler = (module.require('@nestjs/throttler')) as ThrottlerPackage;
    return [{ provide: AUTH_THROTTLER_GUARD, useClass: throttler.ThrottlerGuard }];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND') throw error;
    return [];
  }
}

const authProviders: Provider[] = [AuthService, JwtStrategy, LocalStrategy, AccessContextService, PasswordService, AuthThrottlerGuard, ...resolveThrottlerProviders()];

@Module({
  imports: [UsersModule, ...resolveThrottlerImports(), PassportModule, JwtModule.registerAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (configService: ConfigService) => ({ secret: getJwtAccessSecret({ JWT_ACCESS_SECRET: configService.get<string>('JWT_ACCESS_SECRET'), JWT_REFRESH_SECRET: configService.get<string>('JWT_REFRESH_SECRET') }), signOptions: { expiresIn: configService.get('JWT_ACCESS_TTL') ?? '15m' } }) })],
  controllers: [AuthController],
  providers: authProviders,
  exports: [AuthService, AccessContextService, PasswordService],
})
export class AuthModule {}
