import { Alert } from 'react-native';

export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  destructive = false,
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'キャンセル', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function chooseAction<T extends string>(
  title: string,
  message: string,
  choices: readonly { label: string; value: T; destructive?: boolean }[],
): Promise<T | null> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'キャンセル', style: 'cancel', onPress: () => resolve(null) },
        ...choices.map((choice) => ({
          text: choice.label,
          style: choice.destructive ? 'destructive' as const : 'default' as const,
          onPress: () => resolve(choice.value),
        })),
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}
