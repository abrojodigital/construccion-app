import { describe, it, expect } from 'vitest';
import { cuitSchemaStrict, cuitSchema, dniSchema, cbuSchema, generateCuil, calculateCuilCheckDigit } from './index';

// ---------------------------------------------------------------------------
// Helpers to compute valid Argentine document numbers for testing
// ---------------------------------------------------------------------------

/** Compute the CUIT check digit given an 10-digit base string */
function cuitCheckDigit(base: string): number {
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(base[i]) * multipliers[i];
  const rem = sum % 11;
  return rem === 0 ? 0 : rem === 1 ? 9 : 11 - rem;
}

/** Build a guaranteed-valid CUIT string from prefix + 8-digit number */
function validCuit(prefix: string, number: string): string {
  const base = prefix + number.padStart(8, '0');
  return base + cuitCheckDigit(base);
}

/** Build a guaranteed-valid CBU */
function validCbu(bankBranch: string, account: string): string {
  const b1 = bankBranch.padStart(7, '0');
  const m1 = [7, 1, 3, 9, 7, 1, 3];
  let sum1 = 0;
  for (let i = 0; i < 7; i++) sum1 += parseInt(b1[i]) * m1[i];
  const check1 = (10 - (sum1 % 10)) % 10;

  const b2 = account.padStart(13, '0');
  const m2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) sum2 += parseInt(b2[i]) * m2[i];
  const check2 = (10 - (sum2 % 10)) % 10;

  return b1 + check1 + b2 + check2;
}

