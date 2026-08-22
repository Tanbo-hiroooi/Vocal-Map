import { TextRange } from '@/domain/models';
import { PropsWithChildren } from 'react';
import { StyleProp, TextStyle } from 'react-native';

export function LyricSelectionSurface(props: PropsWithChildren<{ accessibilityLabel: string; textLength: number; onPress(): void; onRangeSelect?(range: TextRange): void }>): React.JSX.Element;
export function LyricSegmentText(props: { text: string; start: number; style: StyleProp<TextStyle> }): React.JSX.Element;
