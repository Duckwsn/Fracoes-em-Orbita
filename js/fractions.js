/**
 * fractions.js
 * Funções puras para interpretar, simplificar e comparar frações.
 * Nenhuma função aqui toca o DOM ou o estado do jogo.
 */

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

/**
 * Interpreta uma string de entrada do jogador em uma fração { num, den }.
 * Aceita: "3/6", " 3 / 6 ", "5" (inteiro -> 5/1), "1 1/2" (mista -> 3/2).
 * Retorna null se não for possível interpretar.
 */
function parseFraction(input) {
  if (input === null || input === undefined) return null;
  const str = String(input).trim().replace(',', '.');
  if (str === '') return null;

  // fração mista: "1 1/2"
  const mixedMatch = str.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    return { num: sign * (Math.abs(whole) * den + num), den };
  }

  // fração simples: "3/6"
  const fracMatch = str.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (fracMatch) {
    const num = parseInt(fracMatch[1], 10);
    const den = parseInt(fracMatch[2], 10);
    if (den === 0) return null;
    return { num, den };
  }

  // número inteiro: "5"
  const intMatch = str.match(/^-?\d+$/);
  if (intMatch) {
    return { num: parseInt(str, 10), den: 1 };
  }

  // decimal simples: "0.5"
  const decMatch = str.match(/^-?\d+\.\d+$/);
  if (decMatch) {
    const decimals = str.split('.')[1].length;
    const den = Math.pow(10, decimals);
    const num = Math.round(parseFloat(str) * den);
    return simplifyFraction({ num, den });
  }

  return null;
}

/** Simplifica uma fração para sua forma irredutível. Mantém o sinal no numerador. */
function simplifyFraction(fraction) {
  let { num, den } = fraction;
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const divisor = gcd(num, den);
  return { num: num / divisor, den: den / divisor };
}

/** Verifica se uma fração já está em sua forma simplificada. */
function isSimplified(fraction) {
  const s = simplifyFraction(fraction);
  return s.num === fraction.num && s.den === fraction.den;
}

/** Compara duas frações por equivalência (produto cruzado, robusto a formas não simplificadas). */
function fractionsEqual(a, b) {
  if (!a || !b) return false;
  return a.num * b.den === b.num * a.den;
}

/** Soma duas frações e retorna o resultado simplificado. */
function addFractions(a, b) {
  return simplifyFraction({ num: a.num * b.den + b.num * a.den, den: a.den * b.den });
}

/** Subtrai duas frações e retorna o resultado simplificado. */
function subFractions(a, b) {
  return simplifyFraction({ num: a.num * b.den - b.num * a.den, den: a.den * b.den });
}

/** Formata uma fração para exibição. Inteiros aparecem sem denominador. */
function formatFraction(fraction) {
  if (!fraction) return '';
  if (fraction.den === 1) return `${fraction.num}`;
  return `${fraction.num}/${fraction.den}`;
}

/**
 * Confere a resposta de um jogador contra o gabarito.
 * Se requireSimplified for true, a resposta do jogador precisa estar
 * já na forma simplificada (usado em perguntas "Simplifique").
 */
function checkFractionAnswer(userInput, expected, requireSimplified) {
  const userFraction = parseFraction(userInput);
  if (!userFraction) return false;
  const expectedFraction = typeof expected === 'string' ? parseFraction(expected) : expected;
  if (!fractionsEqual(userFraction, expectedFraction)) return false;
  if (requireSimplified && !isSimplified(userFraction)) return false;
  return true;
}

/** Confere resposta textual simples (usada em perguntas como "como lemos 1/2"). */
function checkTextAnswer(userInput, acceptedAnswers) {
  if (!userInput) return false;
  const normalized = String(userInput)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return acceptedAnswers.some(
    (accepted) =>
      accepted
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') === normalized
  );
}

window.FractionsUtil = {
  gcd,
  parseFraction,
  simplifyFraction,
  isSimplified,
  fractionsEqual,
  addFractions,
  subFractions,
  formatFraction,
  checkFractionAnswer,
  checkTextAnswer,
};
