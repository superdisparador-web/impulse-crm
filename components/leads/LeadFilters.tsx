import { LeadListParams, LeadSource, LeadStatus, LeadTemperature } from '@/types/lead';
import { User } from '@/types/user';
import { leadSourceLabels, leadStatusLabels, leadTemperatureLabels } from './lead-labels';

const statuses = Object.keys(leadStatusLabels) as LeadStatus[];
const temperatures = Object.keys(leadTemperatureLabels) as LeadTemperature[];
const sources = Object.keys(leadSourceLabels) as LeadSource[];

type Props = { filters: LeadListParams; users: User[]; onChange: (filters: LeadListParams) => void };

export default function LeadFilters({ filters, users, onChange }: Props) {
  const set = (key: keyof LeadListParams, value: string | boolean) => onChange({ ...filters, page: 1, [key]: value });
  const clear = () => onChange({ page: 1, limit: filters.limit ?? 10, order: 'desc', search: filters.search ?? '' });
  return <section aria-label="Filtros de leads" className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
    <label className="sr-only" htmlFor="lead-status-filter">Status</label><select id="lead-status-filter" className="rounded-lg bg-slate-900 p-3" value={filters.status ?? ''} onChange={(e) => set('status', e.target.value)}><option value="">Status</option>{statuses.map((v) => <option key={v} value={v}>{leadStatusLabels[v]}</option>)}</select>
    <label className="sr-only" htmlFor="lead-temperature-filter">Temperatura</label><select id="lead-temperature-filter" className="rounded-lg bg-slate-900 p-3" value={filters.temperature ?? ''} onChange={(e) => set('temperature', e.target.value)}><option value="">Temperatura</option>{temperatures.map((v) => <option key={v} value={v}>{leadTemperatureLabels[v]}</option>)}</select>
    <label className="sr-only" htmlFor="lead-source-filter">Origem</label><select id="lead-source-filter" className="rounded-lg bg-slate-900 p-3" value={filters.source ?? ''} onChange={(e) => set('source', e.target.value)}><option value="">Origem</option>{sources.map((v) => <option key={v} value={v}>{leadSourceLabels[v]}</option>)}</select>
    <label className="sr-only" htmlFor="lead-assignee-filter">Corretor</label><select id="lead-assignee-filter" className="rounded-lg bg-slate-900 p-3" value={filters.assignedUserId ?? ''} onChange={(e) => set('assignedUserId', e.target.value)}><option value="">Responsável</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
    <label className="sr-only" htmlFor="lead-created-from">Cadastro inicial</label><input id="lead-created-from" type="date" className="rounded-lg bg-slate-900 p-3" value={filters.createdFrom ?? ''} onChange={(e) => set('createdFrom', e.target.value)} />
    <label className="sr-only" htmlFor="lead-archived-filter">Arquivados</label><select id="lead-archived-filter" className="rounded-lg bg-slate-900 p-3" value={filters.archived === true ? 'true' : 'false'} onChange={(e) => set('archived', e.target.value === 'true')}><option value="false">Ativos</option><option value="true">Arquivados</option></select>
    <button type="button" onClick={clear} className="rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800">Limpar filtros</button>
  </section>;
}
