import { CanActivate, ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common';
import { Observable } from 'rxjs';

export const AUTH_THROTTLER_GUARD = 'AUTH_THROTTLER_GUARD';

@Injectable()
export class AuthThrottlerGuard implements CanActivate {
  constructor(@Optional() @Inject(AUTH_THROTTLER_GUARD) private readonly throttlerGuard?: CanActivate) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    if (!this.throttlerGuard) return true;
    return this.throttlerGuard.canActivate(context);
  }
}
