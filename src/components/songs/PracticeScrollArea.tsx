import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';

export function PracticeScrollArea({ children, onInterrupt }: PropsWithChildren<{ onInterrupt(): void }>) {
  return <View testID="practice-scroll-area" onTouchStart={onInterrupt} style={{ flex: 1, minHeight: 0, minWidth: 0 }}>{children}</View>;
}
