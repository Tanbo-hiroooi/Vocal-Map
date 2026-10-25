import { TextRange } from '@/domain/models';

export function boundaryOffset(root: HTMLElement, container: Node, offset: number): number | null {
  if (!root.contains(container)) return null;
  const element = container.nodeType === Node.ELEMENT_NODE ? container as Element : container.parentElement;
  const segment = element?.closest<HTMLElement>('[data-vocal-start]');
  if (segment && root.contains(segment)) {
    const start = Number(segment.dataset.vocalStart);
    if (!Number.isFinite(start)) return null;
    try {
      const prefix = root.ownerDocument.createRange();
      prefix.selectNodeContents(segment); prefix.setEnd(container, offset);
      return start + prefix.toString().length;
    } catch { return null; }
  }
  // Safariではテキストノードではなく、親要素の子ノード境界を返す場合もある。
  if (container.nodeType !== Node.ELEMENT_NODE) return null;
  let end: number | null = null;
  for (const lyric of root.querySelectorAll<HTMLElement>('[data-vocal-start]')) {
    const start = Number(lyric.dataset.vocalStart);
    if (!Number.isFinite(start)) continue;
    const contents = root.ownerDocument.createRange(); contents.selectNodeContents(lyric);
    try {
      if (contents.comparePoint(container, offset) <= 0) return start;
      end = start + (lyric.textContent?.length ?? 0);
    } catch { return null; }
  }
  return end;
}

export function readLyricSelection(root: HTMLElement, selection: Selection | null, textLength: number): TextRange | null {
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const native = selection.getRangeAt(0);
  const start = boundaryOffset(root, native.startContainer, native.startOffset);
  const end = boundaryOffset(root, native.endContainer, native.endOffset);
  if (start === null || end === null) return null;
  const range = { start: Math.max(0, Math.min(start, end)), end: Math.min(textLength, Math.max(start, end)) };
  return range.start < range.end ? range : null;
}

export function observeNativeLyricSelection(root: HTMLElement, textLength: number, options: {
  onRange(range: TextRange): void;
  onActive(active: boolean): void;
  canSync(): boolean;
}) {
  let lastRange = '';
  let active = false;
  const sync = () => {
    if (!options.canSync()) return;
    const range = readLyricSelection(root, root.ownerDocument.getSelection(), textLength);
    if (!range) {
      lastRange = '';
      if (active) { active = false; options.onActive(false); }
      return;
    }
    if (!active) { active = true; options.onActive(true); }
    const signature = `${range.start}:${range.end}`;
    if (signature === lastRange) return;
    lastRange = signature;
    options.onRange(range);
  };
  const document = root.ownerDocument;
  document.addEventListener('selectionchange', sync);
  root.addEventListener('touchend', sync, { passive: true });
  root.addEventListener('keyup', sync);
  return { sync, dispose: () => {
    document.removeEventListener('selectionchange', sync);
    root.removeEventListener('touchend', sync);
    root.removeEventListener('keyup', sync);
  } };
}
