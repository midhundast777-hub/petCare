/**
 * Centralized email and phone validation utilities
 */

/**
 * Validates that an email address has proper syntax.
 * @param {string} email
 * @returns {{ isValid: boolean, error: string | null }}
 */
export const validateEmail = (email) => {
  if (!email || !String(email).trim()) {
    return { isValid: false, error: 'Email address is required.' };
  }
  const trimmed = String(email).trim().toLowerCase();
  // Standard RFC 5322 compatible email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@domain.com).' };
  }
  return { isValid: true, error: null };
};

/**
 * Validates that a phone number contains EXACTLY 10 digits.
 * @param {string} phone
 * @returns {{ isValid: boolean, digits: string, error: string | null, formatted: string }}
 */
export const validatePhone = (phone) => {
  if (!phone || !String(phone).trim()) {
    return { isValid: false, digits: '', error: 'Phone number is required.', formatted: '' };
  }
  const digits = String(phone).replace(/\D/g, '');

  if (digits.length < 10) {
    return {
      isValid: false,
      digits,
      error: `Phone number must be exactly 10 digits (currently ${digits.length}/10).`,
      formatted: digits,
    };
  }

  if (digits.length > 10) {
    return {
      isValid: false,
      digits,
      error: `Phone number cannot exceed 10 digits (currently ${digits.length} digits).`,
      formatted: digits,
    };
  }

  // Exactly 10 digits!
  const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return {
    isValid: true,
    digits,
    error: null,
    formatted,
  };
};

/**
 * Helper to format phone number as user types (up to 10 digits).
 * @param {string} value
 * @returns {string}
 */
export const formatPhoneInput = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};
