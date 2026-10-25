/** @jest-environment jsdom */
import React, { act, useState } from 'react';
import { LyricSelectionSurface, LyricSegmentText } from '@/components/annotations/LyricSelectionSurface.web';
import { QuickAnnotationToolbar } from '@/components/annotations/QuickAnnotationToolbar';
import { TextRange } from '@/domain/models';

// ブラウザのSelection APIと実際の編集欄を接続して検証する。
jest.mock('react-native', () => {
  const React = jest.requireActual('react');
  const element = (tag: string) => function NativePrimitive({ children, testID, accessibilityLabel, accessibilityRole, onPress, disabled, dataSet }: any) { return React.createElement(tag, {
    'data-testid': testID, 'aria-label': accessibilityLabel, role: accessibilityRole,
    onClick: onPress, disabled, ...Object.fromEntries(Object.entries(dataSet ?? {}).map(([key, value]) => [`data-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, value])),
  }, children); };
  const primitives = { Text: element('span'), View: element('div'), Pressable: element('button'), TextInput: element('input'), ActivityIndicator: element('span'), StyleSheet: { create: (styles: any) => styles } };
  return Object.create(jest.requireActual('react-native'), Object.fromEntries(Object.entries(primitives).map(([key, value]) => [key, { value, enumerable: true }])));
});
jest.mock('@/components/annotations/SelectionHandles', () => ({ SelectionHandles: () => null }));

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
