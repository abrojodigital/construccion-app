/**
 * Format a number as Argentine Pesos (ARS)
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: { showSymbol?: boolean; decimals?: number } = {}
): string {
  const { showSymbol = true, decimals = 2 } = options;

  if (amount === null || amount === undefined) {
    return showSymbol ? '$ 0,00' : '0,00';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return showSymbol ? '$ 0,00' : '0,00';
  }

  const formatted = numAmount.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `$ ${formatted}` : formatted;
}

/**
 * Parse a currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value
    .replace(/[^0-9,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Format a date for display
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  };

  return d.toLocaleDateString('es-AR', defaultOptions);
}

/**
 * Format a date with time
 */
export function formatDateTime(
  date: Date | string | null | undefined
): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  return d.toISOString().split('T')[0];
}

/**
 * Get relative time string (e.g., "hace 2 días")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes === 0) return 'Ahora';
      return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    }
    return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  }

  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;

  return `Hace ${Math.floor(diffDays / 365)} año${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
}

/**
 * Calculate days remaining until a date
 */
export function getDaysRemaining(date: Date | string | null | undefined): number | null {
  if (!date) return null;

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  const diffMs = d.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Generate a sequential code with prefix
 */
export function generateCode(prefix: string, sequence: number, year?: number): string {
  const y = year || new Date().getFullYear();
  const seq = sequence.toString().padStart(5, '0');
  return `${prefix}-${y}-${seq}`;
}

/**
 * Validate CUIT/CUIL argentino
 */
export function validateCUIT(cuit: string): boolean {
  const cleaned = cuit.replace(/[-\s]/g, '');

  if (!/^\d{11}$/.test(cleaned)) return false;

  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * multipliers[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;

  return checkDigit === parseInt(cleaned[10]);
}

/**
 * Format CUIT/CUIL for display (XX-XXXXXXXX-X)
 */
export function formatCUIT(cuit: string): string {
  const cleaned = cuit.replace(/[-\s]/g, '');
  if (cleaned.length !== 11) return cuit;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
}

/**
 * Validate DNI argentino
 */
export function validateDNI(dni: string): boolean {
  const cleaned = dni.replace(/\./g, '');
  return /^\d{7,8}$/.test(cleaned);
}

/**
 * Format DNI for display (XX.XXX.XXX)
 */
export function formatDNI(dni: string): string {
  const cleaned = dni.replace(/\./g, '');
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Validate CBU argentino
 */
export function validateCBU(cbu: string): boolean {
  const cleaned = cbu.replace(/\s/g, '');

  if (!/^\d{22}$/.test(cleaned)) return false;

  // Validate first block (bank and branch)
  const block1 = cleaned.slice(0, 8);
  const multipliers1 = [7, 1, 3, 9, 7, 1, 3];
  let sum1 = 0;
  for (let i = 0; i < 7; i++) {
    sum1 += parseInt(block1[i]) * multipliers1[i];
  }
  const check1 = (10 - (sum1 % 10)) % 10;
  if (check1 !== parseInt(block1[7])) return false;

  // Validate second block (account)
  const block2 = cleaned.slice(8);
  const multipliers2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(block2[i]) * multipliers2[i];
  }
  const check2 = (10 - (sum2 % 10)) % 10;
  return check2 === parseInt(block2[13]);
}

/**
 * Calculate IVA amount
 */
export function calculateIVA(amount: number, rate: number = 21): number {
  return amount * (rate / 100);
}

/**
 * Calculate total with IVA
 */
export function calculateTotalWithIVA(amount: number, rate: number = 21): number {
  return amount + calculateIVA(amount, rate);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Get initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Get full name
 */
export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Slugify a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
