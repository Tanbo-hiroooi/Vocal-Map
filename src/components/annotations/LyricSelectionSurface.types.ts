import { TextRange } from '@/domain/models';
import { PropsWithChildren } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { SelectionEdge } from '@/domain/services/textSelection';

export type SelectionCallbacks = { onCharacterLongPress?(range: TextRange): void; onSelectionEdgeChange?(edge: SelectionEdge, index: number): void; onSelectionDragging?(dragging: boolean): void };
export type SelectionSurfaceProps = PropsWithChildren<{ accessibilityLabel: string; textLength: number; selectedRange?: TextRange; onPress(): void; onRangeSelect?(range: TextRange): void; onCharacterPress?(range: TextRange): void } & SelectionCallbacks>;
export type SegmentTextProps = { text: string; start: number; style: StyleProp<TextStyle>; selectedRange?: TextRange; onCharacterPress?(range: TextRange): void } & Pick<SelectionCallbacks, 'onCharacterLongPress'>;
