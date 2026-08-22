import { TextRange } from '@/domain/models';
import React, { PropsWithChildren, useRef } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

type Props = PropsWithChildren<{ accessibilityLabel: string; textLength: number; onPress(): void; onRangeSelect?(range: TextRange): void }>;
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

export function LyricSelectionSurface({ children, accessibilityLabel, textLength, onPress, onRangeSelect }: Props) {
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

  const handleClick = () => {
    if (ignoreNextClick.current) {
      ignoreNextClick.current = false;
      return;
    }
    onPress();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPress();
    }
  };

  return <div ref={rootRef} role="button" tabIndex={0} aria-label={accessibilityLabel} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onClick={handleClick} onKeyDown={handleKeyDown} style={styles.surface}>{children}</div>;
}

export function LyricSegmentText({ text, start, style }: { text: string; start: number; style: StyleProp<TextStyle> }) {
  const WebText = Text as unknown as React.ComponentType<React.ComponentProps<typeof Text> & { dataSet: Record<string, string> }>;
  return <WebText selectable dataSet={{ vocalStart: String(start) }} style={[style, styles.lyricText]}>{text}</WebText>;
}

const styles = StyleSheet.create({
  surface: { minHeight: 44, justifyContent: 'center', cursor: 'text', userSelect: 'text' },
  lyricText: { userSelect: 'text' },
});
