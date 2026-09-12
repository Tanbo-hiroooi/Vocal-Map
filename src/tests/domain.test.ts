import { createPresetSymbols } from '@/constants/presetSymbols';
import { Annotation, AppData } from '@/domain/models';
import { createLyricSegments, createTextBoundary, findTextBoundaryIndices, findTextRanges, hasOverlappingRange, splitLyrics, updateSongLyrics } from '@/domain/services/lyrics';
import { validateImportData } from '@/domain/validators/importData';
import { CURRENT_SCHEMA_VERSION, migrateData } from '@/storage/migrations';

const annotation = (start: number, end: number): Annotation => ({ id: `${start}`, symbolId: 'x', position: 'above', targetType: 'range', range: { start, end }, targetTextSnapshot: 'x', status: 'valid', createdAt: '', updatedAt: '' });
describe('歌詞ドメイン', () => {
  test('歌詞を行に分割し空行を保持する', () => { const lines = splitLyrics('A\n\nB'); expect(lines.map((l) => l.text)).toEqual(['A', '', 'B']); expect(lines.map((l) => l.order)).toEqual([0, 1, 2]); });
  test('対象語句の全候補を取得する', () => { expect(findTextRanges('君と君と', '君')).toEqual([{ start: 0, end: 1 }, { start: 2, end: 3 }]); });
  test('Annotationから歌詞セグメントを生成する', () => { const result = createLyricSegments('伝えたいこと', [annotation(0, 4)]); expect(result.map((s) => s.text)).toEqual(['伝えたい', 'こと']); expect(result[0].annotations).toHaveLength(1); });
  test('文字間の位置を保存して歌詞セグメントへ反映する', () => {
    const boundary = createTextBoundary('君に伝えたい', 2);
    const breath: Annotation = { id: 'breath', symbolId: 'breath', position: 'inline', targetType: 'boundary', boundary, status: 'valid', createdAt: '', updatedAt: '' };
    const result = createLyricSegments('君に伝えたい', [breath]);
    expect(result.map((segment) => segment.text)).toEqual(['君に', '伝えたい']);
    expect(result[1].boundaryAnnotations).toEqual([breath]);
  });
  test('絵文字を含む歌詞でも文字境界を正しく取得する', () => {
    const boundary = createTextBoundary('歌😊う', 3);
    expect(boundary?.index).toBe(3);
    expect(createTextBoundary('歌😊う', 2)).toBeUndefined();
  });
  test('歌詞変更後も一意な文字間を再検索する', () => {
    const boundary = createTextBoundary('君に歌う', 2)!;
    expect(findTextBoundaryIndices('ねえ君に歌う', boundary)).toEqual([4]);
    const song = { id: 'song', title: '曲', createdAt: '', updatedAt: '', lyrics: [{ id: 'line', text: '君に歌う', order: 0, annotations: [{ id: 'breath', symbolId: 'breath', position: 'inline' as const, targetType: 'boundary' as const, boundary, status: 'valid' as const, createdAt: '', updatedAt: '' }] }] };
    expect(updateSongLyrics(song, 'ねえ君に歌う')[0].annotations[0].boundary?.index).toBe(4);
  });
  test('重複範囲を検出する', () => { expect(hasOverlappingRange([annotation(1, 4)], { start: 3, end: 5 })).toBe(true); expect(hasOverlappingRange([annotation(1, 4)], { start: 4, end: 5 })).toBe(false); });
});
describe('初期データと移行', () => {
  test('プリセット記号を生成できる', () => { const symbols = createPresetSymbols('2026-01-01'); expect(symbols).toHaveLength(36); expect(symbols.every((s) => s.isPreset)).toBe(true); expect(symbols.find((s) => s.symbol === '／')?.name).toBe('ブレス'); expect(symbols.find((s) => s.name.includes('テヌート'))?.symbol).toBe('—'); expect(symbols.find((s) => s.name.includes('スタッカート'))?.symbol).toBe('•'); expect(symbols.find((s) => s.name === 'クレッシェンド')?.symbol).toBe('𝆒'); expect(symbols.find((s) => s.name === 'デクレッシェンド')?.symbol).toBe('𝆓'); expect(symbols.some((s) => s.symbol === '⤴')).toBe(true); expect(symbols.some((s) => s.symbol === '⤵')).toBe(true); });
  test('エクスポートデータを検証できる', () => { const data = { schemaVersion: 2, songs: [], symbols: [], settings: { defaultFontSize: 18, practiceFontSize: 28, colorScheme: 'system' as const } }; expect(validateImportData(data).valid).toBe(true); expect(validateImportData({ ...data, schemaVersion: CURRENT_SCHEMA_VERSION }).valid).toBe(false); expect(validateImportData({ ...data, schemaVersion: CURRENT_SCHEMA_VERSION, settings: { ...data.settings, lyricLineSpacing: 6 } }).valid).toBe(true); expect(validateImportData({ songs: [] }).valid).toBe(false); });
  test('古いデータを現在のschemaへ移行する', () => { const old = { schemaVersion: 1, songs: [], symbols: [], settings: { defaultFontSize: 18, practiceFontSize: 28, colorScheme: 'system' } } as unknown as AppData; const migrated = migrateData(old); expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION); expect(migrated.settings.lyricLineSpacing).toBe(6); expect(migrated.symbols.some((s) => s.symbol === '⤴')).toBe(true); });
  test('schema 6のデータを現在のschemaへ移行する', () => { const current = { schemaVersion: 6, songs: [], symbols: createPresetSymbols(), settings: { defaultFontSize: 18, practiceFontSize: 28, lyricLineSpacing: 6, colorScheme: 'system' as const } }; expect(migrateData(current).schemaVersion).toBe(CURRENT_SCHEMA_VERSION); });
  test('表示位置と従来の発音記号を移行する', () => { const symbols = createPresetSymbols('2026-01-01').map((symbol) => symbol.id === 'preset-vocal-27' ? { ...symbol, symbol: 'Ten.', name: 'テヌート', meaning: '音の長さを保つ' } : symbol).filter((symbol) => symbol.symbol !== '⤴' && symbol.symbol !== '⤵'); const old = { schemaVersion: 2, songs: [{ id: 'song', title: '曲', lyrics: [{ id: 'line', text: '歌詞', order: 0, annotations: [{ ...annotation(0, 2), position: 'below' }] }], createdAt: '', updatedAt: '' }], symbols, settings: { defaultFontSize: 18, practiceFontSize: 28, colorScheme: 'system' } } as unknown as AppData; const migrated = migrateData(old); expect(migrated.songs[0].lyrics[0].annotations[0].position).toBe('above'); expect(migrated.symbols.find((s) => s.id === 'preset-vocal-27')?.symbol).toBe('—'); expect(migrated.symbols.some((s) => s.symbol === '⤴')).toBe(true); });
});
