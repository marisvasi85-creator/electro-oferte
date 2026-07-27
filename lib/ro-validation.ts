/** Validări ușoare pentru date românești (CUI, telefon, IBAN) și puterea parolei. */

export function normalizeCui(value: string) {
  return value.replace(/^RO/i, "").replace(/[\s.]/g, "").trim();
}

export function isValidRomanianCui(value: string) {
  const cui = normalizeCui(value);
  if (!cui) return true;
  if (!/^\d{2,10}$/.test(cui)) return false;

  const controlKey = [7, 3, 5, 2, 1, 7, 3, 5, 2];
  const digits = cui.split("").map(Number);
  const checkDigit = digits.pop();
  if (checkDigit === undefined) return false;

  while (digits.length < 9) digits.unshift(0);
  const sum = digits.reduce((total, digit, index) => total + digit * controlKey[index], 0);
  let computed = (sum * 10) % 11;
  if (computed === 10) computed = 0;
  return computed === checkDigit;
}

export function cuiHint(value: string) {
  const cui = normalizeCui(value);
  if (!cui) return "";
  if (!/^\d{2,10}$/.test(cui)) return "CUI-ul trebuie să conțină 2–10 cifre (opțional prefix RO).";
  if (!isValidRomanianCui(cui)) return "CUI invalid — verifică cifra de control.";
  return "";
}

export function isValidRomanianCnp(value: string) {
  const cnp = value.replace(/\s/g, "");
  if (!cnp) return true;
  if (!/^\d{13}$/.test(cnp)) return false;
  const key = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  const digits = cnp.split("").map(Number);
  const sum = key.reduce((total, weight, index) => total + weight * digits[index], 0);
  let control = sum % 11;
  if (control === 10) control = 1;
  return control === digits[12];
}

/** Hint pentru câmpuri CUI sau CNP (clienți). */
export function taxIdHint(value: string) {
  const cleaned = normalizeCui(value);
  if (!cleaned) return "";
  if (/^\d{13}$/.test(cleaned)) {
    return isValidRomanianCnp(cleaned) ? "" : "CNP invalid — verifică cifra de control.";
  }
  return cuiHint(value);
}

export function normalizePhone(value: string) {
  return value.replace(/[\s().-]/g, "").trim();
}

export function isValidRomanianPhone(value: string) {
  const phone = normalizePhone(value);
  if (!phone) return true;
  return /^(?:\+?40|0)(?:7\d{8}|2\d{8}|3\d{8})$/.test(phone);
}

export function phoneHint(value: string) {
  if (!value.trim()) return "";
  if (!isValidRomanianPhone(value)) return "Folosește un număr RO valid, ex. 07xx xxx xxx.";
  return "";
}

export function normalizeIban(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isValidRomanianIban(value: string) {
  const iban = normalizeIban(value);
  if (!iban) return true;
  if (!/^RO\d{2}[A-Z]{4}\d{16}$/.test(iban)) return false;

  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  const numeric = rearranged.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

export function ibanHint(value: string) {
  if (!value.trim()) return "";
  if (!isValidRomanianIban(value)) return "IBAN RO invalid — format RO##BANK################.";
  return "";
}

export type PasswordStrength = "slabă" | "medie" | "puternică";

export function passwordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return "slabă";
  if (score <= 3) return "medie";
  return "puternică";
}

export function passwordStrengthHint(password: string) {
  if (!password) return "";
  const level = passwordStrength(password);
  if (level === "slabă") return "Putere: slabă — folosește majuscule, cifre și simboluri.";
  if (level === "medie") return "Putere: medie — aproape acolo.";
  return "Putere: puternică.";
}
