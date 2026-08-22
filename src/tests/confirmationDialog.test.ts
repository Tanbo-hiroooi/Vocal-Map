import {
  chooseAction as chooseNativeAction,
  confirmAction as confirmNativeAction,
} from '@/components/common/confirmationDialog.native';
import {
  chooseAction as chooseWebAction,
  confirmAction as confirmWebAction,
} from '@/components/common/confirmationDialog.web';
import { Alert } from 'react-native';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

describe('確認ダイアログ', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  });

  test('nativeではAlertの確定ボタンを結果へ変換する', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.[1]?.onPress?.();
    });

    await expect(confirmNativeAction('削除しますか？', '元に戻せません。', '削除', true)).resolves.toBe(true);
    expect(alert.mock.calls[0][2]?.[1]).toMatchObject({ text: '削除', style: 'destructive' });
  });

  test('nativeではAlertで選んだ値を返す', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.[2]?.onPress?.();
    });

    await expect(chooseNativeAction('選択', '方法を選びます。', [
      { label: '追加', value: 'merge' },
      { label: '置き換え', value: 'replace', destructive: true },
    ])).resolves.toBe('replace');
  });

  test('webでは日本語のconfirmとpromptを使う', async () => {
    const confirm = jest.fn(() => true);
    const prompt = jest.fn(() => '2');
    const alert = jest.fn();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { confirm, prompt, alert },
    });

    await expect(confirmWebAction('削除しますか？', '元に戻せません。', '削除', true)).resolves.toBe(true);
    await expect(chooseWebAction('読み込み方法を選択', '方法を選びます。', [
      { label: '追加', value: 'merge' },
      { label: '置き換え', value: 'replace' },
    ])).resolves.toBe('replace');
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('「削除」を実行する場合はOK'));
    expect(prompt).toHaveBeenCalledWith(expect.stringContaining('2: 置き換え'), '');
  });
});
