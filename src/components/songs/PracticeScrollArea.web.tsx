import React, { PropsWithChildren } from 'react';

export function PracticeScrollArea({ children, onInterrupt }: PropsWithChildren<{ onInterrupt(): void }>) {
  return <div data-testid="practice-scroll-area" onPointerDown={onInterrupt} onWheel={onInterrupt} onKeyDown={(event) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) onInterrupt();
  }} style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>;
}
