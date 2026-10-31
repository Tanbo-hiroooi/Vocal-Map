import { AppSettings } from '@/domain/models';
import { MAX_AUTO_SCROLL_SPEED, MIN_AUTO_SCROLL_SPEED, normalizeAutoScrollSpeed } from '@/domain/services/autoScroll';
import { useEffect, useRef, useState } from 'react';

type PracticeValues = { fontSize: number; lineSpacing: number; autoScrollSpeed: number };
const valuesOf = (settings: AppSettings): PracticeValues => ({ fontSize: settings.practiceFontSize, lineSpacing: settings.lyricLineSpacing, autoScrollSpeed: normalizeAutoScrollSpeed(settings.autoScrollSpeed) });

export function usePracticeSettings(settings: AppSettings, loading: boolean, saveSettings: (settings: AppSettings) => Promise<void>) {
  const [values, setValues] = useState(() => valuesOf(settings));
  const latest = useRef(values);
  const loaded = useRef(false);
  const saveVersion = useRef(0);
  const [error, setError] = useState('');
  useEffect(() => {
    if (loading || loaded.current) return;
    const initial = valuesOf(settings);
    latest.current = initial; setValues(initial); loaded.current = true;
  }, [loading, settings]);

  const change = (field: keyof PracticeValues, delta: number) => {
    const current = latest.current;
    const [min, max] = field === 'fontSize' ? [20, 42] : field === 'lineSpacing' ? [0, 24] : [MIN_AUTO_SCROLL_SPEED, MAX_AUTO_SCROLL_SPEED];
    const next = { ...current, [field]: Math.max(min, Math.min(max, current[field] + delta)) };
    if (next[field] === current[field]) return;
    latest.current = next; setValues(next); setError('');
    const version = ++saveVersion.current;
    // 3つの値を同じスナップショットから保存し、連続操作で他の設定を古い値に戻さない。
    void saveSettings({ ...settings, practiceFontSize: next.fontSize, lyricLineSpacing: next.lineSpacing, autoScrollSpeed: next.autoScrollSpeed }).catch(() => {
      if (version === saveVersion.current) setError(field === 'autoScrollSpeed' ? 'スクロール速度を保存できませんでした。もう一度変更してお試しください。' : '文字サイズ・行間を保存できませんでした。もう一度変更してお試しください。');
    });
  };
  return { ...values, error, change };
}
