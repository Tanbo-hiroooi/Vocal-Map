export const MIN_AUTO_SCROLL_SPEED = 1;
export const MAX_AUTO_SCROLL_SPEED = 10;
export const DEFAULT_AUTO_SCROLL_SPEED = 3;

export function validAutoScrollSpeed(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= MIN_AUTO_SCROLL_SPEED && value <= MAX_AUTO_SCROLL_SPEED;
}

export function normalizeAutoScrollSpeed(value: unknown): number {
  return validAutoScrollSpeed(value) ? value : DEFAULT_AUTO_SCROLL_SPEED;
}

// 速度はフレーム数ではなく経過時間に比例させ、端末のリフレッシュレートに依存させない。
export function nextScrollOffset(offset: number, maxOffset: number, speed: number, elapsedMs: number): number {
  const distance = normalizeAutoScrollSpeed(speed) * 8 * Math.max(0, Math.min(elapsedMs, 100)) / 1000;
  return Math.max(0, Math.min(Math.max(0, maxOffset), offset + distance));
}
