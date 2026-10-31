import { AppData } from '@/domain/models';
import { nextScrollOffset, normalizeAutoScrollSpeed } from '@/domain/services/autoScroll';
import { validateImportData } from '@/domain/validators/importData';
import { createInitialData, CURRENT_SCHEMA_VERSION, migrateData } from '@/storage/migrations';

test('移動距離は速度と経過時間に比例し、画面の末尾を超えない', () => {
  expect(nextScrollOffset(0, 1000, 3, 100)).toBeCloseTo(2.4);
  expect(nextScrollOffset(0, 1000, 6, 100)).toBeCloseTo(4.8);
  expect(nextScrollOffset(nextScrollOffset(0, 1000, 3, 50), 1000, 3, 50)).toBeCloseTo(2.4);
  expect(nextScrollOffset(999, 1000, 10, 100)).toBe(1000);
  expect(nextScrollOffset(0, -1, 3, 100)).toBe(0);
  expect(nextScrollOffset(100, 1000, 3, 50000)).toBeCloseTo(102.4);
});

test.each([undefined, null, '3', 0, 11, 1.5, NaN, Infinity])('不正な速度 %s は安全な初期値に戻す', (speed) => {
  expect(normalizeAutoScrollSpeed(speed)).toBe(3);
});

test('旧データの曲・表示設定を保ったまま、自動スクロール速度を追加する', () => {
  const legacy = { ...createInitialData(), schemaVersion: 8, settings: { ...createInitialData().settings, autoScrollSpeed: undefined, practiceFontSize: 32, lyricLineSpacing: 2 } } as unknown as AppData;
  expect(validateImportData(legacy).valid).toBe(true);
  const result = migrateData(legacy);
  expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  expect(result.settings).toMatchObject({ autoScrollSpeed: 3, practiceFontSize: 32, lyricLineSpacing: 2 });
  expect(result.songs).toEqual(legacy.songs);
});

test.each([undefined, null, '3', 0, 11, 1.5, NaN, Infinity])('新しいインポートデータの不正な速度 %s を拒否する', (speed) => {
  const data = createInitialData();
  expect(validateImportData({ ...data, settings: { ...data.settings, autoScrollSpeed: speed } }).valid).toBe(false);
});

test('新しい形式の速度は初期値に上書きせず、エクスポート対象として保持する', () => {
  const data = createInitialData(); data.settings.autoScrollSpeed = 8;
  expect(validateImportData(data).valid).toBe(true);
  expect(migrateData(data).settings.autoScrollSpeed).toBe(8);
});
