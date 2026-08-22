import { AppExportData, AppSettings, ImportMode, Song, SymbolDefinition } from '@/domain/models';
export interface VocalMapRepository {
  getSongs(): Promise<Song[]>; getSong(id: string): Promise<Song | null>; saveSong(song: Song): Promise<void>; deleteSong(id: string): Promise<void>;
  getSymbols(): Promise<SymbolDefinition[]>; saveSymbol(symbol: SymbolDefinition): Promise<void>; deleteSymbol(id: string): Promise<void>;
  getSettings(): Promise<AppSettings>; saveSettings(settings: AppSettings): Promise<void>;
  exportData(): Promise<AppExportData>; importData(data: AppExportData, mode?: ImportMode): Promise<void>;
  resetPresetSymbols(): Promise<void>; clearAll(): Promise<void>;
}
