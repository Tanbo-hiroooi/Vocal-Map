import { Annotation, LyricLine } from '@/domain/models';
import { changeEditorMode, editExistingAnnotation, reselectHighlight, selectEditorCharacter, selectEditorRange } from '@/features/annotations/editorSelection';

const line: LyricLine = { id: 'line', text: '君に伝えたい', order: 0, annotations: [] };
const first = { start: 0, end: 1 };
const last = { start: 5, end: 6 };
const annotation: Annotation = { id: 'annotation', symbolId: '', highlight: { label: '裏声', color: '#E9E3FF' }, targetType: 'range', range: { start: 0, end: 2 }, position: 'above', status: 'valid', createdAt: '', updatedAt: '' };

test('記号・ブレスではタップごとに対象の1文字だけを更新する', () => {
  const start = selectEditorCharacter(undefined, line.id, first);
  expect(start).toMatchObject({ mode: 'symbol', range: first });
  expect(start.anchor).toBeUndefined();
  expect(selectEditorCharacter(start, line.id, last).range).toEqual(last);
  const breath = changeEditorMode(start, 'breath');
  expect(selectEditorCharacter(breath, line.id, last)).toMatchObject({ mode: 'breath', range: last });
});

test('色分けを選んだ後だけ、最初の文字を起点に複数文字へ拡張する', () => {
  const start = selectEditorCharacter(undefined, line.id, first);
  const choosing = changeEditorMode(start, 'highlight');
  expect(choosing.anchor).toEqual(first);
  const completed = selectEditorCharacter(choosing, line.id, last);
  expect(completed.range).toEqual({ start: 0, end: 6 });
  expect(completed.anchor).toBeUndefined();
  expect(changeEditorMode(completed, 'symbol').range).toEqual(first);
  expect(changeEditorMode(completed, 'breath').range).toEqual(first);
});

test('色分けは逆順にも選べ、再選択中は編集するAnnotationのIDを維持する', () => {
  const existing = editExistingAnnotation(undefined, line, annotation);
  const reselecting = reselectHighlight(existing);
  const choosing = selectEditorCharacter(reselecting, line.id, last);
  const completed = selectEditorCharacter(choosing, line.id, first);
  expect(completed).toMatchObject({ annotationId: annotation.id, range: { start: 0, end: 6 }, character: last });
  expect(completed.anchor).toBeUndefined();
});

test('色分け中に別行を選んでも行をまたぐ範囲は作らない', () => {
  const existing = editExistingAnnotation(undefined, line, annotation);
  const next = selectEditorCharacter(existing, 'other', last);
  expect(next).toMatchObject({ lineId: 'other', mode: 'highlight', range: last, anchor: last });
  expect(next.annotationId).toBeUndefined();
});

test('PCの範囲選択は色分けモード内だけに適用する', () => {
  const start = selectEditorCharacter(undefined, line.id, first);
  expect(selectEditorRange(start, line, { start: 0, end: 6 })).toBe(start);
  const highlight = changeEditorMode(start, 'highlight');
  const completed = selectEditorRange(highlight, line, { start: 2, end: 6 });
  expect(completed).toMatchObject({ range: { start: 2, end: 6 }, character: { start: 2, end: 3 }, pickingStart: false });
  expect(completed.anchor).toBeUndefined();
});

test('過去の複数文字の記号は編集で勝手に縮めず、モードを変えた時だけ1文字へ戻す', () => {
  const existing = editExistingAnnotation(undefined, line, { ...annotation, highlight: undefined });
  expect(existing.range).toEqual({ start: 0, end: 2 });
  expect(changeEditorMode(existing, 'breath').range).toEqual(first);
});

test('絵文字・結合文字を含む色分けを1文字へ戻しても文字の途中で切らない', () => {
  const emojiLine = { ...line, text: '👩‍🎤が歌う' };
  const existing = editExistingAnnotation(undefined, emojiLine, { ...annotation, range: { start: 0, end: emojiLine.text.length } });
  expect(changeEditorMode(existing, 'symbol').range).toEqual({ start: 0, end: 5 });
});

test('要確認の記号は文字をタップすると同じIDで修復できる', () => {
  const existing = editExistingAnnotation(undefined, line, { ...annotation, highlight: undefined, status: 'needs-review' });
  expect(existing.pickingStart).toBe(true);
  expect(existing.range).toBeUndefined();
  const repaired = selectEditorCharacter(existing, line.id, last);
  expect(repaired).toMatchObject({ annotationId: annotation.id, range: last });
  expect(repaired.pickingStart).toBeUndefined();
});
