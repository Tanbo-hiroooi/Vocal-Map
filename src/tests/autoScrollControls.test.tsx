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
