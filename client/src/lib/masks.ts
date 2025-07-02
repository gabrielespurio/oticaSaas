// Utility functions for input masks

export function formatCPF(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 11 digits
  const limitedDigits = digits.slice(0, 11);
  
  // Apply CPF mask: 000.000.000-00
  if (limitedDigits.length <= 3) {
    return limitedDigits;
  } else if (limitedDigits.length <= 6) {
    return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3)}`;
  } else if (limitedDigits.length <= 9) {
    return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6)}`;
  } else {
    return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6, 9)}-${limitedDigits.slice(9)}`;
  }
}

export function formatPhone(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 11 digits (mobile) or 10 digits (landline)
  const limitedDigits = digits.slice(0, 11);
  
  // Apply phone mask: (11) 99999-9999 or (11) 9999-9999
  if (limitedDigits.length <= 2) {
    return limitedDigits;
  } else if (limitedDigits.length <= 6) {
    return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`;
  } else if (limitedDigits.length <= 10) {
    // Landline format: (11) 9999-9999
    return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 6)}-${limitedDigits.slice(6)}`;
  } else {
    // Mobile format: (11) 99999-9999
    return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7)}`;
  }
}

export function formatCEP(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 8 digits
  const limitedDigits = digits.slice(0, 8);
  
  // Apply CEP mask: 00000-000
  if (limitedDigits.length <= 5) {
    return limitedDigits;
  } else {
    return `${limitedDigits.slice(0, 5)}-${limitedDigits.slice(5)}`;
  }
}

// Validation functions
export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  
  if (digits.length !== 11) return false;
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(digits)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (firstDigit !== parseInt(digits[9])) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return secondDigit === parseInt(digits[10]);
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // Brazilian phone numbers can have 10 or 11 digits
  return digits.length >= 10 && digits.length <= 11;
}

export function isValidCEP(cep: string): boolean {
  const digits = cep.replace(/\D/g, '');
  return digits.length === 8;
}