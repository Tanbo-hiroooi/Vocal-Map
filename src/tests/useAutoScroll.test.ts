import { useAutoScroll } from '@/features/songs/useAutoScroll';
import { act, renderHook } from '@testing-library/react-native';
import { AppState, AppStateStatus, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

let frames: Map<number, FrameRequestCallback>;
let sequence: number;
let appStateChange: (state: AppStateStatus) => void;
const initialAppState = AppState.currentState;
beforeEach(() => {
  AppState.currentState = 'active';
  frames = new Map(); sequence = 0;
  jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => { frames.set(++sequence, callback); return sequence; });
  jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id) => { if (typeof id === 'number') frames.delete(id); });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => { appStateChange = callback; return { remove: jest.fn() }; });
});
afterEach(() => { jest.restoreAllMocks(); AppState.currentState = initialAppState; });
const layout = { nativeEvent: { layout: { height: 400, width: 320, x: 0, y: 0 } } } as LayoutChangeEvent;
async function tick(time: number) {
  const current = [...frames.values()]; frames.clear();
  await act(async () => current.forEach((callback) => callback(time)));
}
async function setup(speed = 3, contentHeight = 1800) {
  const scrollTo = jest.fn();
  const scrollRef = { current: { scrollTo } as unknown as ScrollView };
  const hook = await renderHook((value: number) => useAutoScroll(scrollRef, value), { initialProps: speed });
  await act(async () => { hook.result.current.onLayout(layout); hook.result.current.onContentSizeChange(320, contentHeight); });
  return { ...hook, scrollTo };
}

test('停止状態から始まり、任意位置で開始・停止・再開できる', async () => {
  const hook = await setup();
  expect(hook.result.current.running).toBe(false);
  await act(async () => hook.result.current.start(200));
  await tick(0); await tick(100);
  expect(hook.scrollTo).toHaveBeenLastCalledWith({ y: 202.4, animated: false });
  await act(async () => hook.result.current.pause());
  expect(frames.size).toBe(0);
  const count = hook.scrollTo.mock.calls.length; await tick(200);
  expect(hook.scrollTo).toHaveBeenCalledTimes(count);
  await act(async () => hook.result.current.start(200));
  await tick(300); await tick(400);
  expect(hook.scrollTo.mock.calls.at(-1)![0].y).toBeCloseTo(204.8);
  await hook.unmount(); expect(frames.size).toBe(0);
});

test('実行中に速度を変えても位置を戻さず、新しい速度に反映する', async () => {
  const hook = await setup();
  await act(async () => hook.result.current.start());
  await tick(0); await tick(100);
  expect(hook.scrollTo.mock.calls.at(-1)![0].y).toBeCloseTo(2.4);
  await hook.rerender(6); await tick(200);
  expect(hook.scrollTo.mock.calls.at(-1)![0].y).toBeCloseTo(7.2);
  await hook.unmount();
});

test('末尾で自動停止し、再開始は歌詞の先頭へ戻る', async () => {
  const hook = await setup(10, 700);
  await act(async () => hook.result.current.onScroll({ nativeEvent: { contentOffset: { y: 299 } } } as NativeSyntheticEvent<NativeScrollEvent>));
  await act(async () => hook.result.current.start(100));
  await tick(0); await tick(100);
  expect(hook.result.current.running).toBe(false);
  expect(hook.result.current.finished).toBe(true);
  expect(hook.scrollTo).toHaveBeenLastCalledWith({ y: 300, animated: false });
  await act(async () => hook.result.current.start(100));
  expect(hook.scrollTo).toHaveBeenLastCalledWith({ y: 100, animated: false });
  await hook.unmount();
});

test('バックグラウンドへ移ると停止し、復帰しても勝手に再開しない', async () => {
  const hook = await setup();
  await act(async () => hook.result.current.start());
  await tick(0); await tick(100);
  await act(async () => appStateChange('background'));
  expect(hook.result.current.running).toBe(false); expect(frames.size).toBe(0);
  await act(async () => appStateChange('active'));
  expect(hook.result.current.running).toBe(false);
  await hook.unmount();
});

test('短い内容では開始せず、画面幅・高さが変わった時にも停止する', async () => {
  const hook = await setup(3, 300);
  expect(hook.result.current.canScroll).toBe(false);
  await act(async () => hook.result.current.start());
  expect(hook.result.current.running).toBe(false);
  await act(async () => hook.result.current.onContentSizeChange(320, 1800));
  await act(async () => hook.result.current.start());
  await act(async () => hook.result.current.onLayout({ nativeEvent: { layout: { height: 401, width: 320, x: 0, y: 0 } } } as LayoutChangeEvent));
  expect(hook.result.current.running).toBe(true);
  await act(async () => hook.result.current.onLayout({ nativeEvent: { layout: { height: 500, width: 320, x: 0, y: 0 } } } as LayoutChangeEvent));
  expect(hook.result.current.running).toBe(false); expect(frames.size).toBe(0);
  await hook.unmount();
});
