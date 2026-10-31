import { AutoScrollControls } from '@/components/songs/AutoScrollControls';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

test.each([1, 10])('速度%iで上下限を守り、開始・停止を操作できる', async (speed) => {
  const start = jest.fn(); const pause = jest.fn(); const change = jest.fn();
  const props = { speed, finished: false, canScroll: true, onStart: start, onPause: pause, onSpeedChange: change };
  const view = await render(<AutoScrollControls {...props} running={false} />);
  expect(view.getByLabelText(speed === 1 ? '自動スクロールを遅くする' : '自動スクロールを速くする')).toBeDisabled();
  await fireEvent.press(view.getByLabelText(speed === 1 ? '自動スクロールを速くする' : '自動スクロールを遅くする'));
  expect(change).toHaveBeenCalledWith(speed === 1 ? 1 : -1);
  await fireEvent.press(view.getByLabelText('自動スクロールを開始')); expect(start).toHaveBeenCalledTimes(1);
  await view.rerender(<AutoScrollControls {...props} running />);
  await fireEvent.press(view.getByLabelText('自動スクロールを停止')); expect(pause).toHaveBeenCalledTimes(1);
});

test('パネルを閉じると停止し、再表示しても速度を維持して勝手に開始しない', async () => {
  const pause = jest.fn(); const start = jest.fn();
  const props = { speed: 6, finished: false, canScroll: true, onStart: start, onPause: pause, onSpeedChange: jest.fn() };
  const view = await render(<AutoScrollControls {...props} running />);
  await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを閉じる'));
  expect(pause).toHaveBeenCalledTimes(1);
  expect(view.queryByTestId('auto-scroll-controls')).toBeNull();
  expect(view.queryByTestId('auto-scroll-speed')).toBeNull();
  expect(view.getByTestId('auto-scroll-collapsed')).toBeTruthy();
  await view.rerender(<AutoScrollControls {...props} running={false} />);
  await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを開く'));
  expect(view.getByLabelText('スクロール速度 6、10段階')).toBeTruthy();
  expect(view.getByLabelText('自動スクロールを開始')).toBeTruthy();
  expect(start).not.toHaveBeenCalled();
});

test('閉じた後に保存エラーが届いても、メッセージを見失わない', async () => {
  const props = { running: false, speed: 3, finished: false, canScroll: true, onStart: jest.fn(), onPause: jest.fn(), onSpeedChange: jest.fn() };
  const view = await render(<AutoScrollControls {...props} />);
  await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを閉じる'));
  await view.rerender(<AutoScrollControls {...props} error="スクロール速度を保存できませんでした。" />);
  expect(view.getByRole('alert')).toHaveTextContent('スクロール速度を保存できませんでした。');
});
