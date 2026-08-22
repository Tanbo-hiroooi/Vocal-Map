function dialogMessage(title: string, message: string, instruction: string): string {
  return [title, message, instruction].filter(Boolean).join('\n\n');
}

export async function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  _destructive = false,
): Promise<boolean> {
  return window.confirm(dialogMessage(
    title,
    message,
    `「${confirmLabel}」を実行する場合はOK、取りやめる場合はキャンセルを選択してください。`,
  ));
}

export async function chooseAction<T extends string>(
  title: string,
  message: string,
  choices: readonly { label: string; value: T; destructive?: boolean }[],
): Promise<T | null> {
  const options = choices.map((choice, index) => `${index + 1}: ${choice.label}`).join('\n');
  const promptMessage = dialogMessage(
    title,
    message,
    `${options}\n\n選択肢の番号を入力してください。取りやめる場合はキャンセルを選択してください。`,
  );

  while (true) {
    const answer = window.prompt(promptMessage, '');
    if (answer === null || answer.trim() === '') return null;

    const selectedIndex = Number(answer.trim()) - 1;
    if (Number.isInteger(selectedIndex) && choices[selectedIndex]) return choices[selectedIndex].value;

    window.alert('選択肢の番号を入力してください。');
  }
}
