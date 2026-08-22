import { AppSettings, Song, SymbolDefinition } from '@/domain/models';
import { vocalMapRepository } from '@/repositories/LocalVocalMapRepository';
import { defaultSettings } from '@/storage/migrations';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AppContextValue = {
  songs: Song[]; symbols: SymbolDefinition[]; settings: AppSettings; loading: boolean; error: string | null;
  refresh(): Promise<void>; saveSong(song: Song): Promise<void>; deleteSong(id: string): Promise<void>;
  saveSymbol(symbol: SymbolDefinition): Promise<void>; deleteSymbol(id: string): Promise<void>; saveSettings(settings: AppSettings): Promise<void>;
};
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [symbols, setSymbols] = useState<SymbolDefinition[]>([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [nextSongs, nextSymbols, nextSettings] = await Promise.all([vocalMapRepository.getSongs(), vocalMapRepository.getSymbols(), vocalMapRepository.getSettings()]);
      setSongs(nextSongs); setSymbols(nextSymbols); setSettings(nextSettings);
    } catch (e) { setError(e instanceof Error ? e.message : 'データを読み込めませんでした。'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => void refresh(), 0); return () => clearTimeout(timer); }, [refresh]);
  const wrap = useCallback(async (action: () => Promise<void>) => { try { setError(null); await action(); await refresh(); } catch (e) { const message = e instanceof Error ? e.message : '保存に失敗しました。'; setError(message); throw e; } }, [refresh]);
  const value = useMemo<AppContextValue>(() => ({ songs, symbols, settings, loading, error, refresh,
    saveSong: (song) => wrap(() => vocalMapRepository.saveSong(song)), deleteSong: (id) => wrap(() => vocalMapRepository.deleteSong(id)),
    saveSymbol: (symbol) => wrap(() => vocalMapRepository.saveSymbol(symbol)), deleteSymbol: (id) => wrap(() => vocalMapRepository.deleteSymbol(id)),
    saveSettings: (value) => wrap(() => vocalMapRepository.saveSettings(value)),
  }), [songs, symbols, settings, loading, error, refresh, wrap]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useAppData() { const value = useContext(AppContext); if (!value) throw new Error('AppProviderが必要です。'); return value; }
