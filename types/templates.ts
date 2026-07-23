export type WhatsappTemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type WhatsappTemplateStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';
export type WhatsappTemplateLanguage = 'pt_BR' | 'en_US' | 'es_ES';
export type WhatsappTemplateHeaderType = 'NONE' | 'TEXT';
export interface WhatsappTemplateButton { type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string; url?: string; phoneNumber?: string; }
export interface WhatsappTemplate { id:string; organizationId:string; whatsappAccountId?:string|null; name:string; displayName:string; metaName:string; language:WhatsappTemplateLanguage; category:WhatsappTemplateCategory; status:WhatsappTemplateStatus; headerType:WhatsappTemplateHeaderType; headerText?:string|null; body:string; footer?:string|null; buttons?: WhatsappTemplateButton[]; metaTemplateId?:string|null; isActive:boolean; archivedAt?:string|null; createdAt:string; updatedAt:string; deletedAt?:string|null; }
export interface WhatsappTemplateFormData { whatsappAccountId?:string; name:string; displayName:string; metaName:string; language:WhatsappTemplateLanguage; category:WhatsappTemplateCategory; status?:WhatsappTemplateStatus; headerType:WhatsappTemplateHeaderType; headerText?:string; body:string; footer?:string; buttons:WhatsappTemplateButton[]; metaTemplateId?:string; isActive?:boolean; }
export interface WhatsappTemplateFilters { search?:string; status?:string; category?:string; language?:string; state?:'active'|'inactive'|'archived'|'all'; page?:number; pageSize?:number; }
export interface PaginatedWhatsappTemplates { items: WhatsappTemplate[]; page:number; pageSize:number; total:number; totalPages:number; }
