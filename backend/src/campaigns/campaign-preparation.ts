import { BadRequestException } from '@nestjs/common';

export const CAMPAIGN_IMPORT_LIMITS = Object.freeze({ maxBytes: 10 * 1024 * 1024, maxRows: Number(process.env.CAMPAIGN_IMPORT_MAX_ROWS || 50_000), sampleRows: 10, batchSize: 500 });
export const CAMPAIGN_MEDIA_LIMITS = Object.freeze({ IMAGE: { maxBytes: 5 * 1024 * 1024, mimeTypes: ['image/jpeg','image/png','image/webp'] }, VIDEO: { maxBytes: 16 * 1024 * 1024, mimeTypes: ['video/mp4','video/3gpp'] }, DOCUMENT: { maxBytes: 10 * 1024 * 1024, mimeTypes: ['application/pdf'] } } as const);
export type RowStatus = 'VALID' | 'INVALID' | 'DUPLICATE';
export type InvalidReason = 'PHONE_EMPTY' | 'PHONE_INVALID_LENGTH' | 'PHONE_INVALID_DDD' | 'PHONE_INVALID_FORMAT' | 'DUPLICATE_PHONE' | 'MISSING_REQUIRED_COLUMN' | 'ROW_EMPTY';

const validDdds = new Set([11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99]);
export function normalizeBrazilianPhone(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return { phone: null, reason: 'PHONE_EMPTY' as InvalidReason, ddiCorrected: false };
  if (/[a-z]/i.test(raw)) return { phone: null, reason: 'PHONE_INVALID_FORMAT' as InvalidReason, ddiCorrected: false };
  let digits = raw.replace(/\D/g, '').replace(/^00/, '');
  let ddiCorrected = false;
  if (!digits.startsWith('55') && (digits.length === 10 || digits.length === 11)) { digits = `55${digits}`; ddiCorrected = true; }
  if (digits.length !== 12 && digits.length !== 13) return { phone: null, reason: 'PHONE_INVALID_LENGTH' as InvalidReason, ddiCorrected };
  if (!digits.startsWith('55')) return { phone: null, reason: 'PHONE_INVALID_FORMAT' as InvalidReason, ddiCorrected };
  if (!validDdds.has(Number(digits.slice(2, 4)))) return { phone: null, reason: 'PHONE_INVALID_DDD' as InvalidReason, ddiCorrected };
  return { phone: digits, reason: null, ddiCorrected };
}

export function safeColumnId(header: string, index: number) {
  const id = header.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `${id || 'coluna'}_${index + 1}`;
}
export function escapeCsv(value: unknown) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function parseCsv(buffer: Buffer) {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  if (!text.trim() || text.includes('\0')) throw new BadRequestException('O arquivo está vazio ou corrompido');
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let i=0;i<text.length;i++) { const c=text[i]; if (c==='"') { if (quoted && text[i+1]==='"') { cell+='"'; i++; } else quoted=!quoted; } else if (c===',' && !quoted) { row.push(cell); cell=''; } else if ((c==='\n'||c==='\r') && !quoted) { if (c==='\r'&&text[i+1]==='\n') i++; row.push(cell); if (row.some(v=>v.trim())) rows.push(row); row=[]; cell=''; } else cell+=c; }
  row.push(cell); if (row.some(v=>v.trim())) rows.push(row); if (quoted || rows.length < 2) throw new BadRequestException('A planilha deve possuir cabeçalho e ao menos uma linha');
  if (rows.length-1 > CAMPAIGN_IMPORT_LIMITS.maxRows) throw new BadRequestException('A planilha excede o limite de linhas');
  const headers=rows[0].map((name,index)=>({ id:safeColumnId(name,index), name:name.trim()||`Coluna ${index+1}`, index }));
  return { headers, rows: rows.slice(1).map(values=>Object.fromEntries(headers.map(h=>[h.id,values[h.index]??'']))) };
}
export function classifyRows(rows: Record<string,string>[], phoneColumn: string, nameColumn?: string) {
  const seen=new Map<string,number>();
  return rows.map((data,index)=>{ if (!Object.values(data).some(v=>String(v).trim())) return { data,index:index+2,status:'INVALID' as RowStatus,phone:null,reason:'ROW_EMPTY' as InvalidReason,ddiCorrected:false };
    const normalized=normalizeBrazilianPhone(data[phoneColumn]); if (!normalized.phone) return { data,index:index+2,status:'INVALID' as RowStatus,...normalized };
    const duplicateOf=seen.get(normalized.phone); if (duplicateOf) return { data,index:index+2,status:'DUPLICATE' as RowStatus,...normalized,reason:'DUPLICATE_PHONE' as InvalidReason,duplicateOf };
    seen.set(normalized.phone,index+2); return { data,index:index+2,status:'VALID' as RowStatus,...normalized,name:nameColumn?data[nameColumn]?.trim()||null:null };
  });
}
export function detectMediaMime(buffer:Buffer){const hex=buffer.subarray(0,16).toString('hex');if(hex.startsWith('ffd8ff'))return'image/jpeg';if(hex.startsWith('89504e470d0a1a0a'))return'image/png';if(buffer.subarray(0,12).toString('ascii').includes('WEBP'))return'image/webp';if(buffer.subarray(4,12).toString('ascii').includes('ftyp'))return'video/mp4';if(hex.startsWith('25504446'))return'application/pdf';return null;}
