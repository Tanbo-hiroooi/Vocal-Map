import { AutoScrollControls } from '@/components/songs/AutoScrollControls';
import { AutoScrollHeaderButton } from '@/components/songs/AutoScrollHeaderButton';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

test.each([1, 10])('速度%iで上下限を守り、開始・停止を操作できる', async (speed) => {
  const start = jest.fn(); const pause = jest.fn(); const change = jest.fn();
  const props = { speed, finished: false, canScroll: true, onStart: start, onPause: pause, onClose: jest.fn(), onSpeedChange: change };
  const view = await render(<AutoScrollControls {...props} running={false} />);
  expect(view.getByLabelText(speed === 1 ? '自動スクロールを遅くする' : '自動スクロールを速くする')).toBeDisabled();
  await fireEvent.press(view.getByLabelText(speed === 1 ? '自動スクロールを速くする' : '自動スクロールを遅くする'));
  expect(change).toHaveBeenCalledWith(speed === 1 ? 1 : -1);
  await fireEvent.press(view.getByLabelText('自動スクロールを開始')); expect(start).toHaveBeenCalledTimes(1);
  await view.rerender(<AutoScrollControls {...props} running />);
  await fireEvent.press(view.getByLabelText('自動スクロールを停止')); expect(pause).toHaveBeenCalledTimes(1);
});

test('閉じる操作では停止と親画面の非表示処理を呼ぶ', async () => {
  const pause = jest.fn(); const start = jest.fn(); const close = jest.fn();
  const props = { speed: 6, finished: false, canScroll: true, onStart: start, onPause: pause, onClose: close, onSpeedChange: jest.fn() };
  const view = await render(<AutoScrollControls {...props} running />);
  await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを閉じる'));
  expect(pause).toHaveBeenCalledTimes(1);
  expect(close).toHaveBeenCalledTimes(1);
  expect(start).not.toHaveBeenCalled();
});

test('パネルに保存エラーを表示する', async () => {
  const props = { running: false, speed: 3, finished: false, canScroll: true, onStart: jest.fn(), onPause: jest.fn(), onClose: jest.fn(), onSpeedChange: jest.fn() };
  const view = await render(<AutoScrollControls {...props} />);
  await view.rerender(<AutoScrollControls {...props} error="スクロール速度を保存できませんでした。" />);
  expect(view.getByRole('alert')).toHaveTextContent('スクロール速度を保存できませんでした。');
});

test('上部ボタンから操作パネルを開き、実行中は直接停止できる', async () => {
  const open = jest.fn(); const pause = jest.fn();
  const view = await render(<AutoScrollHeaderButton running={false} expanded={false} onOpen={open} onPause={pause} />);
  await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを開く'));
  expect(open).toHaveBeenCalledTimes(1);
  await view.rerender(<AutoScrollHeaderButton running expanded={false} onOpen={open} onPause={pause} />);
  await fireEvent.press(view.getByLabelText('自動スクロールをすぐ停止'));
  expect(pause).toHaveBeenCalledTimes(1);
  await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを開く'));
  expect(open).toHaveBeenCalledTimes(2);
});
