import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { IamModule } from '../iam/iam.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MetaWhatsappClient } from './meta/meta-whatsapp.client';
import { MetaWhatsappHttpClient } from './meta/meta-whatsapp-http.client';
import { WhatsappWindowPolicy } from './policies/whatsapp-window.policy';
import { WhatsappCredentialCryptoService } from './security/credential-crypto.service';
import { WhatsappController, WhatsappEmbeddedSignupCallbackController, WhatsappWebhookController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { EmbeddedSignupService } from './embedded-signup/embedded-signup.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    IamModule,
  ],
  controllers: [
    WhatsappController,
    WhatsappEmbeddedSignupCallbackController,
    WhatsappWebhookController,
  ],
  providers: [
    WhatsappService,
    EmbeddedSignupService,
    WhatsappCredentialCryptoService,
    WhatsappWindowPolicy,
    { provide: MetaWhatsappClient, useClass: MetaWhatsappHttpClient },
  ],
  exports: [
    WhatsappService,
    MetaWhatsappClient,
    WhatsappCredentialCryptoService,
  ],
})
export class WhatsappModule {}
