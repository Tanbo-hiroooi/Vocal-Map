/** @jest-environment jsdom */
import React, { act } from 'react';
import { PracticeScrollArea } from '@/components/songs/PracticeScrollArea.web';

test('Webではホイール・タッチ開始・スクロールキーで停止し、通常の操作を妨げない', async () => {
  const { createRoot } = jest.requireActual<{ createRoot(node: HTMLElement): { render(children: React.ReactNode): void; unmount(): void } }>('react-dom/client');
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host); const pause = jest.fn();
  try {
    await act(async () => root.render(<PracticeScrollArea onInterrupt={pause}><span>歌詞</span></PracticeScrollArea>));
    const lyric = host.querySelector('span')!;
    const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 });
    await act(async () => lyric.dispatchEvent(wheel));
    expect(pause).toHaveBeenCalledTimes(1); expect(wheel.defaultPrevented).toBe(false);
    await act(async () => lyric.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    await act(async () => lyric.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true })));
    expect(pause).toHaveBeenCalledTimes(3);
    await act(async () => lyric.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true })));
    expect(pause).toHaveBeenCalledTimes(3);
  } finally { await act(async () => root.unmount()); host.remove(); }
});

test('自動移動自身のscrollイベントでは停止しない', async () => {
  const { createRoot } = jest.requireActual<{ createRoot(node: HTMLElement): { render(children: React.ReactNode): void; unmount(): void } }>('react-dom/client');
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host); const pause = jest.fn();
  try {
    await act(async () => root.render(<PracticeScrollArea onInterrupt={pause}><div>歌詞</div></PracticeScrollArea>));
    await act(async () => host.firstChild!.dispatchEvent(new Event('scroll', { bubbles: true })));
    expect(pause).not.toHaveBeenCalled();
  } finally { await act(async () => root.unmount()); host.remove(); }
});
