export interface PasswordStrength {
  /** 0–4 */
  score: number;
  label: string;
}

const LABELS = ["Sangat lemah", "Lemah", "Cukup", "Kuat", "Sangat kuat"];

/** UI hint only. The backend rule is: min 8 chars, letters and digits, differs from the old password. */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-zA-Z]/.test(password) && /\d/.test(password)) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password) || password.length >= 12) score++;
  return { score, label: LABELS[score] };
}
