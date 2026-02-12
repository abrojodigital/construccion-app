import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export utilities from shared package
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercentage,
  getRelativeTime,
  getDaysRemaining,
  getInitials,
  getFullName,
  formatCUIT,
  formatDNI,
} from '@construccion/shared';
