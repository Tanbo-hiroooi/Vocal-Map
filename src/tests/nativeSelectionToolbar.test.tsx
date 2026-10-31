/** @jest-environment jsdom */
import React, { act, useState } from 'react';
import { LyricSelectionSurface, LyricSegmentText } from '@/components/annotations/LyricSelectionSurface.web';
import { QuickAnnotationToolbar } from '@/components/annotations/QuickAnnotationToolbar';
import { TextRange } from '@/domain/models';

// ブラウザのSelection APIと実際の編集欄を接続して検証する。
jest.mock('react-native', () => {
  const React = jest.requireActual('react');
  const element = (tag: string) => function NativePrimitive({ children, testID, accessibilityLabel, accessibilityRole, onPress, disabled, dataSet, style }: any) { return React.createElement(tag, {
    'data-testid': testID, 'aria-label': accessibilityLabel, role: accessibilityRole,
    'data-native-style': style ? JSON.stringify([style].flat(Infinity).filter(Boolean)) : undefined,
    onClick: onPress, disabled, ...Object.fromEntries(Object.entries(dataSet ?? {}).map(([key, value]) => [`data-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, value])),
  }, children); };
  const primitives = { Text: element('span'), View: element('div'), Pressable: element('button'), TextInput: element('input'), ActivityIndicator: element('span'), StyleSheet: { create: (styles: any) => styles } };
  return Object.create(jest.requireActual('react-native'), Object.fromEntries(Object.entries(primitives).map(([key, value]) => [key, { value, enumerable: true }])));
});

test('標準の文字選択後、編集欄が自動で開き、一度の操作で選択範囲へ色分けできる', async () => {
  const { createRoot } = jest.requireActual<{ createRoot(node: HTMLElement): { render(children: React.ReactNode): void; unmount(): void } }>('react-dom/client');
  const save = jest.fn(async () => {});
  function Screen() {
    const [range, setRange] = useState<TextRange>();
    return <>
      <LyricSelectionSurface accessibilityLabel="歌詞" textLength={6} onPress={() => {}} onRangeSelect={setRange} selectedRange={range}>
        <LyricSegmentText text="君に伝えたい" start={0} style={{}} />
      </LyricSelectionSurface>
      {range && <QuickAnnotationToolbar line={{ id: 'line', text: '君に伝えたい', order: 0, annotations: [] }} symbols={[]} range={range} awaitingEnd={false} onSave={save} onDelete={async () => {}} onClose={() => setRange(undefined)} onReselect={() => {}} onSelectLine={() => {}} />}
    </>;
  }
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<Screen />));
    expect(host.querySelector('[data-testid="quick-annotation-toolbar"]')).toBeNull();
    const text = host.querySelector('[data-vocal-start]')!.firstChild!;
    await act(async () => {
      const selection = window.getSelection()!; const native = document.createRange();
      native.setStart(text, 2); native.setEnd(text, 6); selection.addRange(native);
      document.dispatchEvent(new Event('selectionchange'));
    });
    expect(host.querySelector('[data-testid="selection-summary"]')?.textContent).toBe('選択中：「伝えたい」');
    await act(async () => { (Array.from(host.querySelectorAll('button')).find((node) => node.textContent === '色分け')!).click(); });
    await act(async () => { (host.querySelector('[aria-label="裏声で色分け"]') as HTMLButtonElement).click(); });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]).toEqual([expect.objectContaining({ range: { start: 2, end: 6 }, targetTextSnapshot: '伝えたい', highlight: { label: '裏声', color: '#E9E3FF' } })]);
  } finally {
    await act(async () => root.unmount()); host.remove(); window.getSelection()?.removeAllRanges();
  }
});

test('スマホの長押し選択では編集へ割り込まず、タップした文字を通知する', async () => {
  const { createRoot } = jest.requireActual<{ createRoot(node: HTMLElement): { render(children: React.ReactNode): void; unmount(): void } }>('react-dom/client');
  const onRangeSelect = jest.fn(); const onCharacterPress = jest.fn();
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<LyricSelectionSurface accessibilityLabel="歌詞" textLength={6} onPress={() => {}} onRangeSelect={onRangeSelect} onCharacterPress={onCharacterPress}>
      <LyricSegmentText text="君に伝えたい" start={0} style={{}} onCharacterPress={onCharacterPress} selectedRange={{ start: 2, end: 4 }} />
    </LyricSelectionSurface>));
    const character = host.querySelector<HTMLElement>('[data-vocal-character="2"]')!;
    await act(async () => {
      const pointer = new Event('pointerdown', { bubbles: true }); Object.defineProperty(pointer, 'pointerType', { value: 'touch' });
      character.dispatchEvent(pointer);
      const native = document.createRange(); native.selectNodeContents(host.querySelector('[data-vocal-start]')!);
      window.getSelection()!.addRange(native);
      document.dispatchEvent(new Event('selectionchange'));
      character.dispatchEvent(new Event('touchend', { bubbles: true }));
    });
    expect(onRangeSelect).not.toHaveBeenCalled();
    expect(onCharacterPress).not.toHaveBeenCalled();
    expect(host.querySelector('[aria-label="歌詞"]')?.getAttribute('style')).toContain('user-select: none');
    await act(async () => character.click());
    expect(onCharacterPress.mock.calls).toEqual([[{ start: 2, end: 3 }]]);
    expect(character.getAttribute('data-native-style')).toContain('inset 0 -2px 0 #2261CF');
    expect(character.getAttribute('data-native-style')).not.toContain('textDecoration');
    expect(host.querySelector('[data-testid^="selection-handle-"]')).toBeNull();
  } finally {
    await act(async () => root.unmount()); host.remove(); window.getSelection()?.removeAllRanges();
  }
});

test('PCで同じ文字を続けてクリックしてもブラウザの単語選択を開始しない', async () => {
  const { createRoot } = jest.requireActual<{ createRoot(node: HTMLElement): { render(children: React.ReactNode): void; unmount(): void } }>('react-dom/client');
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<LyricSelectionSurface accessibilityLabel="歌詞" textLength={1} onPress={() => {}} onRangeSelect={() => {}}><span>君</span></LyricSelectionSurface>));
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, detail: 2 });
    await act(async () => { host.querySelector('span')!.dispatchEvent(down); });
    expect(down.defaultPrevented).toBe(true);
  } finally { await act(async () => root.unmount()); host.remove(); }
});
