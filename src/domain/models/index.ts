export type AnnotationPosition = 'above' | 'below' | 'before' | 'after' | 'inline' | 'line-note';
export type SymbolCategory = 'arrow' | 'breath' | 'dynamics' | 'vocal' | 'expression' | 'custom';
export type TextRange = { start: number; end: number };
export type TextBoundary = {
  index: number;
  beforeTextSnapshot: string;
  afterTextSnapshot: string;
};

export type Annotation = {
  id: string;
  symbolId: string;
  position: AnnotationPosition;
  targetType: 'line' | 'range' | 'boundary';
  range?: TextRange;
  highlight?: { label: string; color: string };
  boundary?: TextBoundary;
  targetTextSnapshot?: string;
  customText?: string;
  memo?: string;
  colorOverride?: string;
  status: 'valid' | 'needs-review';
  createdAt: string;
  updatedAt: string;
};

export type LyricLine = { id: string; text: string; order: number; annotations: Annotation[] };
export type Song = {
  id: string;
  title: string;
  artist?: string;
  memo?: string;
  lyrics: LyricLine[];
  createdAt: string;
  updatedAt: string;
};
export type SymbolDefinition = {
  id: string;
  symbol: string;
  name: string;
  meaning: string;
  category: SymbolCategory;
  color?: string;
  isPreset: boolean;
  isFavorite: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};
export type AppSettings = {
  defaultFontSize: number;
  practiceFontSize: number;
  lyricLineSpacing: number;
  colorScheme: 'system' | 'light' | 'dark';
};
export type AppData = {
  schemaVersion: number;
  songs: Song[];
  symbols: SymbolDefinition[];
  settings: AppSettings;
  exportedAt?: string;
};
export type AppExportData = AppData;
export type ImportMode = 'merge' | 'replace';
