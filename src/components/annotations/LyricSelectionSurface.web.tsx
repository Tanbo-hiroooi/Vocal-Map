import React, { useRef } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { SegmentTextProps, SelectionSurfaceProps } from './LyricSelectionSurface.types';

type DomBoundary = { container: Node; offset: number };

function boundaryOffset(root: HTMLElement, container: Node, offset: number): number | null {
  const element = container.nodeType === Node.ELEMENT_NODE ? container as Element : container.parentElement;
  const segment = element?.closest<HTMLElement>('[data-vocal-start]');
  if (!segment || !root.contains(segment)) return null;
  const segmentStart = Number(segment.dataset.vocalStart);
  if (!Number.isFinite(segmentStart)) return null;
  try {
    const prefix = document.createRange();
    prefix.selectNodeContents(segment);
    prefix.setEnd(container, offset);
    return segmentStart + prefix.toString().length;
  } catch {
    return null;
  }
}

function boundaryFromPoint(x: number, y: number): DomBoundary | null {
  const caretDocument = document as Document & {
    caretPositionFromPoint?(clientX: number, clientY: number): { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?(clientX: number, clientY: number): Range | null;
  };
  const position = caretDocument.caretPositionFromPoint?.(x, y);
  if (position) return { container: position.offsetNode, offset: position.offset };
  const range = caretDocument.caretRangeFromPoint?.(x, y);
  return range ? { container: range.startContainer, offset: range.startOffset } : null;
}

export function LyricSelectionSurface({ children, accessibilityLabel, textLength, onPress, onRangeSelect, onCharacterPress }: SelectionSurfaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ignoreNextClick = useRef(false);
  const dragStart = useRef<(DomBoundary & { x: number; y: number }) | null>(null);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !onRangeSelect) return;
    const boundary = boundaryFromPoint(event.clientX, event.clientY);
    dragStart.current = boundary ? { ...boundary, x: event.clientX, y: event.clientY } : null;
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !onRangeSelect) {
      dragStart.current = null;
      return;
    }
    const root = rootRef.current;
    const selection = window.getSelection();
    const nativeRange = selection && !selection.isCollapsed && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const startBoundary = nativeRange
      ? { container: nativeRange.startContainer, offset: nativeRange.startOffset }
      : dragStart.current;
    const moved = !!dragStart.current && Math.hypot(event.clientX - dragStart.current.x, event.clientY - dragStart.current.y) >= 4;
    const endBoundary = nativeRange ? { container: nativeRange.endContainer, offset: nativeRange.endOffset } : moved ? boundaryFromPoint(event.clientX, event.clientY) : null;
    dragStart.current = null;
    if (!root || !startBoundary || !endBoundary) return;
    const start = boundaryOffset(root, startBoundary.container, startBoundary.offset);
    const end = boundaryOffset(root, endBoundary.container, endBoundary.offset);
    if (start === null || end === null) return;
    const range = { start: Math.max(0, Math.min(start, end)), end: Math.min(textLength, Math.max(start, end)) };
    if (range.end <= range.start) return;
    ignoreNextClick.current = true;
    onRangeSelect(range);
    selection?.removeAllRanges();
    window.setTimeout(() => { ignoreNextClick.current = false; }, 0);
  };

  const pressCharacter = (target: EventTarget) => {
    const character = target instanceof Element ? target.closest<HTMLElement>('[data-vocal-character]') : null;
    if (!character || !onCharacterPress) return false;
    const start = Number(character.dataset.vocalCharacter);
    onCharacterPress({ start, end: start + (character.textContent?.length ?? 0) });
    return true;
  };
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (ignoreNextClick.current) {
      ignoreNextClick.current = false;
      return;
    }
    if (!pressCharacter(event.target)) onPress();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!pressCharacter(event.target)) onPress();
    }
  };

  return <div ref={rootRef} role={onCharacterPress ? 'group' : 'button'} tabIndex={0} aria-label={accessibilityLabel} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onClick={handleClick} onKeyDown={handleKeyDown} style={webSurfaceStyle}>{children}</div>;
}

export function LyricSegmentText({ text, start, style, selectedRange, onCharacterPress }: SegmentTextProps) {
  const WebText = Text as unknown as React.ComponentType<React.ComponentProps<typeof Text> & { dataSet: Record<string, string> }>;
  let offset = start;
  return <WebText selectable dataSet={{ vocalStart: String(start) }} style={[style, styles.lyricText, webLyricTextStyle as TextStyle]}>{!onCharacterPress ? text : Array.from(text).map((character) => {
    const range = { start: offset, end: offset + character.length }; offset = range.end;
    const selected = !!selectedRange && range.start < selectedRange.end && range.end > selectedRange.start;
    return <WebText key={range.start} dataSet={{ vocalCharacter: String(range.start) }} accessibilityRole="button" accessibilityLabel={`${range.start + 1}文字目「${character}」`} accessibilityState={{ selected }} style={selected ? styles.selected : undefined}>{character}</WebText>;
  })}</WebText>;
}

const styles = StyleSheet.create({
  lyricText: { userSelect: 'text' },
  selected: { textDecorationLine: 'underline', textDecorationColor: '#C34734' },
});

const webSurfaceStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  minHeight: 44,
  display: 'flex',
  justifyContent: 'center',
  cursor: 'text',
  userSelect: 'text',
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
};

const webLyricTextStyle: React.CSSProperties = {
  maxWidth: '100%',
  minWidth: 0,
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
};
