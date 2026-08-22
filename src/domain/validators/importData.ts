import { AppData } from '@/domain/models';

export type ValidationResult = { valid: true; data: AppData } | { valid: false; message: string };
export function validateImportData(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') return { valid: false, message: 'JSONの内容が正しくありません。' };
  const data = input as Partial<AppData>;
  if (typeof data.schemaVersion !== 'number') return { valid: false, message: 'schemaVersionがありません。' };
  if (!Array.isArray(data.songs) || !Array.isArray(data.symbols) || !data.settings) return { valid: false, message: '曲、記号、設定の必須データがありません。' };
  const songsValid = data.songs.every((song) => song && typeof song.id === 'string' && typeof song.title === 'string' && Array.isArray(song.lyrics));
  const symbolsValid = data.symbols.every((symbol) => symbol && typeof symbol.id === 'string' && typeof symbol.symbol === 'string' && typeof symbol.name === 'string');
  if (!songsValid || !symbolsValid || typeof data.settings.defaultFontSize !== 'number') return { valid: false, message: 'データ形式が壊れているため読み込めません。' };
  return { valid: true, data: data as AppData };
}

export function parseImportJson(json: string): ValidationResult {
  try { return validateImportData(JSON.parse(json)); }
  catch { return { valid: false, message: '正しいJSONファイルではありません。' }; }
}
