import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MetaWhatsappClient } from './meta/meta-whatsapp.client';
import { MetaWhatsappHttpClient } from './meta/meta-whatsapp-http.client';
import { MetaEmbeddedSignupService } from './meta/meta-embedded-signup.service';
import { WhatsappWindowPolicy } from './policies/whatsapp-window.policy';
import { WhatsappCredentialCryptoService } from './security/credential-crypto.service';
import { WhatsappController, WhatsappWebhookController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [WhatsappController, WhatsappWebhookController],
  providers: [
    WhatsappService,
    MetaEmbeddedSignupService,
    WhatsappCredentialCryptoService,
    WhatsappWindowPolicy,
    { provide: MetaWhatsappClient, useClass: MetaWhatsappHttpClient },
  ],
  exports: [WhatsappService, MetaWhatsappClient, WhatsappCredentialCryptoService],
})
export class WhatsappModule {}
