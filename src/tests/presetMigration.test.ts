import { createPresetSymbols } from '@/constants/presetSymbols';
import { Annotation, AppData, SymbolDefinition } from '@/domain/models';
import { createInitialData, CURRENT_SCHEMA_VERSION, migrateData } from '@/storage/migrations';

const date = '2026-08-28T00:00:00.000Z';
const legacySmooth: SymbolDefinition = {
  id: 'preset-arrow-6', symbol: '～', name: 'なめらかに', meaning: '音と言葉を滑らかにつなげる',
  category: 'arrow', color: '#4B68D1', isPreset: true, isFavorite: false, order: 6,
  createdAt: date, updatedAt: date,
};
const legacyData = (): AppData => ({
  ...createInitialData(), schemaVersion: 3,
  symbols: [...createPresetSymbols(date).map((symbol) => ({ ...symbol, order: symbol.order >= 6 ? symbol.order + 1 : symbol.order })), { ...legacySmooth }],
});

describe('重複する「なめらかに」プリセットの廃止', () => {
  test('初期データにはレガートを残し、旧記号を含めない', () => {
    const data = createInitialData();
    expect(data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(data.symbols).toHaveLength(36);
    expect(data.symbols.some((symbol) => symbol.id === legacySmooth.id || symbol.name === 'なめらかに')).toBe(false);
    expect(data.symbols.find((symbol) => symbol.id === 'preset-vocal-25')).toMatchObject({ symbol: '⌒', name: 'なめらかにつなぐ（レガート）' });
  });

  test('削除後も他のすべての記号IDを維持する', () => {
    const legacyGlyphs = ['↑', '↓', '→', '↗', '↘', '⇢', '～', '／', '’', '○', 'p', 'mp', 'mf', 'f', 'cresc.', 'decresc.', '息', '前', '上', '抜', '話', '母', '喉×', 'Mix', 'Fal', '⌒', '•', '—', '★', '!', '笑', '泣', '優', '熱', '抑', '⤴', '⤵'];
    const symbols = createPresetSymbols(date);
    expect(new Set(symbols.map((symbol) => symbol.id)).size).toBe(36);
    symbols.forEach((symbol) => expect(symbol.id).toBe(`preset-${symbol.category}-${legacyGlyphs.indexOf(symbol.symbol)}`));
    expect(symbols.map((symbol) => symbol.order)).toEqual(Array.from({ length: 36 }, (_, index) => index));
  });

  test.each([1, 2, 3])('schema %iの未使用・未編集の旧記号を削除する', (schemaVersion) => {
    const data = { ...legacyData(), schemaVersion };
    const before = JSON.stringify(data);
    const migrated = migrateData(data);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.symbols.some((symbol) => symbol.id === legacySmooth.id)).toBe(false);
    expect(migrated.symbols).toHaveLength(36);
    expect(JSON.stringify(data)).toBe(before);
    expect(migrateData(migrated)).toEqual(migrated);
  });

  test('歌詞で使用中の旧記号はカスタムとして残し、書き込みを維持する', () => {
    const data = legacyData();
    const annotation: Annotation = {
      id: 'annotation', symbolId: legacySmooth.id, position: 'above', targetType: 'range',
      range: { start: 0, end: 2 }, targetTextSnapshot: '歌詞', status: 'valid',
      memo: '自分用のメモ', colorOverride: '#123456', createdAt: date, updatedAt: date,
    };
    data.songs = [{ id: 'song', title: '練習曲', lyrics: [{ id: 'line', text: '歌詞', order: 0, annotations: [annotation] }], createdAt: date, updatedAt: date }];
    const migrated = migrateData(data);
    expect(migrated.symbols.find((symbol) => symbol.id === legacySmooth.id)).toEqual({ ...legacySmooth, isPreset: false });
    expect(migrated.songs).toEqual(data.songs);
    expect(migrated.symbols.filter((symbol) => symbol.isPreset)).toHaveLength(36);
  });

  test.each<Partial<SymbolDefinition>>([
    { symbol: '〜♪' }, { name: '私の記号' }, { meaning: '自分用の意味' },
    { category: 'custom' }, { color: '#123456' }, { isFavorite: true }, { order: 0 },
  ])('編集された旧記号は変更内容を保持する: %j', (changes) => {
    const data = legacyData();
    data.symbols = data.symbols.map((symbol) => symbol.id === legacySmooth.id ? { ...symbol, ...changes } : symbol);
    const migrated = migrateData(data);
    expect(migrated.symbols.find((symbol) => symbol.id === legacySmooth.id)).toEqual({ ...legacySmooth, ...changes, isPreset: false });
  });

  test('同じ表示・名前の独自記号やすでにカスタム化した記号は削除しない', () => {
    const data = legacyData();
    const custom = { ...legacySmooth, id: 'my-custom-symbol', isPreset: false };
    data.symbols.push(custom);
    data.symbols = data.symbols.map((symbol) => symbol.id === legacySmooth.id ? { ...symbol, isPreset: false } : symbol);
    const migrated = migrateData(data);
    expect(migrated.symbols).toEqual(data.symbols);
  });
});
