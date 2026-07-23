const ALLOWED_TEMPLATE_VARIABLES = new Set(['leadName', 'brokerName', 'campaignName', 'distributionCode']);

export function normalizePhoneE164(input: string, defaultCountryCode = '55'): string | null {
  const digits = String(input ?? '').replace(/\D/g, '');
  if (!digits) return null;
  const withCountry = digits.startsWith(defaultCountryCode) ? digits : `${defaultCountryCode}${digits}`;
  if (withCountry.length < 10 || withCountry.length > 15) return null;
  return `+${withCountry}`;
}

export function buildWaMeLink(phoneE164: string, message?: string | null): string {
  const digits = phoneE164.replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function validateTemplateVariables(template?: string | null): string[] {
  const unknown = new Set<string>();
  for (const match of String(template ?? '').matchAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)) {
    if (!ALLOWED_TEMPLATE_VARIABLES.has(match[1])) unknown.add(match[1]);
  }
  return [...unknown];
}

export function renderSafeTemplate(template: string, values: Record<string, string | null | undefined>): string {
  const unknown = validateTemplateVariables(template);
  if (unknown.length) throw new Error(`Variáveis desconhecidas: ${unknown.join(', ')}`);
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => values[key] ?? '');
}
