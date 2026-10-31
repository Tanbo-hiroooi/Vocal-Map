import { nextScrollOffset } from '@/domain/services/autoScroll';
import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

export function useAutoScroll(scrollRef: RefObject<ScrollView | null>, speed: number) {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const playing = useRef(false);
  const frame = useRef<number | null>(null);
  const position = useRef(0);
  const metrics = useRef({ width: 0, height: 0, contentHeight: 0 });
  const speedRef = useRef(speed);
  useLayoutEffect(() => { speedRef.current = speed; }, [speed]);
  const pause = useCallback(() => {
    playing.current = false;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setRunning(false);
  }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state !== 'active') pause(); });
    return () => subscription.remove();
  }, [pause]);
  useEffect(() => {
    if (!running) return;
    let previousTime: number | undefined;
    const tick = (time: number) => {
      if (!playing.current) return;
      const max = Math.max(0, metrics.current.contentHeight - metrics.current.height);
      position.current = nextScrollOffset(position.current, max, speedRef.current, previousTime === undefined ? 0 : time - previousTime);
      previousTime = time;
      scrollRef.current?.scrollTo({ y: position.current, animated: false });
      if (position.current >= max - .5) { setFinished(true); pause(); return; }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      playing.current = false;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [running, pause, scrollRef]);
  const start = useCallback((lyricsTop = 0) => {
    const max = Math.max(0, metrics.current.contentHeight - metrics.current.height);
    if (max <= 1 || !scrollRef.current || (AppState.currentState && AppState.currentState !== 'active')) return;
    const beginning = Math.max(0, Math.min(lyricsTop, max));
    position.current = position.current >= max - .5 ? beginning : Math.max(beginning, Math.min(position.current, max));
    scrollRef.current.scrollTo({ y: position.current, animated: false });
    setFinished(false); playing.current = true; setRunning(true);
  }, [scrollRef]);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!playing.current) {
      position.current = Math.max(0, event.nativeEvent.contentOffset.y);
      if (position.current < metrics.current.contentHeight - metrics.current.height - .5) setFinished(false);
    }
  }, []);
  const updateMetrics = useCallback(() => {
    setCanScroll(metrics.current.contentHeight - metrics.current.height > 1);
  }, []);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    const width = event.nativeEvent.layout.width;
    // 開始・停止ボタンの枠線やブラウザの丸めによる1px程度の揺れは画面回転と区別する。
    if (metrics.current.height && (Math.abs(metrics.current.height - height) > 2 || Math.abs(metrics.current.width - width) > 2)) pause();
    metrics.current.height = height; metrics.current.width = width; updateMetrics();
  }, [pause, updateMetrics]);
  const onContentSizeChange = useCallback((_width: number, height: number) => {
    metrics.current.contentHeight = height; updateMetrics();
  }, [updateMetrics]);
  return { running, finished, canScroll, start, pause, onScroll, onLayout, onContentSizeChange };
}
