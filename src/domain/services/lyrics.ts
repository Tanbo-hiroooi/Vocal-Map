import { Annotation, LyricLine, Song, TextRange } from '@/domain/models';
import { createId, nowIso } from '@/utils/id';

export function splitLyrics(text: string): LyricLine[] {
  return text.replace(/\r\n?/g, '\n').split('\n').map((line, order) => ({ id: createId(), text: line, order, annotations: [] }));
}

export function findTextRanges(text: string, query: string): TextRange[] {
  if (!query) return [];
  const ranges: TextRange[] = [];
  let from = 0;
  while (from <= text.length - query.length) {
    const start = text.indexOf(query, from);
    if (start < 0) break;
    ranges.push({ start, end: start + query.length });
    from = start + Math.max(1, query.length);
  }
  return ranges;
}

export function rangesOverlap(a: TextRange, b: TextRange): boolean {
  return a.start < b.end && b.start < a.end;
}

export function hasOverlappingRange(annotations: Annotation[], range: TextRange, exceptId?: string): boolean {
  return annotations.some((item) => item.id !== exceptId && item.targetType === 'range' && item.range && rangesOverlap(item.range, range));
}

export type LyricSegment = { text: string; start: number; end: number; annotations: Annotation[] };
export function createLyricSegments(text: string, annotations: Annotation[]): LyricSegment[] {
  const ranged = annotations
    .filter((a): a is Annotation & { range: TextRange } => a.targetType === 'range' && !!a.range && a.range.start >= 0 && a.range.end <= text.length)
    .sort((a, b) => a.range.start - b.range.start);
  const boundaries = new Set([0, text.length]);
  ranged.forEach((a) => { boundaries.add(a.range.start); boundaries.add(a.range.end); });
  const points = [...boundaries].sort((a, b) => a - b);
  return points.slice(0, -1).map((start, index) => {
    const end = points[index + 1];
    return { text: text.slice(start, end), start, end, annotations: ranged.filter((a) => a.range.start === start && a.range.end === end) };
  });
}

function reconcileAnnotations(oldLine: LyricLine, newText: string): Annotation[] {
  if (oldLine.text === newText) return oldLine.annotations;
  return oldLine.annotations.map((annotation) => {
    if (annotation.targetType === 'line') return { ...annotation, updatedAt: nowIso() };
    const snapshot = annotation.targetTextSnapshot;
    const matches = snapshot ? findTextRanges(newText, snapshot) : [];
    if (matches.length === 1) return { ...annotation, range: matches[0], status: 'valid' as const, updatedAt: nowIso() };
    return { ...annotation, status: 'needs-review' as const, updatedAt: nowIso() };
  });
}

export function updateSongLyrics(song: Song, rawLyrics: string): LyricLine[] {
  const texts = rawLyrics.replace(/\r\n?/g, '\n').split('\n');
  const unused = new Set(song.lyrics.map((line) => line.id));
  return texts.map((text, order) => {
    const samePosition = song.lyrics[order];
    let previous = samePosition && unused.has(samePosition.id) ? samePosition : undefined;
    if (!previous || (previous.text !== text && song.lyrics.some((line) => unused.has(line.id) && line.text === text))) {
      const exact = song.lyrics.filter((line) => unused.has(line.id) && line.text === text);
      if (exact.length === 1) previous = exact[0];
    }
    if (!previous) return { id: createId(), text, order, annotations: [] };
    unused.delete(previous.id);
    return { id: previous.id, text, order, annotations: reconcileAnnotations(previous, text) };
  });
}
