import { TextRange } from '@/domain/models';
import { PropsWithChildren } from 'react';
import { StyleProp, TextStyle } from 'react-native';

export type SelectionSurfaceProps = PropsWithChildren<{ accessibilityLabel: string; textLength: number; onPress(): void; onRangeSelect?(range: TextRange): void; onCharacterPress?(range: TextRange): void }>;
export type SegmentTextProps = { text: string; start: number; style: StyleProp<TextStyle>; selectedRange?: TextRange; onCharacterPress?(range: TextRange): void };
