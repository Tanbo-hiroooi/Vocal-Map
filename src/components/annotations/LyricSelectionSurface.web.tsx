import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { SegmentTextProps, SelectionSurfaceProps } from './LyricSelectionSurface.types';
import { boundaryAtPoint, CharacterBox, selectionCharacters } from '@/domain/services/textSelection';
import { SelectionHandles } from './SelectionHandles';

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

export function LyricSelectionSurface({ children, accessibilityLabel, textLength, onPress, onRangeSelect, onCharacterPress, onCharacterLongPress, selectedRange, onSelectionEdgeChange, onSelectionDragging }: SelectionSurfaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ignoreNextClick = useRef(false);
  const dragStart = useRef<(DomBoundary & { x: number; y: number }) | null>(null);
  const inputKind = useRef('mouse');
  const [touchMode, setTouchMode] = useState(false);
  const handleDrag = useRef(false);
  const touchStart = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [layout, setLayout] = useState({ boxes: [] as CharacterBox[], width: 0 });
  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return { boxes: [] as CharacterBox[], width: 0, x: 0, y: 0 };
    const rect = root.getBoundingClientRect();
    const boxes = Array.from(root.querySelectorAll<HTMLElement>('[data-vocal-character]')).map((node) => {
      const box = node.getBoundingClientRect(); const start = Number(node.dataset.vocalCharacter);
      return { start, end: start + (node.textContent?.length ?? 0), x: box.x - rect.x, y: box.y - rect.y, width: box.width, height: box.height };
    });
    const next = { boxes, width: rect.width };
    setLayout((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    return { ...next, x: rect.x, y: rect.y };
  }, []);
  useLayoutEffect(() => { if (selectedRange) measure(); }, [selectedRange, measure]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure()); observer.observe(root);
    return () => observer.disconnect();
  }, [measure]);
  const cancelHold = () => { if (touchStart.current) clearTimeout(touchStart.current.timer); touchStart.current = null; };
  useEffect(() => () => { if (touchStart.current) clearTimeout(touchStart.current.timer); }, []);
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    inputKind.current = event.pointerType;
    setTouchMode(event.pointerType !== 'mouse');
    cancelHold();
    const character = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-vocal-character]') : null;
    if (!character || !onCharacterLongPress) return;
    const start = Number(character.dataset.vocalCharacter);
    const range = { start, end: start + (character.textContent?.length ?? 0) };
    touchStart.current = { x: event.clientX, y: event.clientY, timer: setTimeout(() => {
      ignoreNextClick.current = true;
      onCharacterLongPress(range);
    }, 450) };
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('[data-testid^="selection-handle-"]')) return;
    if (inputKind.current !== 'mouse') return;
    if (event.button !== 0 || !onRangeSelect) return;
    const boundary = boundaryFromPoint(event.clientX, event.clientY);
    dragStart.current = boundary ? { ...boundary, x: event.clientX, y: event.clientY } : null;
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (handleDrag.current || ignoreNextClick.current) { dragStart.current = null; return; }
    if (inputKind.current !== 'mouse') return;
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
    if (event.target instanceof Element && event.target.closest('[data-testid^="selection-handle-"]')) return;
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

  return <div ref={rootRef} role={onCharacterPress ? 'group' : 'button'} tabIndex={0} aria-label={accessibilityLabel}
    onPointerDown={handlePointerDown} onPointerMove={(event) => { if (touchStart.current && Math.hypot(event.clientX - touchStart.current.x, event.clientY - touchStart.current.y) > 10) cancelHold(); }}
    onPointerUp={cancelHold} onPointerCancel={cancelHold} onContextMenu={(event) => { if (touchMode) event.preventDefault(); }}
    onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onClick={handleClick} onKeyDown={handleKeyDown}
    style={{ ...webSurfaceStyle, userSelect: touchMode ? 'none' : 'text', paddingBottom: selectedRange ? 34 : 0 }}>
    {children}
    {selectedRange && onSelectionEdgeChange && <SelectionHandles range={selectedRange} boxes={layout.boxes} width={layout.width} onDragStart={() => { handleDrag.current = true; ignoreNextClick.current = true; measure(); onSelectionDragging?.(true); }} onDrag={(edge, x, y) => { const current = measure(); const index = boundaryAtPoint(current.boxes, x - current.x, y - current.y); if (index !== undefined) onSelectionEdgeChange(edge, index); }} onDragEnd={() => { handleDrag.current = false; onSelectionDragging?.(false); window.setTimeout(() => { ignoreNextClick.current = false; }, 0); }} />}
  </div>;
}

export function LyricSegmentText({ text, start, style, selectedRange, onCharacterPress }: SegmentTextProps) {
  const WebText = Text as unknown as React.ComponentType<React.ComponentProps<typeof Text> & { dataSet: Record<string, string> }>;
  return <WebText dataSet={{ vocalStart: String(start) }} style={[style, styles.lyricText, webLyricTextStyle as TextStyle]}>{!onCharacterPress ? text : selectionCharacters(text, start).map((character) => {
    const selected = !!selectedRange && character.start < selectedRange.end && character.end > selectedRange.start;
    const shadow = ['inset 0 2px 0 #2261CF', 'inset 0 -3px 0 #2261CF', ...(character.start === selectedRange?.start ? ['inset 2px 0 0 #2261CF'] : []), ...(character.end === selectedRange?.end ? ['inset -2px 0 0 #2261CF'] : [])].join(', ');
    return <WebText key={character.start} dataSet={{ vocalCharacter: String(character.start) }} accessibilityRole="button" accessibilityLabel={`${character.start + 1}文字目「${character.text}」`} accessibilityState={{ selected }} style={selected ? [styles.selected, { boxShadow: shadow }] : undefined}>{character.text}</WebText>;
  })}</WebText>;
}

const styles = StyleSheet.create({
  lyricText: { userSelect: 'auto' },
  selected: { textDecorationLine: 'underline', textDecorationColor: '#2261CF' },
});

const webSurfaceStyle: React.CSSProperties = {
  position: 'relative',
  boxSizing: 'border-box',
  WebkitTouchCallout: 'none',
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
  userSelect: 'inherit',
  maxWidth: '100%',
  minWidth: 0,
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
};
