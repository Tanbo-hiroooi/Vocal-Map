export async function exportJsonFile(json: string): Promise<void> {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
  anchor.href=url; anchor.download=`vocal-map-backup-${new Date().toISOString().slice(0,10)}.json`; anchor.click(); URL.revokeObjectURL(url);
}
export async function pickJsonFile(): Promise<string | null> {
  return new Promise((resolve) => { const input=document.createElement('input'); input.type='file'; input.accept='application/json,.json';
    input.onchange=async()=>{const file=input.files?.[0];resolve(file?await file.text():null)}; input.click(); });
}
