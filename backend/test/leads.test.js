const test = require('node:test');
const assert = require('node:assert/strict');

const PERMISSIONS = {
  admin: ['*'],
  manager: ['leads:create', 'leads:read', 'leads:read-all', 'leads:update', 'leads:assign', 'leads:unassign', 'leads:archive', 'leads:restore', 'leads:manage-duplicates', 'leads:history:read'],
  broker: ['leads:create', 'leads:read', 'leads:update', 'leads:history:read'],
  none: [],
};

const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return `+${digits}`;
};
const normalizeEmail = (email) => String(email || '').trim().toLowerCase() || null;
const normalizeDocument = (document) => String(document || '').replace(/\D/g, '') || null;

function makeStore() {
  return { leads: [], history: [], audit: [], users: [{ id: 'broker-1', organizationId: 'org-1', active: true, role: 'BROKER' }, { id: 'broker-2', organizationId: 'org-2', active: true, role: 'BROKER' }, { id: 'inactive', organizationId: 'org-1', active: false, role: 'BROKER' }] };
}

function can(actor, permission) {
  return actor.permissions.includes('*') || actor.permissions.includes(permission);
}

class LeadHarness {
  constructor(store) { this.store = store; }
  assertPermission(actor, permission) { if (!can(actor, permission)) throw Object.assign(new Error('Permissão insuficiente'), { status: 403 }); }
  assertTenant(actor) { if (!actor.organizationId) throw Object.assign(new Error('Organização obrigatória no contexto'), { status: 400 }); return actor.organizationId; }
  visible(actor, lead) { return actor.permissions.includes('*') || can(actor, 'leads:read-all') || lead.assignedUserId === actor.id || lead.createdByUserId === actor.id; }
  duplicate(organizationId, probe, ignoreId) { return this.store.leads.find((lead) => lead.organizationId === organizationId && lead.id !== ignoreId && !lead.deletedAt && ((probe.normalizedPhone && lead.normalizedPhone === probe.normalizedPhone) || (probe.normalizedEmail && lead.normalizedEmail === probe.normalizedEmail) || (probe.document && lead.document === probe.document))); }
  record(leadId, organizationId, actor, action, before, after) { this.store.history.push({ leadId, organizationId, actorUserId: actor.id, action, before, after }); this.store.audit.push({ entityId: leadId, organizationId, actorUserId: actor.id, action }); }
  create(actor, input) { this.assertPermission(actor, 'leads:create'); const organizationId = this.assertTenant(actor); const lead = { id: `lead-${this.store.leads.length + 1}`, organizationId, name: input.name?.trim() || null, phone: input.phone?.trim() || null, normalizedPhone: normalizePhone(input.phone), email: input.email?.trim() || null, normalizedEmail: normalizeEmail(input.email), document: normalizeDocument(input.document), status: input.assignedUserId ? 'ASSIGNED' : 'NEW', source: input.source || 'MANUAL', assignedUserId: input.assignedUserId || null, managerUserId: input.managerUserId || null, createdByUserId: actor.id, createdAt: new Date(), updatedAt: new Date(), deletedAt: null }; if (!lead.normalizedPhone && !lead.normalizedEmail) throw Object.assign(new Error('Contato obrigatório'), { status: 400 }); const duplicate = this.duplicate(organizationId, lead); if (duplicate) throw Object.assign(new Error('LEAD_DUPLICATE_CONFLICT'), { status: 409, code: 'LEAD_DUPLICATE_CONFLICT' }); this.store.leads.push(lead); this.record(lead.id, organizationId, actor, 'CREATED', null, lead); return lead; }
  find(actor, id, includeArchived = false) { this.assertPermission(actor, 'leads:read'); const lead = this.store.leads.find((item) => item.id === id && (includeArchived || !item.deletedAt) && item.organizationId === (actor.organizationId || item.organizationId)); if (!lead || !this.visible(actor, lead)) throw Object.assign(new Error('Lead não encontrado'), { status: 404 }); return lead; }
  list(actor, query = {}) { this.assertPermission(actor, 'leads:read'); const page = query.page || 1; const limit = Math.min(query.limit || 10, 100); let rows = this.store.leads.filter((lead) => lead.organizationId === actor.organizationId && (query.archived ? lead.deletedAt : !lead.deletedAt) && this.visible(actor, lead)); if (query.status) rows = rows.filter((lead) => lead.status === query.status); if (query.source) rows = rows.filter((lead) => lead.source === query.source); if (query.unassigned) rows = rows.filter((lead) => !lead.assignedUserId); if (query.search) rows = rows.filter((lead) => lead.name?.includes(query.search) || lead.normalizedPhone?.includes(normalizePhone(query.search) || query.search) || lead.normalizedEmail?.includes(normalizeEmail(query.search))); const total = rows.length; return { items: rows.slice((page - 1) * limit, page * limit), meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } }; }
  update(actor, id, input) { this.assertPermission(actor, 'leads:update'); const lead = this.find(actor, id); const before = { ...lead }; const probe = { normalizedPhone: input.phone === undefined ? lead.normalizedPhone : normalizePhone(input.phone), normalizedEmail: input.email === undefined ? lead.normalizedEmail : normalizeEmail(input.email), document: input.document === undefined ? lead.document : normalizeDocument(input.document) }; const duplicate = this.duplicate(lead.organizationId, probe, id); if (duplicate) throw Object.assign(new Error('LEAD_DUPLICATE_CONFLICT'), { status: 409, code: 'LEAD_DUPLICATE_CONFLICT' }); Object.assign(lead, input, probe, { updatedAt: new Date() }); this.record(id, lead.organizationId, actor, 'UPDATED', before, lead); return lead; }
  archive(actor, id) { this.assertPermission(actor, 'leads:archive'); const lead = this.find(actor, id); const before = { ...lead }; lead.deletedAt = new Date(); lead.status = 'ARCHIVED'; this.record(id, lead.organizationId, actor, 'ARCHIVED', before, lead); return { success: true }; }
  restore(actor, id) { this.assertPermission(actor, 'leads:restore'); const lead = this.find(actor, id, true); const before = { ...lead }; lead.deletedAt = null; lead.status = 'NEW'; this.record(id, lead.organizationId, actor, 'RESTORED', before, lead); return lead; }
  assign(actor, id, assignedUserId) { this.assertPermission(actor, assignedUserId ? 'leads:assign' : 'leads:unassign'); const lead = this.find(actor, id); const assignee = assignedUserId ? this.store.users.find((user) => user.id === assignedUserId && user.active) : null; if (assignedUserId && !assignee) throw Object.assign(new Error('LEAD_ASSIGNEE_INACTIVE'), { status: 404, code: 'LEAD_ASSIGNEE_INACTIVE' }); if (assignee && assignee.organizationId !== lead.organizationId) throw Object.assign(new Error('LEAD_ASSIGNEE_CROSS_TENANT'), { status: 400, code: 'LEAD_ASSIGNEE_CROSS_TENANT' }); const before = { assignedUserId: lead.assignedUserId }; lead.assignedUserId = assignedUserId || null; if (assignedUserId && lead.status === 'NEW') lead.status = 'ASSIGNED'; this.record(id, lead.organizationId, actor, assignedUserId ? 'ASSIGNED' : 'UNASSIGNED', before, { assignedUserId: lead.assignedUserId }); return lead; }
  history(actor, id) { this.assertPermission(actor, 'leads:history:read'); const lead = this.find(actor, id, true); return this.store.history.filter((entry) => entry.organizationId === lead.organizationId && entry.leadId === id); }
}

