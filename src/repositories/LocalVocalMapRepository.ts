import { createPresetSymbols } from '@/constants/presetSymbols';
import { AppData, AppExportData, AppSettings, ImportMode, Song, SymbolDefinition } from '@/domain/models';
import { VocalMapRepository } from './VocalMapRepository';
import { createInitialData, migrateData } from '@/storage/migrations';
import { storage } from '@/storage/storage';

const KEY = 'vocal-map-data';
export class LocalVocalMapRepository implements VocalMapRepository {
  private queue: Promise<void> = Promise.resolve();
  private async read(): Promise<AppData> {
    const raw = await storage.getItem(KEY);
    if (!raw) { const initial = createInitialData(); await this.write(initial); return initial; }
    try { return migrateData(JSON.parse(raw) as AppData); }
    catch (error) { throw new Error(error instanceof Error ? error.message : '保存データを読み込めませんでした。'); }
  }
  private async write(data: AppData) { await storage.setItem(KEY, JSON.stringify(data)); }
  private mutate(action: (data: AppData) => AppData) {
    this.queue = this.queue.then(async () => this.write(action(await this.read())));
    return this.queue;
  }
  async getSongs() { return (await this.read()).songs.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)); }
  async getSong(id: string) { return (await this.read()).songs.find((song) => song.id === id) ?? null; }
  async saveSong(song: Song) { return this.mutate((data) => ({ ...data, songs: [...data.songs.filter((s) => s.id !== song.id), song] })); }
  async deleteSong(id: string) { return this.mutate((data) => ({ ...data, songs: data.songs.filter((s) => s.id !== id) })); }
  async getSymbols() { return (await this.read()).symbols.sort((a,b) => a.order - b.order); }
  async saveSymbol(symbol: SymbolDefinition) { return this.mutate((data) => ({ ...data, symbols: [...data.symbols.filter((s) => s.id !== symbol.id), symbol] })); }
  async deleteSymbol(id: string) { return this.mutate((data) => ({ ...data, symbols: data.symbols.filter((s) => s.id !== id) })); }
  async getSettings() { return (await this.read()).settings; }
  async saveSettings(settings: AppSettings) { return this.mutate((data) => ({ ...data, settings })); }
  async exportData(): Promise<AppExportData> { return { ...(await this.read()), exportedAt: new Date().toISOString() }; }
  async importData(imported: AppExportData, mode: ImportMode = 'replace') {
    const next = migrateData(imported);
    if (mode === 'replace') return this.mutate(() => ({ ...next, exportedAt: undefined }));
    return this.mutate((current) => ({
      ...current,
      songs: [...current.songs.filter((old) => !next.songs.some((item) => item.id === old.id)), ...next.songs],
      symbols: [...current.symbols.filter((old) => !next.symbols.some((item) => item.id === old.id)), ...next.symbols],
    }));
  }
  async resetPresetSymbols() { return this.mutate((data) => ({ ...data, symbols: [...data.symbols.filter((s) => !s.isPreset), ...createPresetSymbols()] })); }
  async clearAll() { await storage.removeItem(KEY); }
}

export const vocalMapRepository = new LocalVocalMapRepository();
