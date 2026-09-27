import { Annotation, LyricLine, TextRange } from '@/domain/models';
import { createTextBoundary, hasOverlappingRange } from './lyrics';
import { createId, nowIso } from '@/utils/id';

export type AnnotationTarget = { type: 'line' } | { type: 'range'; range: TextRange } | { type: 'boundary'; index: number };
export type AnnotationContent = Pick<Annotation, 'symbolId' | 'highlight' | 'customText' | 'memo' | 'colorOverride'>;

// 同じ対象・同じ種類の再選択は置き換える。部分的な重複は勝手に消さない。
export function makeQuickAnnotation(line: LyricLine, target: AnnotationTarget, content: AnnotationContent, editingId?: string): Annotation {
  const boundaries = [0];
  for (const character of Array.from(line.text)) boundaries.push(boundaries[boundaries.length - 1] + character.length);
  if (target.type === 'range' && (!boundaries.includes(target.range.start) || !boundaries.includes(target.range.end) || target.range.start >= target.range.end)) throw new Error('歌詞の先頭と末尾の文字を選んでください。');
  if (content.highlight && (target.type !== 'range' || !content.highlight.label.trim())) throw new Error('色分けする語句と歌い方の名前を指定してください。');
  if (!content.highlight && !content.symbolId && !content.customText?.trim()) throw new Error('記号を選んでください。');
  const sameTarget = (a: Annotation) => a.status === 'valid' && !!a.highlight === !!content.highlight && (
    target.type === 'range' ? a.targetType === 'range' && a.range?.start === target.range.start && a.range?.end === target.range.end :
    target.type === 'boundary' ? a.targetType === 'boundary' && a.boundary?.index === target.index : a.targetType === 'line');
  const existing = editingId ? line.annotations.find((a) => a.id === editingId) : line.annotations.find(sameTarget);
  if (editingId && !existing) throw new Error('この記号は削除されています。歌詞を選び直してください。');
  if (target.type === 'range' && hasOverlappingRange(line.annotations, target.range, existing?.id, content.highlight ? 'highlight' : 'symbol')) throw new Error('別の記号・色分けと範囲が重なっています。付いているものをタップして変更するか、範囲を選び直してください。');
  const boundary = target.type === 'boundary' ? createTextBoundary(line.text, target.index) : undefined;
  if (target.type === 'boundary' && !boundary) throw new Error('ブレスを置く文字の前後を選んでください。');
  const date = nowIso();
  return { id: existing?.id ?? createId(), ...content, memo: content.memo ?? existing?.memo,
    targetType: target.type, position: target.type === 'boundary' ? 'inline' : 'above',
    range: target.type === 'range' ? target.range : undefined, boundary,
    targetTextSnapshot: target.type === 'range' ? line.text.slice(target.range.start, target.range.end) : undefined,
    status: 'valid', createdAt: existing?.createdAt ?? date, updatedAt: date };
}