const manager = { id: 'manager-1', organizationId: 'org-1', permissions: PERMISSIONS.manager };
const broker = { id: 'broker-1', organizationId: 'org-1', permissions: PERMISSIONS.broker };
const otherTenantManager = { id: 'manager-2', organizationId: 'org-2', permissions: PERMISSIONS.manager };
const noPermission = { id: 'user-none', organizationId: 'org-1', permissions: PERMISSIONS.none };

test('create lead derives organization from context and normalizes phone/email', () => {
  const leads = new LeadHarness(makeStore());
  const lead = leads.create(manager, { phone: '(81) 99999-0000', email: ' CLIENTE@EXAMPLE.COM ' });
  assert.equal(lead.organizationId, 'org-1');
  assert.equal(lead.normalizedPhone, '+5581999990000');
  assert.equal(lead.normalizedEmail, 'cliente@example.com');
});

test('rejects users without RBAC permission', () => {
  const leads = new LeadHarness(makeStore());
  assert.throws(() => leads.create(noPermission, { phone: '81999990000' }), /Permissão insuficiente/);
});

test('detects duplicates only inside the same tenant', () => {
  const store = makeStore();
  const leads = new LeadHarness(store);
  leads.create(manager, { phone: '81999990000' });
  assert.throws(() => leads.create(manager, { phone: '+55 81 99999-0000' }), /LEAD_DUPLICATE_CONFLICT/);
  const samePhoneOtherTenant = leads.create(otherTenantManager, { phone: '81999990000' });
  assert.equal(samePhoneOtherTenant.organizationId, 'org-2');
});

