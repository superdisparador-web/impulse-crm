-- Meta can report templates as paused; preserve that upstream status.
ALTER TYPE "WhatsappTemplateStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
