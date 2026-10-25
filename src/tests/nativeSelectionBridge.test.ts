/** @jest-environment jsdom */
import { boundaryOffset, observeNativeLyricSelection, readLyricSelection } from '@/components/annotations/nativeSelectionBridge.web';

function fixture() {
  document.body.innerHTML = '<div id="lyric"><div data-vocal-start="0"><span>いい</span></div><span>裏声</span><div data-vocal-start="2"><span>な😀</span></div></div><div id="other">別の行</div>';
  const root = document.getElementById('lyric')!;
  const parts = root.querySelectorAll('[data-vocal-start] span');
  return { root, first: parts[0].firstChild!, last: parts[1].firstChild! };
}
function select(start: Node, startOffset: number, end: Node, endOffset: number) {
  const range = document.createRange(); range.setStart(start, startOffset); range.setEnd(end, endOffset);
  const selection = window.getSelection()!; selection.removeAllRanges(); selection.addRange(range);
  return selection;
}
afterEach(() => { window.getSelection()?.removeAllRanges(); document.body.innerHTML = ''; });

test('iPhone標準の選択変更だけで編集欄へ範囲を通知し、マウス操作を必要としない', () => {
  const { root, first, last } = fixture();
  const onRange = jest.fn(); const onActive = jest.fn();
  const bridge = observeNativeLyricSelection(root, 5, { onRange, onActive, canSync: () => true });
  const native = select(first, 0, last, 1);
  document.dispatchEvent(new Event('selectionchange'));
  expect(onRange).toHaveBeenLastCalledWith({ start: 0, end: 3 });
  expect(onActive).toHaveBeenLastCalledWith(true);
  expect(native.toString()).toContain('いい'); // OSのハンドルは消さない。
  select(first, 1, last, 3);
  document.dispatchEvent(new Event('selectionchange'));
  expect(onRange).toHaveBeenLastCalledWith({ start: 1, end: 5 });
  bridge.dispose();
});

test('保存済みの記号名を歌詞の文字数へ含めず、親要素の境界も読み取る', () => {
  const { root, first, last } = fixture();
  expect(readLyricSelection(root, select(first, 1, last, 1), 5)).toEqual({ start: 1, end: 3 });
  expect(boundaryOffset(root, root, 0)).toBe(0);
  expect(boundaryOffset(root, root, 2)).toBe(2);
  expect(boundaryOffset(root, root, 3)).toBe(5);
});

test('同じ範囲の連続通知を抑え、選択を解除しても編集対象を消す通知はしない', () => {
  const { root, first } = fixture(); const onRange = jest.fn(); const onActive = jest.fn();
  const bridge = observeNativeLyricSelection(root, 5, { onRange, onActive, canSync: () => true });
  select(first, 0, first, 2);
  document.dispatchEvent(new Event('selectionchange')); document.dispatchEvent(new Event('selectionchange'));
  expect(onRange).toHaveBeenCalledTimes(1);
  window.getSelection()!.removeAllRanges(); document.dispatchEvent(new Event('selectionchange'));
  expect(onActive).toHaveBeenLastCalledWith(false); expect(onRange).toHaveBeenCalledTimes(1);
  select(first, 0, first, 2); document.dispatchEvent(new Event('selectionchange'));
  expect(onRange).toHaveBeenCalledTimes(2); bridge.dispose();
});

test('別の行や画面外から始まる選択をこの行へ勝手に付け替えない', () => {
  const { root, first } = fixture(); const other = document.getElementById('other')!.firstChild!;
  expect(readLyricSelection(root, select(first, 0, other, 1), 5)).toBeNull();
  expect(readLyricSelection(root, select(other, 0, other, 1), 5)).toBeNull();
  expect(readLyricSelection(root, select(first, 1, first, 1), 5)).toBeNull();
});

test('独自ハンドルやPCドラッグ中は同期を待ち、touchendでも反映できる', () => {
  const { root, first } = fixture(); let canSync = false; const onRange = jest.fn();
  const bridge = observeNativeLyricSelection(root, 5, { onRange, onActive: jest.fn(), canSync: () => canSync });
  select(first, 0, first, 2); document.dispatchEvent(new Event('selectionchange'));
  expect(onRange).not.toHaveBeenCalled();
  canSync = true; root.dispatchEvent(new Event('touchend'));
  expect(onRange).toHaveBeenCalledWith({ start: 0, end: 2 });
  bridge.dispose(); select(first, 0, first, 1); document.dispatchEvent(new Event('selectionchange'));
  expect(onRange).toHaveBeenCalledTimes(1);
});
