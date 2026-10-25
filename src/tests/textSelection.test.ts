import { boundaryAtPoint, moveSelectionEdge, selectionCharacters, setSelectionEdge } from '@/domain/services/textSelection';

describe('歌詞の選択範囲', () => {
  test('先頭・末尾を一文字ずつ動かし、範囲が空になったり逆転したりしない', () => {
    expect(moveSelectionEdge('いいな', { start: 1, end: 2 }, 'start', -1)).toEqual({ start: 0, end: 2 });
    expect(moveSelectionEdge('いいな', { start: 1, end: 2 }, 'end', 1)).toEqual({ start: 1, end: 3 });
    expect(setSelectionEdge('いいな', { start: 1, end: 2 }, 'start', 3)).toEqual({ start: 1, end: 2 });
    expect(setSelectionEdge('いいな', { start: 1, end: 2 }, 'end', 0)).toEqual({ start: 1, end: 2 });
    expect(moveSelectionEdge('いいな', { start: 0, end: 3 }, 'start', -1)).toEqual({ start: 0, end: 3 });
    expect(moveSelectionEdge('いいな', { start: 0, end: 3 }, 'end', 1)).toEqual({ start: 0, end: 3 });
  });
  test('絵文字・結合文字・旗を分割せず、保存用のUTF-16位置を保持する', () => {
    const text = 'い👩‍🎤か\u3099🇯🇵な';
    const chars = selectionCharacters(text);
    expect(chars.map((c) => c.text)).toEqual(['い', '👩‍🎤', 'か\u3099', '🇯🇵', 'な']);
    expect(moveSelectionEdge(text, { start: 0, end: 1 }, 'end', 1).end).toBe(6);
    expect(moveSelectionEdge(text, { start: 1, end: text.length }, 'start', 1).start).toBe(6);
  });
  test('折り返しの前後や文字の外側でも近い境界へ吸着する', () => {
    const boxes = [{ start: 0, end: 1, x: 0, y: 0, width: 28, height: 40 }, { start: 1, end: 2, x: 28, y: 0, width: 28, height: 40 }, { start: 2, end: 3, x: 0, y: 40, width: 28, height: 40 }];
    expect(boundaryAtPoint(boxes, 27, 15)).toBe(1);
    expect(boundaryAtPoint(boxes, 27, 65)).toBe(3);
    expect(boundaryAtPoint(boxes, -50, 10)).toBe(0);
    expect(boundaryAtPoint([], 0, 0)).toBeUndefined();
  });
});
