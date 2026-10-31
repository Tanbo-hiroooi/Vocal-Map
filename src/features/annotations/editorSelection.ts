import { Annotation, LyricLine, TextRange } from '@/domain/models';
import { selectionCharacters } from '@/domain/services/textSelection';

export type AnnotationEditMode = 'symbol' | 'highlight' | 'breath';
export type EditorSelection = {
  lineId: string;
  mode: AnnotationEditMode;
  range?: TextRange;
  character?: TextRange;
  anchor?: TextRange;
  pickingStart?: boolean;
  annotationId?: string;
  revision: number;
};

function firstCharacter(text: string, range?: TextRange): TextRange | undefined {
  const character = range && selectionCharacters(text).find((item) => item.start === range.start);
  return character ? { start: character.start, end: character.end } : undefined;
}

// 通常は1タップで1文字を編集。複数文字の選択は色分けモード内に限る。
export function selectEditorCharacter(previous: EditorSelection | undefined, lineId: string, character: TextRange): EditorSelection {
  const current = previous?.lineId === lineId ? previous : undefined;
  const mode = current?.mode ?? (previous?.mode === 'highlight' ? 'highlight' : 'symbol');
  const anchor = mode === 'highlight' ? current?.anchor : undefined;
  return {
    lineId, mode, character: anchor ?? character,
    range: anchor ? { start: Math.min(anchor.start, character.start), end: Math.max(anchor.end, character.end) } : character,
    anchor: mode === 'highlight' && !anchor ? character : undefined,
    annotationId: current && (current.anchor || current.pickingStart) ? current.annotationId : undefined,
    revision: (previous?.revision ?? 0) + 1,
  };
}

export function changeEditorMode(current: EditorSelection, mode: AnnotationEditMode): EditorSelection {
  if (current.mode === mode) return current;
  return { ...current, mode, range: current.character,
    anchor: mode === 'highlight' ? current.character : undefined,
    pickingStart: !current.character, revision: current.revision + 1 };
}

export function reselectHighlight(current: EditorSelection): EditorSelection {
  return { ...current, mode: 'highlight', range: undefined, character: undefined, anchor: undefined, pickingStart: true, revision: current.revision + 1 };
}

export function selectEditorRange(current: EditorSelection, line: LyricLine, range: TextRange): EditorSelection {
  if (current.mode !== 'highlight' || current.lineId !== line.id) return current;
  return { ...current, range, character: firstCharacter(line.text, range), anchor: undefined, pickingStart: false, revision: current.revision + 1 };
}

export function editExistingAnnotation(previous: EditorSelection | undefined, line: LyricLine, annotation: Annotation): EditorSelection {
  const range = annotation.status === 'valid' ? annotation.range : undefined;
  const beforeBoundary = annotation.status === 'valid' && annotation.boundary
    ? selectionCharacters(line.text).find((item) => item.end === annotation.boundary!.index) : undefined;
  return { lineId: line.id, mode: annotation.highlight ? 'highlight' : annotation.targetType === 'boundary' ? 'breath' : 'symbol',
    range, character: firstCharacter(line.text, range) ?? (beforeBoundary ? { start: beforeBoundary.start, end: beforeBoundary.end } : undefined),
    annotationId: annotation.id, pickingStart: annotation.status === 'needs-review', revision: (previous?.revision ?? 0) + 1 };
}
