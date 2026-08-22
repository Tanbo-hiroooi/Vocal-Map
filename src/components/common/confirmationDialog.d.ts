export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  destructive?: boolean,
): Promise<boolean>;

export function chooseAction<T extends string>(
  title: string,
  message: string,
  choices: readonly { label: string; value: T; destructive?: boolean }[],
): Promise<T | null>;
