export function DateUnixIsFromCurrentHour(timestamp: number): boolean {
  const date = new Date(timestamp);
  const now = new Date();

  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate() &&
    date.getHours() === now.getHours();
}

export const bruh: string = 'bruh';

export function bruhFunction(): string {
  return bruh + ' moment';
}
