export function createId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
    const value = Math.floor(Math.random() * 16);
    const digit = token === 'x' ? value : (value & 0x3) | 0x8;
    return digit.toString(16);
  });
}

export const nowIso = () => new Date().toISOString();