test('blocks cross-tenant reads and assignments', () => {
  const store = makeStore();
  const leads = new LeadHarness(store);
  const lead = leads.create(manager, { phone: '81999990000' });
  assert.throws(() => leads.find(otherTenantManager, lead.id), /Lead não encontrado/);
  assert.throws(() => leads.assign(manager, lead.id, 'broker-2'), /LEAD_ASSIGNEE_CROSS_TENANT/);
  assert.throws(() => leads.assign(manager, lead.id, 'inactive'), /LEAD_ASSIGNEE_INACTIVE/);
});

test('update, archive, restore, assign and unassign write history and audit', () => {
  const store = makeStore();
  const leads = new LeadHarness(store);
  const lead = leads.create(manager, { phone: '81999990000', name: 'Alice' });
  leads.update(manager, lead.id, { email: 'alice@example.com' });
  leads.assign(manager, lead.id, 'broker-1');
  leads.assign(manager, lead.id, null);
  leads.archive(manager, lead.id);
  leads.restore(manager, lead.id);
  assert.deepEqual(leads.history(manager, lead.id).map((entry) => entry.action), ['CREATED', 'UPDATED', 'ASSIGNED', 'UNASSIGNED', 'ARCHIVED', 'RESTORED']);
  assert.equal(store.audit.length, 6);
});

test('pagination and filters return stable tenant scoped slices', () => {
  const store = makeStore();
  const leads = new LeadHarness(store);
  leads.create(manager, { phone: '81999990000', name: 'Alpha', source: 'MANUAL' });
  leads.create(manager, { phone: '81999990001', name: 'Beta', source: 'WEBSITE' });
  leads.create(manager, { phone: '81999990002', name: 'Gamma', source: 'WEBSITE' });
  const filtered = leads.list(manager, { source: 'WEBSITE', page: 1, limit: 1 });
  assert.equal(filtered.meta.total, 2);
  assert.equal(filtered.meta.totalPages, 2);
  assert.equal(filtered.items.length, 1);
});

test('broker sees only assigned or self-created leads', () => {
  const store = makeStore();
  const leads = new LeadHarness(store);
  const managerLead = leads.create(manager, { phone: '81999990000' });
  const brokerLead = leads.create(broker, { phone: '81999990001' });
  assert.throws(() => leads.find(broker, managerLead.id), /Lead não encontrado/);
  leads.assign(manager, managerLead.id, 'broker-1');
  assert.equal(leads.find(broker, managerLead.id).id, managerLead.id);
  assert.equal(leads.find(broker, brokerLead.id).id, brokerLead.id);
});
