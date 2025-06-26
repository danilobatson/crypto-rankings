import { clsx, type ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function getCoinSymbol(coinName: string): string {
  // Extract symbol from "CoinName (SYMBOL)" format
  const match = coinName.match(/\(([^)]+)\)$/);
  return match ? match[1] : coinName.split(' ')[0].toUpperCase();
}

export function getCoinName(coinName: string): string {
  // Extract name without symbol
  const match = coinName.match(/^(.+?)\s*\(/);
  return match ? match[1].trim() : coinName;
}
