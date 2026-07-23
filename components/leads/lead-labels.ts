export const leadStatusLabels = {
  NEW: "Novo",
  ASSIGNED: "Atribuído",
  CONTACT_PENDING: "Contato pendente",
  IN_CONTACT: "Em contato",
  QUALIFIED: "Qualificado",
  UNQUALIFIED: "Desqualificado",
  CONVERTED: "Convertido",
  LOST: "Perdido",
  ARCHIVED: "Arquivado",
} as const;

export const leadTemperatureLabels = {
  HOT: "Quente",
  WARM: "Morno",
  COLD: "Frio",
  UNKNOWN: "Sem temperatura",
} as const;

export const leadSourceLabels = {
  MANUAL: "Manual",
  CSV_IMPORT: "Importação CSV",
  META_ADS: "Meta Ads",
  WEBSITE: "Site",
  PUBLIC_API: "API pública",
  WEBHOOK: "Webhook",
  REFERRAL: "Indicação",
  ORGANIC: "Orgânico",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LANDING_PAGE: "Landing page",
  PHONE: "Telefone",
  OTHER: "Outro",
} as const;
