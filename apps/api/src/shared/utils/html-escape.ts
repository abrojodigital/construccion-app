/**
 * Escapes special HTML characters to prevent XSS injection.
 * Use this for any user-supplied string interpolated into HTML template literals
 * that are served with Content-Type: text/html.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
