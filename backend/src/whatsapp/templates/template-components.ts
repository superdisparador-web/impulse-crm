export type TemplateVariable = {
  position: number;
  component: 'HEADER' | 'BODY' | 'BUTTON';
  type: string;
  example: unknown | null;
  required: true;
  order: number;
  buttonIndex?: number;
};

type MetaButton = { type?: string; text?: string; url?: string; example?: unknown[] };
type MetaComponent = { type?: string; format?: string; text?: string; example?: { header_text?: unknown[]; body_text?: unknown[][] }; buttons?: MetaButton[] };

const positions = (text?: string) => [...String(text || '').matchAll(/{{\s*(\d+)\s*}}/g)].map(match => Number(match[1]));

export function parseMetaTemplateComponents(input: unknown): {
  components: MetaComponent[]; headerType: string; headerText: string | null; body: string; footer: string | null; buttons: MetaButton[]; variables: TemplateVariable[];
} {
  const components = Array.isArray(input) ? input.filter(value => value && typeof value === 'object') as MetaComponent[] : [];
  const header = components.find(component => component.type === 'HEADER');
  const body = components.find(component => component.type === 'BODY');
  const footer = components.find(component => component.type === 'FOOTER');
  const buttons = components.find(component => component.type === 'BUTTONS')?.buttons || [];
  const variables: TemplateVariable[] = [];
  const add = (position: number, component: TemplateVariable['component'], type: string, example: unknown, buttonIndex?: number) => variables.push({ position, component, type, example: example ?? null, required: true, order: variables.length + 1, ...(buttonIndex === undefined ? {} : { buttonIndex }) });
  positions(header?.text).forEach(position => add(position, 'HEADER', header?.format || 'TEXT', header?.example?.header_text?.[position - 1]));
  positions(body?.text).forEach(position => add(position, 'BODY', 'TEXT', body?.example?.body_text?.[0]?.[position - 1]));
  buttons.forEach((button, buttonIndex) => positions(button.url || button.text).forEach(position => add(position, 'BUTTON', button.type || 'TEXT', button.example?.[position - 1], buttonIndex)));
  return { components, headerType: header?.format || 'NONE', headerText: header?.text || null, body: body?.text || '', footer: footer?.text || null, buttons, variables };
}

type SafeTemplate = { status: string; isActive: boolean; archivedAt?: unknown; deletedAt?: unknown; metaTemplateId?: string | null; components?: unknown; whatsappAccount?: { provider?: string; status?: string } | null };
export function toSafeTemplate<T extends SafeTemplate>(template: T) {
  return { ...template, variables: parseMetaTemplateComponents(template.components).variables, availableForSending: template.status === 'APPROVED' && template.isActive === true && !template.archivedAt && !template.deletedAt && Boolean(template.metaTemplateId?.trim()) && template.whatsappAccount?.provider === 'META_CLOUD' && template.whatsappAccount?.status === 'ACTIVE' };
}
