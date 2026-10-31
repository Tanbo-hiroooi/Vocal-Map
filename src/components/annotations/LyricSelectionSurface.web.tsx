import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { SegmentTextProps, SelectionSurfaceProps } from './LyricSelectionSurface.types';
import { selectionCharacters } from '@/domain/services/textSelection';
import { boundaryOffset, observeNativeLyricSelection } from './nativeSelectionBridge.web';

type DomBoundary = { container: Node; offset: number };

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
  const inputKind = useRef('mouse');
  const [mouseMode, setMouseMode] = useState(false);
  const mouseSelecting = useRef(false);
  const rangeCallback = useRef(onRangeSelect);
  useLayoutEffect(() => { rangeCallback.current = onRangeSelect; }, [onRangeSelect]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const bridge = observeNativeLyricSelection(root, textLength, {
      // スマホではOSの長押し選択ではなく、先頭・末尾の2回タップだけを使う。
      canSync: () => inputKind.current === 'mouse' && !mouseSelecting.current,
      onRange: (range) => rangeCallback.current?.(range),
      onActive: () => {},
    });
    const releaseMouse = () => { mouseSelecting.current = false; bridge.sync(); };
    root.ownerDocument.addEventListener('mouseup', releaseMouse);
    return () => { bridge.dispose(); root.ownerDocument.removeEventListener('mouseup', releaseMouse); };
  }, [textLength]);
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    ignoreNextClick.current = false;
    inputKind.current = event.pointerType === 'mouse' ? 'mouse' : 'touch';
    setMouseMode(inputKind.current === 'mouse');
    if (inputKind.current === 'touch') {
      mouseSelecting.current = false;
      dragStart.current = null;
      window.getSelection()?.removeAllRanges();
    }
  };
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (inputKind.current !== 'mouse' || event.button !== 0 || !onRangeSelect) return;
    // 同じ文字を続けてクリックしても、ブラウザの単語選択で範囲を上書きしない。
    if (event.detail > 1) { event.preventDefault(); window.getSelection()?.removeAllRanges(); }
    mouseSelecting.current = true;
    const boundary = boundaryFromPoint(event.clientX, event.clientY);
    dragStart.current = boundary ? { ...boundary, x: event.clientX, y: event.clientY } : null;
  };
  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    mouseSelecting.current = false;
    if (inputKind.current !== 'mouse' || event.button !== 0 || !onRangeSelect) { dragStart.current = null; return; }
    const root = rootRef.current;
    const selection = window.getSelection();
    const nativeRange = selection && !selection.isCollapsed && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const startBoundary = nativeRange ? { container: nativeRange.startContainer, offset: nativeRange.startOffset } : dragStart.current;
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
    if (ignoreNextClick.current) { ignoreNextClick.current = false; return; }
    if (!pressCharacter(event.target)) onPress();
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!pressCharacter(event.target)) onPress();
    }
  };
  return <div ref={rootRef} role={onCharacterPress ? 'group' : 'button'} tabIndex={0} aria-label={accessibilityLabel}
    onPointerDown={handlePointerDown} onContextMenu={(event) => { if (inputKind.current === 'touch') event.preventDefault(); }}
    onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onClick={handleClick} onKeyDown={handleKeyDown}
    style={{ ...webSurfaceStyle, userSelect: mouseMode ? 'text' : 'none', WebkitUserSelect: mouseMode ? 'text' : 'none' }}>
    {children}
  </div>;
}

export function LyricSegmentText({ text, start, style, selectedRange, onCharacterPress }: SegmentTextProps) {
  const WebText = Text as unknown as React.ComponentType<React.ComponentProps<typeof Text> & { dataSet: Record<string, string> }>;
  return <WebText dataSet={{ vocalStart: String(start) }} style={[style, webLyricTextStyle as TextStyle]}>{!onCharacterPress ? text : selectionCharacters(text, start).map((character) => {
    const selected = !!selectedRange && character.start < selectedRange.end && character.end > selectedRange.start;
    return <WebText key={character.start} dataSet={{ vocalCharacter: String(character.start) }} accessibilityRole="button" accessibilityLabel={`${character.start + 1}文字目「${character.text}」`} accessibilityState={{ selected }} style={[webCharacterStyle as TextStyle, selected && styles.selected]}>{character.text}</WebText>;
  })}</WebText>;
}

const styles = StyleSheet.create({
  selected: { boxShadow: 'inset 0 -2px 0 #2261CF' },
});
const webCharacterStyle: React.CSSProperties = { userSelect: 'inherit' };
const webSurfaceStyle: React.CSSProperties = {
  width: '100%', maxWidth: '100%', minWidth: 0, minHeight: 44,
  display: 'flex', justifyContent: 'center', cursor: 'text',
  WebkitTouchCallout: 'none', overflowWrap: 'anywhere', wordBreak: 'break-word',
};
const webLyricTextStyle: React.CSSProperties = {
  userSelect: 'inherit', maxWidth: '100%', minWidth: 0,
  overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'pre-wrap',
};
