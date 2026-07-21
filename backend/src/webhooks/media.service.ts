import { Injectable } from '@nestjs/common';
import { InboundMessageType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MetaInboundMessage, MetaMedia } from './webhook.types';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async prepareMedia(inboundMessageId: string, message: MetaInboundMessage, tx: Prisma.TransactionClient = this.prisma) {
    const type = message.type as keyof MetaInboundMessage;
    const media = message[type] as MetaMedia | undefined;
    if (!media?.id) return null;
    return tx.mediaFile.create({ data: {
      inboundMessageId,
      metaMediaId: media.id,
      type: (message.type?.toUpperCase() ?? 'UNKNOWN') as InboundMessageType,
      mimeType: media.mime_type,
      sha256: media.sha256,
      fileName: message.type === 'document' ? message.document?.filename : undefined,
      metadata: media as Prisma.InputJsonValue,
      downloadStatus: 'PENDING',
    }});
  }
}
