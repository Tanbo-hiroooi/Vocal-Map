import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function exportJsonFile(json: string): Promise<void> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = new File(Paths.cache, `vocal-map-backup-${stamp}.json`);
  file.create(); file.write(json);
  if (!(await Sharing.isAvailableAsync())) throw new Error('この端末では共有機能を利用できません。');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Vocal Mapのバックアップを保存' });
}
export async function pickJsonFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (result.canceled) return null;
  return new File(result.assets[0].uri).text();
}