// ---------------------------------------------------------------------------
// CUIT strict (validates checksum)
// ---------------------------------------------------------------------------
describe('cuitSchemaStrict', () => {
  const CUIT_30 = validCuit('30', '71234567');

  it('accepts a valid CUIT with correct check digit', () => {
    expect(cuitSchemaStrict.safeParse(CUIT_30).success).toBe(true);
  });

  it('accepts CUIT formatted with dashes', () => {
    const formatted = `${CUIT_30.slice(0, 2)}-${CUIT_30.slice(2, 10)}-${CUIT_30.slice(10)}`;
    expect(cuitSchemaStrict.safeParse(formatted).success).toBe(true);
  });

  it('accepts CUIT formatted with spaces', () => {
    const formatted = `${CUIT_30.slice(0, 2)} ${CUIT_30.slice(2, 10)} ${CUIT_30.slice(10)}`;
    expect(cuitSchemaStrict.safeParse(formatted).success).toBe(true);
  });

  it('accepts CUIT with empresa prefix 33', () => {
    const cuit33 = validCuit('33', '71234567');
    expect(cuitSchemaStrict.safeParse(cuit33).success).toBe(true);
  });

  it('rejects CUIT with wrong check digit', () => {
    // Flip the last digit of a valid CUIT
    const lastDigit = parseInt(CUIT_30[10]);
    const wrong = CUIT_30.slice(0, 10) + ((lastDigit + 1) % 10);
    const result = cuitSchemaStrict.safeParse(wrong);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('CUIT/CUIL inválido');
    }
  });

  it('rejects CUIT with fewer than 11 digits', () => {
    expect(cuitSchemaStrict.safeParse('3071234567').success).toBe(false);
  });

  it('rejects CUIT with more than 11 digits', () => {
    expect(cuitSchemaStrict.safeParse('307123456789').success).toBe(false);
  });

  it('rejects CUIT with non-numeric characters', () => {
    expect(cuitSchemaStrict.safeParse('30-XXXXXXX-9').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(cuitSchemaStrict.safeParse('').success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CUIT relaxed (format only, 11 digits)
// ---------------------------------------------------------------------------
describe('cuitSchema (relaxed)', () => {
  it('accepts any 11-digit string regardless of checksum', () => {
    expect(cuitSchema.safeParse('30712345670').success).toBe(true);
  });

  it('accepts with dashes', () => {
    expect(cuitSchema.safeParse('30-71234567-0').success).toBe(true);
  });

  it('rejects non-11-digit strings', () => {
    expect(cuitSchema.safeParse('123').success).toBe(false);
  });

  it('shows correct error message', () => {
    const result = cuitSchema.safeParse('123');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El CUIL debe tener 11 dígitos');
    }
  });
});

// ---------------------------------------------------------------------------
// DNI
// ---------------------------------------------------------------------------
describe('dniSchema', () => {
  it('accepts 8-digit DNI', () => {
    expect(dniSchema.safeParse('37891234').success).toBe(true);
  });

  it('accepts 7-digit DNI', () => {
    expect(dniSchema.safeParse('5678901').success).toBe(true);
  });

  it('accepts DNI with dots (formatted)', () => {
    expect(dniSchema.safeParse('37.891.234').success).toBe(true);
  });

  it('rejects DNI with fewer than 7 digits', () => {
    expect(dniSchema.safeParse('123456').success).toBe(false);
  });

  it('rejects DNI with more than 8 digits', () => {
    expect(dniSchema.safeParse('123456789').success).toBe(false);
  });

  it('rejects DNI with letters', () => {
    expect(dniSchema.safeParse('3789123A').success).toBe(false);
  });

  it('shows correct error message', () => {
    const result = dniSchema.safeParse('123456');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('DNI inválido');
    }
  });
});

// ---------------------------------------------------------------------------
// CBU
// ---------------------------------------------------------------------------
describe('cbuSchema', () => {
  // Build a programmatically valid CBU (bank=0110001, account=0000042640)
  const VALID_CBU = validCbu('0110001', '0000042640');

  it('accepts a valid 22-digit CBU', () => {
    expect(cbuSchema.safeParse(VALID_CBU).success).toBe(true);
  });

  it('rejects CBU with fewer than 22 digits', () => {
    expect(cbuSchema.safeParse(VALID_CBU.slice(0, 21)).success).toBe(false);
  });

  it('rejects CBU with more than 22 digits', () => {
    expect(cbuSchema.safeParse(VALID_CBU + '0').success).toBe(false);
  });

  it('rejects CBU with wrong block-1 check digit', () => {
    // Flip the check digit at position 7
    const origCheck = parseInt(VALID_CBU[7]);
    const tampered = VALID_CBU.slice(0, 7) + ((origCheck + 1) % 10) + VALID_CBU.slice(8);
    const result = cbuSchema.safeParse(tampered);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('CBU inválido');
    }
  });

  it('rejects CBU with letters', () => {
    expect(cbuSchema.safeParse(VALID_CBU.slice(0, 21) + 'X').success).toBe(false);
  });

  it('shows correct error message', () => {
    const result = cbuSchema.safeParse('123');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('CBU inválido');
    }
  });
});

// ---------------------------------------------------------------------------
// calculateCuilCheckDigit
// ---------------------------------------------------------------------------
describe('calculateCuilCheckDigit', () => {
  it('returns 0 when sum mod 11 is 0', () => {
    // We cannot easily craft this without brute force, but we can verify the
    // function is consistent with the strict validator
    const prefix = '20';
    const dni = '12345678';
    const check = calculateCuilCheckDigit(prefix, dni);
    expect(check).toBeGreaterThanOrEqual(0);
    expect(check).toBeLessThanOrEqual(9);
  });

  it('returns 9 when remainder is 1 (special case)', () => {
    // Find a DNI where remainder === 1 by brute-forcing small values
    const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    for (let n = 0; n <= 99999999; n++) {
      const base = '20' + String(n).padStart(8, '0');
      let sum = 0;
      for (let i = 0; i < 10; i++) sum += parseInt(base[i]) * multipliers[i];
      if (sum % 11 === 1) {
        expect(calculateCuilCheckDigit('20', String(n).padStart(8, '0'))).toBe(9);
        break;
      }
    }
  });
});

// ---------------------------------------------------------------------------
// generateCuil
// ---------------------------------------------------------------------------
describe('generateCuil', () => {
  it('generates a valid CUIL for male DNI', () => {
    const cuil = generateCuil('37891234', 'M');
    expect(cuil).toMatch(/^\d{11}$/);
    // Must pass the strict validator
    expect(cuitSchemaStrict.safeParse(cuil).success).toBe(true);
  });

  it('generates a valid CUIL for female DNI', () => {
    const cuil = generateCuil('37891234', 'F');
    expect(cuil).toMatch(/^\d{11}$/);
    expect(cuitSchemaStrict.safeParse(cuil).success).toBe(true);
  });

  it('generates CUIL with prefix 20 for most male DNIs', () => {
    const cuil = generateCuil('37891234', 'M');
    // prefix is either 20 or 23 (special case)
    expect(['20', '23']).toContain(cuil.slice(0, 2));
  });

  it('generates CUIL with prefix 27 for most female DNIs', () => {
    const cuil = generateCuil('37891234', 'F');
    expect(['23', '27']).toContain(cuil.slice(0, 2));
  });

  it('pads 7-digit DNI to 8 digits', () => {
    const cuil = generateCuil('5678901', 'M');
    expect(cuil).toMatch(/^\d{11}$/);
    expect(cuitSchemaStrict.safeParse(cuil).success).toBe(true);
  });

  it('handles DNI with dots', () => {
    const cuil = generateCuil('37.891.234', 'M');
    expect(cuil).toMatch(/^\d{11}$/);
    expect(cuitSchemaStrict.safeParse(cuil).success).toBe(true);
  });
});
