export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  meetsMinimum: boolean;
  checks: {
    minLength: boolean;
    hasLetter: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
};

const LABELS = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"] as const;

// Mínimo aceito pelo app: 8 caracteres + letra + número (checks[0..1]).
// hasSymbol e comprimento >=12 só contam para a pontuação visual, não são
// obrigatórios — evita frustrar o usuário com regras excessivas numa fase
// inicial do produto.
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^a-zA-Z0-9]/.test(password),
  };

  let score = 0;
  if (checks.minLength) score += 1;
  if (checks.hasLetter && checks.hasNumber) score += 1;
  if (checks.hasSymbol) score += 1;
  if (password.length >= 12) score += 1;

  const clampedScore = Math.min(score, 4) as PasswordStrength["score"];

  return {
    score: clampedScore,
    label: LABELS[clampedScore],
    meetsMinimum: checks.minLength && checks.hasLetter && checks.hasNumber,
    checks,
  };
}
