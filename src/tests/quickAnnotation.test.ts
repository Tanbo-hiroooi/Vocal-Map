import { LyricLine } from '@/domain/models';
import { makeQuickAnnotation } from '@/domain/services/quickAnnotation';

const line: LyricLine = { id: 'line', text: 'いいな😀', order: 0, annotations: [] };
const content = { symbolId: '', highlight: { label: '裏声', color: '#E9E3FF' } };
describe('直接編集の保存', () => {
  test('同じ範囲・種類の選び直しではIDを維持し、別の種類は共存する', () => {
    const first = makeQuickAnnotation(line, { type: 'range', range: { start: 0, end: 3 } }, content);
    const withColor = { ...line, annotations: [first] };
    const changed = makeQuickAnnotation(withColor, { type: 'range', range: first.range! }, { ...content, highlight: { label: '地声', color: '#FFE7A0' } });
    expect(changed.id).toBe(first.id);
    expect(changed.createdAt).toBe(first.createdAt);
    const symbol = makeQuickAnnotation(withColor, { type: 'range', range: first.range! }, { symbolId: 'arrow' });
    expect(symbol.id).not.toBe(first.id);
  });
  test('他の色分けとの部分的な重複を拒否する', () => {
    const first = makeQuickAnnotation(line, { type: 'range', range: { start: 0, end: 2 } }, content);
    expect(() => makeQuickAnnotation({ ...line, annotations: [first] }, { type: 'range', range: { start: 1, end: 3 } }, content)).toThrow('重なっています');
  });
  test('既存指定の範囲変更と要確認状態からの復帰でIDとメモを維持する', () => {
    const first = makeQuickAnnotation(line, { type: 'range', range: { start: 0, end: 2 } }, { ...content, memo: '息を多めに' });
    const changed = makeQuickAnnotation({ ...line, annotations: [{ ...first, status: 'needs-review' }] }, { type: 'range', range: { start: 1, end: 3 } }, content, first.id);
    expect(changed).toMatchObject({ id: first.id, status: 'valid', memo: '息を多めに', targetTextSnapshot: 'いな' });
  });
  test('絵文字の途中の範囲やブレス位置を拒否する', () => {
    expect(() => makeQuickAnnotation(line, { type: 'range', range: { start: 3, end: 4 } }, content)).toThrow();
    expect(() => makeQuickAnnotation(line, { type: 'boundary', index: 4 }, { symbolId: 'breath' })).toThrow();
    expect(makeQuickAnnotation(line, { type: 'boundary', index: 5 }, { symbolId: 'breath' }).boundary?.index).toBe(5);
  });
});
