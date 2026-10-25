import { TextRange } from '@/domain/models';

export type SelectionEdge = 'start' | 'end';
export type CharacterBox = TextRange & { x: number; y: number; width: number; height: number };
export function selectionCharacters(text: string, offset = 0): (TextRange & { text: string })[] {
  const values = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? Array.from(new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(text), (part) => part.segment)
    : Array.from(text).reduce<string[]>((groups, char) => {
      const previous = groups[groups.length - 1];
      if (previous && (/^[\p{Mark}\uFE0F\u200D\u{1F3FB}-\u{1F3FF}]$/u.test(char) || previous.endsWith('\u200D') || (/^\p{Regional_Indicator}$/u.test(char) && /^\p{Regional_Indicator}$/u.test(previous)))) groups[groups.length - 1] += char;
      else groups.push(char);
      return groups;
    }, []);
  return values.map((value) => { const start = offset; offset += value.length; return { text: value, start, end: offset }; });
}
export function moveSelectionEdge(text: string, range: TextRange, edge: SelectionEdge, direction: -1 | 1): TextRange {
  const points = [0, ...selectionCharacters(text).map((c) => c.end)];
  const index = points.indexOf(range[edge]);
  if (index < 0) return range;
  const next = points[Math.max(0, Math.min(points.length - 1, index + direction))];
  return setSelectionEdge(text, range, edge, next);
}
export function setSelectionEdge(text: string, range: TextRange, edge: SelectionEdge, position: number): TextRange {
  const points = [0, ...selectionCharacters(text).map((c) => c.end)];
  if (!points.includes(position)) return range;
  if (edge === 'start') return { start: Math.min(position, points[points.indexOf(range.end) - 1] ?? range.start), end: range.end };
  return { start: range.start, end: Math.max(position, points[points.indexOf(range.start) + 1] ?? range.end) };
}
export function boundaryAtPoint(boxes: CharacterBox[], x: number, y: number): number | undefined {
  let best: { index: number; score: number } | undefined;
  for (const box of boxes) {
    const distanceY = Math.max(box.y - y, y - box.y - box.height, 0);
    for (const point of [{ index: box.start, x: box.x }, { index: box.end, x: box.x + box.width }]) {
      const score = distanceY * 1000 + Math.abs(point.x - x);
      if (!best || score < best.score) best = { index: point.index, score };
    }
  }
  return best?.index;
}
