import { TextRange } from '@/domain/models';
import { CharacterBox, SelectionEdge } from '@/domain/services/textSelection';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

type HandleProps = { edge: SelectionEdge; box: CharacterBox; width: number; onStart(): void; onMove(x: number, y: number): void; onEnd(): void };
function Handle(props: HandleProps) {
  const latest = useRef(props);
  const grabOffset = useRef({ x: 0, y: 0 });
  useLayoutEffect(() => { latest.current = props; }, [props]);
  const [responder, setResponder] = useState<ReturnType<typeof PanResponder.create> | null>(null);
  useLayoutEffect(() => { setResponder(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      event.stopPropagation();
      const current = latest.current;
      const x = current.edge === 'start' ? current.box.x : current.box.x + current.box.width;
      const left = Math.max(0, Math.min(Math.max(0, current.width - 44), x - (current.edge === 'start' ? 40 : 4)));
      const stemX = Math.max(1, Math.min(41, x - left));
      // 掴んだ場所と文字の中心の差を保ち、折り返し先へ指が飛ばないようにする。
      grabOffset.current = { x: event.nativeEvent.locationX - stemX, y: event.nativeEvent.locationY + current.box.height / 2 - 3 };
      current.onStart();
    },
    onPanResponderMove: (event, gesture) => { event.stopPropagation(); latest.current.onMove(gesture.moveX - grabOffset.current.x, gesture.moveY - grabOffset.current.y); },
    onPanResponderRelease: () => latest.current.onEnd(),
    onPanResponderTerminate: () => latest.current.onEnd(),
    onPanResponderTerminationRequest: () => false,
  })); }, []);
  const x = props.edge === 'start' ? props.box.x : props.box.x + props.box.width;
  const left = Math.max(0, Math.min(Math.max(0, props.width - 44), x - (props.edge === 'start' ? 40 : 4)));
  const stemX = Math.max(1, Math.min(41, x - left));
  return <View testID={`selection-handle-${props.edge}`} accessibilityLabel={props.edge === 'start' ? '選択範囲の先頭ハンドル' : '選択範囲の末尾ハンドル'} style={[styles.hitArea, { left, top: props.box.y + props.box.height - 3 }]} {...responder?.panHandlers}>
    <View pointerEvents="none" style={[styles.stem, { left: stemX }]} />
    <View pointerEvents="none" style={[styles.knob, { left: Math.max(0, Math.min(28, stemX - 6)) }]} />
  </View>;
}
export function SelectionHandles({ range, boxes, width, onDragStart, onDrag, onDragEnd }: { range: TextRange; boxes: CharacterBox[]; width: number; onDragStart(): void; onDrag(edge: SelectionEdge, x: number, y: number): void; onDragEnd(): void }) {
  const start = boxes.find((b) => b.start === range.start);
  const end = boxes.find((b) => b.end === range.end);
  return <>{start && <Handle edge="start" box={start} width={width} onStart={onDragStart} onMove={(x, y) => onDrag('start', x, y)} onEnd={onDragEnd} />}{end && <Handle edge="end" box={end} width={width} onStart={onDragStart} onMove={(x, y) => onDrag('end', x, y)} onEnd={onDragEnd} />}</>;
}
const styles = StyleSheet.create({
  hitArea: { position: 'absolute', width: 44, height: 44, zIndex: 10, touchAction: 'none' },
  stem: { position: 'absolute', top: 0, width: 2, height: 9, backgroundColor: '#2261CF' },
  knob: { position: 'absolute', top: 5, width: 14, height: 14, borderRadius: 7, backgroundColor: '#2261CF', borderWidth: 1, borderColor: '#fff' },
});
