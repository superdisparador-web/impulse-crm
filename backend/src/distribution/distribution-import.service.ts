import { BadRequestException, Injectable } from '@nestjs/common';
import { DistributionImportMode } from '@prisma/client';
import { inflateRawSync } from 'zlib';
import { normalizePhoneE164 } from './distribution.utils';

export type ParsedBrokerRow = { rowNumber: number; name: string; phoneE164: string };
export type ImportPreview = { rowsReceived: number; valid: ParsedBrokerRow[]; duplicatesRemoved: number; invalid: Array<{ rowNumber: number; reason: string; raw: Record<string, string> }> };

@Injectable()
export class DistributionImportService {
  parse(fileName: string, contentBase64: string, mapping?: { name?: string; phone?: string }, mode: DistributionImportMode = 'ADD'): ImportPreview & { mode: DistributionImportMode } {
    if (mode !== 'ADD') throw new BadRequestException('Modo de importação preparado, mas ainda não implementado. Use ADD.');
    if (!/\.(csv|xlsx)$/i.test(fileName)) throw new BadRequestException('Formato inválido. Envie .csv ou .xlsx');
    const buffer = Buffer.from(contentBase64, 'base64');
    const rows = /\.xlsx$/i.test(fileName) ? this.parseXlsx(buffer) : this.parseCsv(buffer.toString('utf8'));
    return { mode, ...this.normalizeRows(rows, mapping) };
  }

  private normalizeRows(rows: string[][], mapping?: { name?: string; phone?: string }): ImportPreview {
    if (!rows.length) return { rowsReceived: 0, valid: [], duplicatesRemoved: 0, invalid: [] };
    const headers = rows[0].map((h) => h.trim());
    const nameKey = mapping?.name ?? headers.find((h) => /^(nome|name|corretor|broker)$/i.test(h));
    const phoneKey = mapping?.phone ?? headers.find((h) => /^(telefone|phone|celular|whatsapp)$/i.test(h));
    if (!nameKey || !phoneKey) throw new BadRequestException('Não foi possível detectar colunas de Nome e Telefone');
    const nameIndex = headers.indexOf(nameKey), phoneIndex = headers.indexOf(phoneKey);
    if (nameIndex < 0 || phoneIndex < 0) throw new BadRequestException('Mapeamento de colunas inválido');
    const seen = new Set<string>();
    const valid: ParsedBrokerRow[] = [], invalid: ImportPreview['invalid'] = [];
    let duplicatesRemoved = 0;
    rows.slice(1).forEach((row, i) => {
      const rowNumber = i + 2;
      const raw = Object.fromEntries(headers.map((h, idx) => [h, row[idx] ?? '']));
      const name = (row[nameIndex] ?? '').trim();
      const phoneE164 = normalizePhoneE164(row[phoneIndex] ?? '');
      if (!name || !phoneE164) return invalid.push({ rowNumber, reason: 'Nome ou telefone inválido', raw });
      if (seen.has(phoneE164)) { duplicatesRemoved++; return; }
      seen.add(phoneE164); valid.push({ rowNumber, name, phoneE164 });
    });
    return { rowsReceived: Math.max(0, rows.length - 1), valid, duplicatesRemoved, invalid };
  }

  private parseCsv(text: string): string[][] {
    const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
    for (let i = 0; i < text.length; i++) { const c = text[i], n = text[i + 1];
      if (c === '"' && quoted && n === '"') { cell += '"'; i++; continue; }
      if (c === '"') { quoted = !quoted; continue; }
      if (c === ',' && !quoted) { row.push(cell); cell = ''; continue; }
      if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && n === '\n') i++; row.push(cell); if (row.some((v) => v.trim())) rows.push(row); row = []; cell = ''; continue; }
      cell += c;
    }
    row.push(cell); if (row.some((v) => v.trim())) rows.push(row); return rows;
  }

  private parseXlsx(buffer: Buffer): string[][] {
    const files = this.unzip(buffer);
    const workbook = files.get('xl/workbook.xml')?.toString('utf8');
    const rels = files.get('xl/_rels/workbook.xml.rels')?.toString('utf8');
    const firstRelId = workbook?.match(/<sheet[^>]+r:id="([^"]+)"/)?.[1];
    const target = firstRelId ? rels?.match(new RegExp(`<Relationship[^>]+Id="${firstRelId}"[^>]+Target="([^"]+)"`))?.[1] : undefined;
    const sheetPath = target ? `xl/${target.replace(/^\//, '').replace(/^xl\//, '')}` : 'xl/worksheets/sheet1.xml';
    const sheet = files.get(sheetPath)?.toString('utf8');
    if (!sheet) throw new BadRequestException('Planilha XLSX inválida: primeira aba não encontrada');
    const sharedStrings = this.sharedStrings(files.get('xl/sharedStrings.xml')?.toString('utf8') ?? '');
    return [...sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
      const cells: string[] = [];
      for (const cell of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
        const ref = cell[1].match(/r="([A-Z]+)\d+"/)?.[1];
        const index = ref ? this.columnIndex(ref) : cells.length;
        const type = cell[1].match(/t="([^"]+)"/)?.[1];
        const raw = cell[2].match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? cell[2].match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? '';
        cells[index] = type === 's' ? (sharedStrings[Number(raw)] ?? '') : this.xml(raw);
      }
      return cells.map((v) => v ?? '');
    }).filter((row) => row.some((cell) => cell.trim()));
  }

  private sharedStrings(xml: string): string[] { return [...xml.matchAll(/<si[^>]*>([\s\S]*?)<\/si>/g)].map((m) => this.xml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''))); }
  private columnIndex(col: string) { return [...col].reduce((acc, c) => acc * 26 + c.charCodeAt(0) - 64, 0) - 1; }
  private xml(value: string) { return value.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim(); }

  private unzip(buffer: Buffer): Map<string, Buffer> {
    const files = new Map<string, Buffer>();
    for (let offset = 0; offset < buffer.length - 4;) {
      if (buffer.readUInt32LE(offset) !== 0x04034b50) { offset++; continue; }
      const method = buffer.readUInt16LE(offset + 8), compressedSize = buffer.readUInt32LE(offset + 18), size = buffer.readUInt32LE(offset + 22);
      const nameLength = buffer.readUInt16LE(offset + 26), extraLength = buffer.readUInt16LE(offset + 28);
      const name = buffer.subarray(offset + 30, offset + 30 + nameLength).toString('utf8');
      const start = offset + 30 + nameLength + extraLength, end = start + compressedSize;
      const compressed = buffer.subarray(start, end);
      if (method === 0) files.set(name, compressed);
      else if (method === 8) files.set(name, inflateRawSync(compressed, { finishFlush: 2 }));
      else if (size > 0) throw new BadRequestException(`XLSX usa compressão não suportada: ${method}`);
      offset = end;
    }
    return files;
  }
}
