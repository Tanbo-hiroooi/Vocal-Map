import { createPresetSymbols } from '@/constants/presetSymbols';
import { AppData, AppSettings, SymbolDefinition } from '@/domain/models';

export const CURRENT_SCHEMA_VERSION = 5;
export const defaultSettings: AppSettings = { defaultFontSize: 18, practiceFontSize: 28, colorScheme: 'system' };
export const createInitialData = (): AppData => ({ schemaVersion: CURRENT_SCHEMA_VERSION, songs: [], symbols: createPresetSymbols(), settings: defaultSettings });

const legacyArticulations: Record<string, Pick<SymbolDefinition, 'symbol' | 'name' | 'meaning'>> = {
  'preset-vocal-25': { symbol: 'Leg.', name: 'レガート', meaning: '音を滑らかにつなぐ' },
  'preset-vocal-26': { symbol: 'Stac.', name: 'スタッカート', meaning: '音を短く切る' },
  'preset-vocal-27': { symbol: 'Ten.', name: 'テヌート', meaning: '音の長さを保つ' },
};

const legacyDynamics: Record<string, Pick<SymbolDefinition, 'symbol' | 'name' | 'meaning'>> = {
  'preset-dynamics-14': { symbol: 'cresc.', name: 'クレッシェンド', meaning: 'だんだん強く' },
  'preset-dynamics-15': { symbol: 'decresc.', name: 'デクレッシェンド', meaning: 'だんだん弱く' },
};

function migratePresetSymbols(symbols: SymbolDefinition[]): SymbolDefinition[] {
  const defaults = createPresetSymbols();
  const defaultsById = new Map(defaults.map((symbol) => [symbol.id, symbol]));
  const upgraded = symbols.map((symbol) => {
    const legacy = legacyArticulations[symbol.id];
    const replacement = defaultsById.get(symbol.id);
    const stillUsesLegacyDefault = legacy && symbol.isPreset && symbol.symbol === legacy.symbol && symbol.name === legacy.name && symbol.meaning === legacy.meaning;
    return stillUsesLegacyDefault && replacement
      ? { ...symbol, symbol: replacement.symbol, name: replacement.name, meaning: replacement.meaning, updatedAt: replacement.updatedAt }
      : symbol;
  });
  const existingIds = new Set(upgraded.map((symbol) => symbol.id));
  return [...upgraded, ...defaults.filter((symbol) => !existingIds.has(symbol.id))];
}

function retireSmoothPreset(data: AppData): SymbolDefinition[] {
  const referencedIds = new Set(data.songs.flatMap((song) => song.lyrics.flatMap((line) => line.annotations.map((annotation) => annotation.symbolId))));
  return data.symbols.flatMap((symbol) => {
    if (symbol.id !== 'preset-arrow-6' || !symbol.isPreset) return [symbol];
    const unchanged = symbol.symbol === '～' && symbol.name === 'なめらかに'
      && symbol.meaning === '音と言葉を滑らかにつなげる' && symbol.category === 'arrow'
      && symbol.color === '#4B68D1' && !symbol.isFavorite && symbol.order === 6;
    // 使用済み・編集済みの記号は、歌詞やユーザーの変更を失わないようカスタムとして保持する。
    return referencedIds.has(symbol.id) || !unchanged ? [{ ...symbol, isPreset: false }] : [];
  });
}

function migrateDynamics(symbols: SymbolDefinition[]): SymbolDefinition[] {
  const defaults = new Map(createPresetSymbols().map((symbol) => [symbol.id, symbol]));
  return symbols.map((symbol) => {
    const legacy = legacyDynamics[symbol.id];
    const replacement = defaults.get(symbol.id);
    const stillUsesLegacyDefault = legacy && symbol.isPreset && symbol.symbol === legacy.symbol
      && symbol.name === legacy.name && symbol.meaning === legacy.meaning;
    return stillUsesLegacyDefault && replacement
      ? { ...symbol, symbol: replacement.symbol, updatedAt: replacement.updatedAt }
      : symbol;
  });
}

export function migrateData(input: AppData): AppData {
  if (input.schemaVersion > CURRENT_SCHEMA_VERSION) throw new Error('このデータは新しいバージョンのVocal Mapで作成されています。');
  let data = { ...input };
  if (data.schemaVersion < 2) {
    data = {
      ...data,
      schemaVersion: 2,
      settings: { ...defaultSettings, ...data.settings },
      songs: data.songs.map((song) => ({
        ...song,
        lyrics: song.lyrics.map((line) => ({ ...line, annotations: line.annotations.map((a) => ({ ...a, status: a.status ?? 'valid' })) })),
      })),
    };
  }
  if (data.schemaVersion < 3) {
    data = {
      ...data,
      schemaVersion: 3,
      symbols: migratePresetSymbols(data.symbols),
      songs: data.songs.map((song) => ({
        ...song,
        lyrics: song.lyrics.map((line) => ({
          ...line,
          annotations: line.annotations.map((annotation) => ({ ...annotation, position: 'above' as const })),
        })),
      })),
    };
  }
  if (data.schemaVersion < 4) {
    data = { ...data, schemaVersion: 4, symbols: retireSmoothPreset(data) };
  }
  if (data.schemaVersion < 5) {
    data = { ...data, schemaVersion: 5, symbols: migrateDynamics(data.symbols) };
  }
  return data;
}
