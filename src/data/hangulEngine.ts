import {
  DecomposedChar,
  JamoInfo,
  JamoRole,
  LocalStrokeDef,
  Point,
  RenderedStroke,
  VowelOrientation,
} from '../types/hangul';

// Unicode Hangul Syllable Constants
const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

export const CHOSEONG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const;

export const JUNGSEONG_LIST = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ',
  'ㅣ',
] as const;

export const JONGSEONG_LIST = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const;

function createCirclePoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  steps = 28
): Point[] {
  const pts: Point[] = [];
  // Start at top (12 o'clock) and move counter-clockwise in screen coordinates
  for (let i = 0; i <= steps; i++) {
    const theta = -Math.PI / 2 - (i / steps) * Math.PI * 2;
    pts.push({
      x: cx + rx * Math.cos(theta),
      y: cy + ry * Math.sin(theta),
    });
  }
  return pts;
}

export const JAMO_STROKES: Record<string, LocalStrokeDef[]> = {
  'ㄱ': [
    {
      points: [
        { x: 0.14, y: 0.16 },
        { x: 0.84, y: 0.16 },
        { x: 0.80, y: 0.88 },
      ],
      hint: 'Traccia verso destra e scendi in un unico movimento continuo.',
    },
  ],
  'ㄴ': [
    {
      points: [
        { x: 0.18, y: 0.14 },
        { x: 0.18, y: 0.84 },
        { x: 0.88, y: 0.84 },
      ],
      hint: 'Scendi verticalmente e piega verso destra in un unico tratto.',
    },
  ],
  'ㄷ': [
    {
      points: [
        { x: 0.18, y: 0.16 },
        { x: 0.84, y: 0.16 },
      ],
      hint: '1. Barra orizzontale superiore da sinistra a destra.',
    },
    {
      points: [
        { x: 0.20, y: 0.16 },
        { x: 0.20, y: 0.84 },
        { x: 0.86, y: 0.84 },
      ],
      hint: '2. Scendi dal bordo sinistro e chiudi verso destra.',
    },
  ],
  'ㄹ': [
    {
      points: [
        { x: 0.16, y: 0.14 },
        { x: 0.82, y: 0.14 },
        { x: 0.82, y: 0.48 },
      ],
      hint: '1. Disegna la parte superiore a forma di ㄱ.',
    },
    {
      points: [
        { x: 0.18, y: 0.48 },
        { x: 0.82, y: 0.48 },
      ],
      hint: '2. Barra centrale orizzontale da sinistra a destra.',
    },
    {
      points: [
        { x: 0.18, y: 0.48 },
        { x: 0.18, y: 0.86 },
        { x: 0.86, y: 0.86 },
      ],
      hint: '3. Scendi dal lato sinistro e completa la base a ㄴ.',
    },
  ],
  'ㅁ': [
    {
      points: [
        { x: 0.18, y: 0.16 },
        { x: 0.18, y: 0.84 },
      ],
      hint: '1. Lato verticale sinistro dall’alto verso il basso.',
    },
    {
      points: [
        { x: 0.18, y: 0.16 },
        { x: 0.82, y: 0.16 },
        { x: 0.82, y: 0.84 },
      ],
      hint: '2. Lato superiore verso destra e poi giù sul lato destro.',
    },
    {
      points: [
        { x: 0.18, y: 0.84 },
        { x: 0.82, y: 0.84 },
      ],
      hint: '3. Chiudi il quadrato tracciando la base da sinistra a destra.',
    },
  ],
  'ㅂ': [
    {
      points: [
        { x: 0.22, y: 0.14 },
        { x: 0.22, y: 0.86 },
      ],
      hint: '1. Asta verticale sinistra dall’alto al basso.',
    },
    {
      points: [
        { x: 0.78, y: 0.14 },
        { x: 0.78, y: 0.86 },
      ],
      hint: '2. Asta verticale destra dall’alto al basso.',
    },
    {
      points: [
        { x: 0.22, y: 0.50 },
        { x: 0.78, y: 0.50 },
      ],
      hint: '3. Barra centrale da sinistra a destra.',
    },
    {
      points: [
        { x: 0.22, y: 0.84 },
        { x: 0.78, y: 0.84 },
      ],
      hint: '4. Barra inferiore di chiusura da sinistra a destra.',
    },
  ],
  'ㅅ': [
    {
      points: [
        { x: 0.50, y: 0.14 },
        { x: 0.45, y: 0.42 },
        { x: 0.32, y: 0.66 },
        { x: 0.14, y: 0.86 },
      ],
      smooth: true,
      hint: '1. Curva obliqua dall’alto verso il basso a sinistra.',
    },
    {
      points: [
        { x: 0.47, y: 0.42 },
        { x: 0.64, y: 0.65 },
        { x: 0.86, y: 0.86 },
      ],
      smooth: true,
      hint: '2. Dal centro del primo tratto, scendi obliquamente a destra.',
    },
  ],
  'ㅇ': [
    {
      points: createCirclePoints(0.5, 0.5, 0.34, 0.35),
      smooth: true,
      hint: 'Parti dall’alto e traccia il cerchio in senso antiorario.',
    },
  ],
  'ㅈ': [
    {
      points: [
        { x: 0.16, y: 0.20 },
        { x: 0.84, y: 0.20 },
      ],
      hint: '1. Barra superiore orizzontale da sinistra a destra.',
    },
    {
      points: [
        { x: 0.50, y: 0.20 },
        { x: 0.42, y: 0.50 },
        { x: 0.14, y: 0.86 },
      ],
      smooth: true,
      hint: '2. Dal centro della barra, scendi in diagonale verso sinistra.',
    },
    {
      points: [
        { x: 0.47, y: 0.48 },
        { x: 0.65, y: 0.68 },
        { x: 0.86, y: 0.86 },
      ],
      smooth: true,
      hint: '3. Dal centro della gamba sinistra, scendi verso destra.',
    },
  ],
  'ㅊ': [
    {
      points: [
        { x: 0.50, y: 0.06 },
        { x: 0.50, y: 0.20 },
      ],
      hint: '1. Piccolo trattino verticale in cima al centro.',
    },
    {
      points: [
        { x: 0.16, y: 0.28 },
        { x: 0.84, y: 0.28 },
      ],
      hint: '2. Barra orizzontale da sinistra a destra.',
    },
    {
      points: [
        { x: 0.50, y: 0.28 },
        { x: 0.40, y: 0.56 },
        { x: 0.14, y: 0.88 },
      ],
      smooth: true,
      hint: '3. Dal centro, scendi obliquamente verso sinistra.',
    },
    {
      points: [
        { x: 0.47, y: 0.54 },
        { x: 0.66, y: 0.72 },
        { x: 0.86, y: 0.88 },
      ],
      smooth: true,
      hint: '4. Dal centro, scendi obliquamente verso destra.',
    },
  ],
  'ㅋ': [
    {
      points: [
        { x: 0.16, y: 0.16 },
        { x: 0.84, y: 0.16 },
        { x: 0.80, y: 0.86 },
      ],
      hint: '1. Traccia la forma ㄱ da sinistra a destra e poi giù.',
    },
    {
      points: [
        { x: 0.18, y: 0.50 },
        { x: 0.80, y: 0.50 },
      ],
      hint: '2. Aggiungi la barra centrale da sinistra a destra.',
    },
  ],
  'ㅌ': [
    {
      points: [
        { x: 0.18, y: 0.16 },
        { x: 0.84, y: 0.16 },
      ],
      hint: '1. Barra superiore da sinistra a destra.',
    },
    {
      points: [
        { x: 0.20, y: 0.50 },
        { x: 0.80, y: 0.50 },
      ],
      hint: '2. Barra centrale da sinistra a destra.',
    },
    {
      points: [
        { x: 0.18, y: 0.16 },
        { x: 0.18, y: 0.84 },
        { x: 0.86, y: 0.84 },
      ],
      hint: '3. Scendi a sinistra e chiudi alla base verso destra.',
    },
  ],
  'ㅍ': [
    {
      points: [
        { x: 0.14, y: 0.18 },
        { x: 0.86, y: 0.18 },
      ],
      hint: '1. Barra superiore lunga da sinistra a destra.',
    },
    {
      points: [
        { x: 0.34, y: 0.18 },
        { x: 0.34, y: 0.82 },
      ],
      hint: '2. Colonna verticale interna sinistra verso il basso.',
    },
    {
      points: [
        { x: 0.66, y: 0.18 },
        { x: 0.66, y: 0.82 },
      ],
      hint: '3. Colonna verticale interna destra verso il basso.',
    },
    {
      points: [
        { x: 0.14, y: 0.82 },
        { x: 0.86, y: 0.82 },
      ],
      hint: '4. Barra inferiore lunga da sinistra a destra.',
    },
  ],
  'ㅎ': [
    {
      points: [
        { x: 0.50, y: 0.06 },
        { x: 0.50, y: 0.20 },
      ],
      hint: '1. Piccolo trattino verticale superiore.',
    },
    {
      points: [
        { x: 0.14, y: 0.28 },
        { x: 0.86, y: 0.28 },
      ],
      hint: '2. Barra orizzontale ampia da sinistra a destra.',
    },
    {
      points: createCirclePoints(0.5, 0.64, 0.27, 0.25),
      smooth: true,
      hint: '3. Cerchio inferiore in senso antiorario partendo dall’alto.',
    },
  ],

  // Vowels
  'ㅏ': [
    {
      points: [
        { x: 0.36, y: 0.10 },
        { x: 0.36, y: 0.90 },
      ],
      hint: '1. Linea verticale lunga dall’alto verso il basso.',
    },
    {
      points: [
        { x: 0.36, y: 0.50 },
        { x: 0.80, y: 0.50 },
      ],
      hint: '2. Trattino corto dal centro verso destra.',
    },
  ],
  'ㅑ': [
    {
      points: [
        { x: 0.34, y: 0.10 },
        { x: 0.34, y: 0.90 },
      ],
      hint: '1. Linea verticale lunga dall’alto verso il basso.',
    },
    {
      points: [
        { x: 0.34, y: 0.38 },
        { x: 0.80, y: 0.38 },
      ],
      hint: '2. Primo trattino orizzontale verso destra.',
    },
    {
      points: [
        { x: 0.34, y: 0.62 },
        { x: 0.80, y: 0.62 },
      ],
      hint: '3. Secondo trattino orizzontale più in basso verso destra.',
    },
  ],
  'ㅓ': [
    {
      points: [
        { x: 0.20, y: 0.50 },
        { x: 0.64, y: 0.50 },
      ],
      hint: '1. Trattino corto orizzontale da sinistra verso destra.',
    },
    {
      points: [
        { x: 0.64, y: 0.10 },
        { x: 0.64, y: 0.90 },
      ],
      hint: '2. Linea verticale lunga a destra dall’alto al basso.',
    },
  ],
  'ㅕ': [
    {
      points: [
        { x: 0.20, y: 0.38 },
        { x: 0.66, y: 0.38 },
      ],
      hint: '1. Primo trattino corto superiore verso destra.',
    },
    {
      points: [
        { x: 0.20, y: 0.62 },
        { x: 0.66, y: 0.62 },
      ],
      hint: '2. Secondo trattino corto inferiore verso destra.',
    },
    {
      points: [
        { x: 0.66, y: 0.10 },
        { x: 0.66, y: 0.90 },
      ],
      hint: '3. Linea verticale lunga a destra dall’alto al basso.',
    },
  ],
  'ㅗ': [
    {
      points: [
        { x: 0.50, y: 0.20 },
        { x: 0.50, y: 0.66 },
      ],
      hint: '1. Trattino verticale corto dall’alto fino al centro.',
    },
    {
      points: [
        { x: 0.10, y: 0.66 },
        { x: 0.90, y: 0.66 },
      ],
      hint: '2. Barra orizzontale lunga alla base da sinistra a destra.',
    },
  ],
  'ㅛ': [
    {
      points: [
        { x: 0.36, y: 0.20 },
        { x: 0.36, y: 0.66 },
      ],
      hint: '1. Trattino verticale sinistro dall’alto verso la base.',
    },
    {
      points: [
        { x: 0.64, y: 0.20 },
        { x: 0.64, y: 0.66 },
      ],
      hint: '2. Trattino verticale destro dall’alto verso la base.',
    },
    {
      points: [
        { x: 0.10, y: 0.66 },
        { x: 0.90, y: 0.66 },
      ],
      hint: '3. Barra orizzontale lunga alla base da sinistra a destra.',
    },
  ],
  'ㅜ': [
    {
      points: [
        { x: 0.10, y: 0.34 },
        { x: 0.90, y: 0.34 },
      ],
      hint: '1. Barra orizzontale lunga da sinistra a destra.',
    },
    {
      points: [
        { x: 0.50, y: 0.34 },
        { x: 0.50, y: 0.80 },
      ],
      hint: '2. Trattino verticale corto dal centro verso il basso.',
    },
  ],
  'ㅠ': [
    {
      points: [
        { x: 0.10, y: 0.34 },
        { x: 0.90, y: 0.34 },
      ],
      hint: '1. Barra orizzontale lunga da sinistra a destra.',
    },
    {
      points: [
        { x: 0.36, y: 0.34 },
        { x: 0.36, y: 0.80 },
      ],
      hint: '2. Primo trattino verticale a sinistra verso il basso.',
    },
    {
      points: [
        { x: 0.64, y: 0.34 },
        { x: 0.64, y: 0.80 },
      ],
      hint: '3. Secondo trattino verticale a destra verso il basso.',
    },
  ],
  'ㅡ': [
    {
      points: [
        { x: 0.08, y: 0.50 },
        { x: 0.92, y: 0.50 },
      ],
      hint: 'Unica linea orizzontale dritta da sinistra a destra.',
    },
  ],
  'ㅣ': [
    {
      points: [
        { x: 0.50, y: 0.10 },
        { x: 0.50, y: 0.90 },
      ],
      hint: 'Unica linea verticale dritta dall’alto verso il basso.',
    },
  ],
  'ㅐ': [
    {
      points: [
        { x: 0.28, y: 0.10 },
        { x: 0.28, y: 0.90 },
      ],
      hint: '1. Prima linea verticale sinistra dall’alto al basso.',
    },
    {
      points: [
        { x: 0.28, y: 0.50 },
        { x: 0.64, y: 0.50 },
      ],
      hint: '2. Trattino orizzontale centrale verso destra.',
    },
    {
      points: [
        { x: 0.70, y: 0.10 },
        { x: 0.70, y: 0.90 },
      ],
      hint: '3. Seconda linea verticale destra dall’alto al basso.',
    },
  ],
  'ㅒ': [
    {
      points: [
        { x: 0.28, y: 0.10 },
        { x: 0.28, y: 0.90 },
      ],
      hint: '1. Prima linea verticale sinistra dall’alto al basso.',
    },
    {
      points: [
        { x: 0.28, y: 0.38 },
        { x: 0.64, y: 0.38 },
      ],
      hint: '2. Primo trattino orizzontale verso destra.',
    },
    {
      points: [
        { x: 0.28, y: 0.62 },
        { x: 0.64, y: 0.62 },
      ],
      hint: '3. Secondo trattino orizzontale verso destra.',
    },
    {
      points: [
        { x: 0.70, y: 0.10 },
        { x: 0.70, y: 0.90 },
      ],
      hint: '4. Linea verticale destra dall’alto al basso.',
    },
  ],
  'ㅔ': [
    {
      points: [
        { x: 0.16, y: 0.50 },
        { x: 0.50, y: 0.50 },
      ],
      hint: '1. Trattino corto orizzontale da sinistra a destra.',
    },
    {
      points: [
        { x: 0.50, y: 0.10 },
        { x: 0.50, y: 0.90 },
      ],
      hint: '2. Prima linea verticale al centro dall’alto al basso.',
    },
    {
      points: [
        { x: 0.78, y: 0.10 },
        { x: 0.78, y: 0.90 },
      ],
      hint: '3. Seconda linea verticale a destra dall’alto al basso.',
    },
  ],
  'ㅖ': [
    {
      points: [
        { x: 0.16, y: 0.38 },
        { x: 0.50, y: 0.38 },
      ],
      hint: '1. Primo trattino orizzontale verso destra.',
    },
    {
      points: [
        { x: 0.16, y: 0.62 },
        { x: 0.50, y: 0.62 },
      ],
      hint: '2. Secondo trattino orizzontale verso destra.',
    },
    {
      points: [
        { x: 0.50, y: 0.10 },
        { x: 0.50, y: 0.90 },
      ],
      hint: '3. Prima linea verticale al centro dall’alto al basso.',
    },
    {
      points: [
        { x: 0.78, y: 0.10 },
        { x: 0.78, y: 0.90 },
      ],
      hint: '4. Seconda linea verticale a destra dall’alto al basso.',
    },
  ],
};

// Composite Jamo decomposition maps
export const DOUBLE_CONSONANT_PARTS: Record<string, [string, string]> = {
  'ㄲ': ['ㄱ', 'ㄱ'],
  'ㄸ': ['ㄷ', 'ㄷ'],
  'ㅃ': ['ㅂ', 'ㅂ'],
  'ㅆ': ['ㅅ', 'ㅅ'],
  'ㅉ': ['ㅈ', 'ㅈ'],
  'ㄳ': ['ㄱ', 'ㅅ'],
  'ㄵ': ['ㄴ', 'ㅈ'],
  'ㄶ': ['ㄴ', 'ㅎ'],
  'ㄺ': ['ㄹ', 'ㄱ'],
  'ㄻ': ['ㄹ', 'ㅁ'],
  'ㄼ': ['ㄹ', 'ㅂ'],
  'ㄽ': ['ㄹ', 'ㅅ'],
  'ㄾ': ['ㄹ', 'ㅌ'],
  'ㄿ': ['ㄹ', 'ㅍ'],
  'ㅀ': ['ㄹ', 'ㅎ'],
  'ㅄ': ['ㅂ', 'ㅅ'],
};

export const COMPOUND_VOWEL_PARTS: Record<string, { horiz: string; vert: string }> = {
  'ㅘ': { horiz: 'ㅗ', vert: 'ㅏ' },
  'ㅙ': { horiz: 'ㅗ', vert: 'ㅐ' },
  'ㅚ': { horiz: 'ㅗ', vert: 'ㅣ' },
  'ㅝ': { horiz: 'ㅜ', vert: 'ㅓ' },
  'ㅞ': { horiz: 'ㅜ', vert: 'ㅔ' },
  'ㅟ': { horiz: 'ㅜ', vert: 'ㅣ' },
  'ㅢ': { horiz: 'ㅡ', vert: 'ㅣ' },
};

export const VERTICAL_VOWELS = new Set(['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅣ']);
export const HORIZONTAL_VOWELS = new Set(['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ']);
export const COMPOUND_VOWELS = new Set(['ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ']);

export function getVowelOrientation(vowel: string): VowelOrientation {
  if (COMPOUND_VOWELS.has(vowel)) return 'compound';
  if (HORIZONTAL_VOWELS.has(vowel)) return 'horizontal';
  return 'vertical';
}

export const JAMO_METADATA: Record<string, Omit<JamoInfo, 'strokes'>> = {
  // Basic Vowels
  'ㅏ': { char: 'ㅏ', name: 'A', romanization: 'a', soundIt: 'come "a" in casa', category: 'basic-vowel', orientation: 'vertical' },
  'ㅑ': { char: 'ㅑ', name: 'Ya', romanization: 'ya', soundIt: 'come "ia" in piano', category: 'basic-vowel', orientation: 'vertical' },
  'ㅓ': { char: 'ㅓ', name: 'Eo', romanization: 'eo', soundIt: 'o aperta (tra "o" e "a")', category: 'basic-vowel', orientation: 'vertical' },
  'ㅕ': { char: 'ㅕ', name: 'Yeo', romanization: 'yeo', soundIt: '"io" con o aperta', category: 'basic-vowel', orientation: 'vertical' },
  'ㅗ': { char: 'ㅗ', name: 'O', romanization: 'o', soundIt: 'come "o" chiusa in sole', category: 'basic-vowel', orientation: 'horizontal' },
  'ㅛ': { char: 'ㅛ', name: 'Yo', romanization: 'yo', soundIt: 'come "io" in chiodo', category: 'basic-vowel', orientation: 'horizontal' },
  'ㅜ': { char: 'ㅜ', name: 'U', romanization: 'u', soundIt: 'come "u" in luna', category: 'basic-vowel', orientation: 'horizontal' },
  'ㅠ': { char: 'ㅠ', name: 'Yu', romanization: 'yu', soundIt: 'come "iu" in fiume', category: 'basic-vowel', orientation: 'horizontal' },
  'ㅡ': { char: 'ㅡ', name: 'Eu', romanization: 'eu', soundIt: 'u rilassata con labbra stese', category: 'basic-vowel', orientation: 'horizontal' },
  'ㅣ': { char: 'ㅣ', name: 'I', romanization: 'i', soundIt: 'come "i" in vino', category: 'basic-vowel', orientation: 'vertical' },
  // Compound Vowels
  'ㅐ': { char: 'ㅐ', name: 'Ae', romanization: 'ae', soundIt: 'come "e" aperta in tè', category: 'compound-vowel', orientation: 'vertical' },
  'ㅒ': { char: 'ㅒ', name: 'Yae', romanization: 'yae', soundIt: 'come "ie" aperta', category: 'compound-vowel', orientation: 'vertical' },
  'ㅔ': { char: 'ㅔ', name: 'E', romanization: 'e', soundIt: 'come "e" in pera', category: 'compound-vowel', orientation: 'vertical' },
  'ㅖ': { char: 'ㅖ', name: 'Ye', romanization: 'ye', soundIt: 'come "ie" in ieri', category: 'compound-vowel', orientation: 'vertical' },
  'ㅘ': { char: 'ㅘ', name: 'Wa', romanization: 'wa', soundIt: 'come "ua" in acqua', category: 'compound-vowel', orientation: 'compound' },
  'ㅙ': { char: 'ㅙ', name: 'Wae', romanization: 'wae', soundIt: 'come "ue" aperta', category: 'compound-vowel', orientation: 'compound' },
  'ㅚ': { char: 'ㅚ', name: 'Oe', romanization: 'oe', soundIt: 'simile a "ue" in questo', category: 'compound-vowel', orientation: 'compound' },
  'ㅝ': { char: 'ㅝ', name: 'Wo', romanization: 'wo', soundIt: 'come "uo" aperta', category: 'compound-vowel', orientation: 'compound' },
  'ㅞ': { char: 'ㅞ', name: 'We', romanization: 'we', soundIt: 'come "ue" in guerra', category: 'compound-vowel', orientation: 'compound' },
  'ㅟ': { char: 'ㅟ', name: 'Wi', romanization: 'wi', soundIt: 'come "ui" in guida', category: 'compound-vowel', orientation: 'compound' },
  'ㅢ': { char: 'ㅢ', name: 'Ui', romanization: 'ui', soundIt: '"eu" + "i" veloce', category: 'compound-vowel', orientation: 'compound' },
  // Basic Consonants
  'ㄱ': { char: 'ㄱ', name: 'Giyeok (기역)', romanization: 'g / k', soundIt: 'tra "g" dolce e "c" dura', category: 'basic-consonant' },
  'ㄴ': { char: 'ㄴ', name: 'Nieun (니은)', romanization: 'n', soundIt: 'come "n" in nave', category: 'basic-consonant' },
  'ㄷ': { char: 'ㄷ', name: 'Digeut (디귿)', romanization: 'd / t', soundIt: 'tra "d" e "t" morbida', category: 'basic-consonant' },
  'ㄹ': { char: 'ㄹ', name: 'Rieul (리을)', romanization: 'r / l', soundIt: '"r" leggera iniziale, "l" finale', category: 'basic-consonant' },
  'ㅁ': { char: 'ㅁ', name: 'Mieum (미음)', romanization: 'm', soundIt: 'come "m" in mare', category: 'basic-consonant' },
  'ㅂ': { char: 'ㅂ', name: 'Bieup (비읍)', romanization: 'b / p', soundIt: 'tra "b" e "p" morbida', category: 'basic-consonant' },
  'ㅅ': { char: 'ㅅ', name: 'Siot (시옷)', romanization: 's', soundIt: 'come "s" leggera (sc davanti a i)', category: 'basic-consonant' },
  'ㅇ': { char: 'ㅇ', name: 'Ieung (이응)', romanization: '- / ng', soundIt: 'muta all’inizio, "ng" in finale', category: 'basic-consonant' },
  'ㅈ': { char: 'ㅈ', name: 'Jieut (지읒)', romanization: 'j', soundIt: 'come "g" in gelato', category: 'basic-consonant' },
  'ㅊ': { char: 'ㅊ', name: 'Chieut (치읓)', romanization: 'ch', soundIt: 'come "c" in ciao (aspirata)', category: 'basic-consonant' },
  'ㅋ': { char: 'ㅋ', name: 'Kieuk (키읔)', romanization: 'k', soundIt: '"k" fortemente aspirata', category: 'basic-consonant' },
  'ㅌ': { char: 'ㅌ', name: 'Tieut (티읕)', romanization: 't', soundIt: '"t" fortemente aspirata', category: 'basic-consonant' },
  'ㅍ': { char: 'ㅍ', name: 'Pieup (피읖)', romanization: 'p', soundIt: '"p" fortemente aspirata', category: 'basic-consonant' },
  'ㅎ': { char: 'ㅎ', name: 'Hieut (히읗)', romanization: 'h', soundIt: 'come "h" aspirata inglese', category: 'basic-consonant' },
  // Double Consonants
  'ㄲ': { char: 'ㄲ', name: 'Ssang-giyeok (쌍기역)', romanization: 'kk', soundIt: '"c" dura tesa e secca', category: 'double-consonant' },
  'ㄸ': { char: 'ㄸ', name: 'Ssang-digeut (쌍디귿)', romanization: 'tt', soundIt: '"t" tesa non aspirata', category: 'double-consonant' },
  'ㅃ': { char: 'ㅃ', name: 'Ssang-bieup (쌍비읍)', romanization: 'pp', soundIt: '"p" tesa non aspirata', category: 'double-consonant' },
  'ㅆ': { char: 'ㅆ', name: 'Ssang-siot (쌍시옷)', romanization: 'ss', soundIt: '"s" forte e sibilante', category: 'double-consonant' },
  'ㅉ': { char: 'ㅉ', name: 'Ssang-jieut (쌍지읒)', romanization: 'jj', soundIt: '"g" dolce tesa', category: 'double-consonant' },
};

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function pointsToSvgPath(points: Point[], smooth?: boolean): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  if (!smooth || points.length < 3) {
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');
  }

  // Smooth Catmull-Rom / quadratic midpoint interpolation
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
}

function samplePolyline(points: Point[], samplesPerSegment = 14): Point[] {
  if (points.length < 2) return points;
  const out: Point[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const steps = samplesPerSegment;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      });
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function computePathLength(pts: Point[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}

function mapStrokesToBox(
  jamo: string,
  box: Box,
  role: JamoRole,
  startIndex: number
): RenderedStroke[] {
  const results: RenderedStroke[] = [];

  const appendLocalDefs = (defs: LocalStrokeDef[], subBox: Box, labelChar: string) => {
    for (const def of defs) {
      const mapped = def.points.map((p) => ({
        x: subBox.x + p.x * subBox.w,
        y: subBox.y + p.y * subBox.h,
      }));
      const sampled = def.smooth ? mapped : samplePolyline(mapped, 16);
      const start = sampled[0];
      const end = sampled[sampled.length - 1];
      const preEnd = sampled[Math.max(0, sampled.length - 4)];
      const postStart = sampled[Math.min(sampled.length - 1, 3)];
      const endAngle = (Math.atan2(end.y - preEnd.y, end.x - preEnd.x) * 180) / Math.PI;
      const startAngle = (Math.atan2(postStart.y - start.y, postStart.x - start.x) * 180) / Math.PI;

      const idx = startIndex + results.length;
      results.push({
        id: `${role}-${idx}-${labelChar}`,
        index: idx,
        jamoChar: labelChar,
        role,
        d: pointsToSvgPath(mapped, def.smooth),
        points: sampled,
        start,
        end,
        endAngle,
        startAngle,
        length: computePathLength(sampled),
        hint: def.hint,
      });
    }
  };

  if (DOUBLE_CONSONANT_PARTS[jamo]) {
    const [left, right] = DOUBLE_CONSONANT_PARTS[jamo];
    const leftBox: Box = { x: box.x, y: box.y, w: box.w * 0.47, h: box.h };
    const rightBox: Box = { x: box.x + box.w * 0.53, y: box.y, w: box.w * 0.47, h: box.h };
    appendLocalDefs(JAMO_STROKES[left] || [], leftBox, jamo);
    appendLocalDefs(JAMO_STROKES[right] || [], rightBox, jamo);
    return results;
  }

  if (COMPOUND_VOWEL_PARTS[jamo]) {
    const { horiz, vert } = COMPOUND_VOWEL_PARTS[jamo];
    const horizBox: Box = {
      x: box.x,
      y: box.y + box.h * 0.42,
      w: box.w * 0.64,
      h: box.h * 0.54,
    };
    const vertBox: Box = {
      x: box.x + box.w * 0.62,
      y: box.y,
      w: box.w * 0.38,
      h: box.h,
    };
    appendLocalDefs(JAMO_STROKES[horiz] || [], horizBox, jamo);
    appendLocalDefs(JAMO_STROKES[vert] || [], vertBox, jamo);
    return results;
  }

  appendLocalDefs(JAMO_STROKES[jamo] || [], box, jamo);
  return results;
}

export function isHangulSyllable(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return code >= HANGUL_BASE && code <= HANGUL_END;
}

export function isCompatibilityJamo(char: string): boolean {
  if (!char) return false;
  return Boolean(JAMO_STROKES[char] || DOUBLE_CONSONANT_PARTS[char] || COMPOUND_VOWEL_PARTS[char]);
}

export function isValidHangulInput(text: string): boolean {
  const cleaned = text.replace(/\s+/g, '');
  if (!cleaned) return false;
  return Array.from(cleaned).every((ch) => isHangulSyllable(ch) || isCompatibilityJamo(ch));
}

export function extractHangulChars(text: string): string[] {
  return Array.from(text).filter((ch) => isHangulSyllable(ch) || isCompatibilityJamo(ch));
}

export function composeHangulSyllable(
  initialIdx: number,
  medialIdx: number,
  finalIdx = 0
): string {
  const code = HANGUL_BASE + initialIdx * 588 + medialIdx * 28 + finalIdx;
  return String.fromCharCode(code);
}

export function decomposeChar(char: string): DecomposedChar {
  if (isCompatibilityJamo(char)) {
    const singleBox: Box = { x: 16, y: 16, w: 68, h: 68 };
    const isVowel =
      VERTICAL_VOWELS.has(char) || HORIZONTAL_VOWELS.has(char) || COMPOUND_VOWELS.has(char);
    const role: JamoRole = isVowel ? 'medial' : 'initial';
    const strokes = mapStrokesToBox(char, singleBox, role, 0);

    return {
      char,
      isHangul: true,
      isSingleJamo: true,
      initial: isVowel ? undefined : char,
      medial: isVowel ? char : undefined,
      orientation: isVowel ? getVowelOrientation(char) : undefined,
      strokes,
      boxes: isVowel ? { medial: singleBox } : { initial: singleBox },
    };
  }

  if (!isHangulSyllable(char)) {
    return {
      char,
      isHangul: false,
      isSingleJamo: false,
      strokes: [],
      boxes: {},
    };
  }

  const code = char.charCodeAt(0) - HANGUL_BASE;
  const finalIdx = code % 28;
  const medialIdx = Math.floor((code - finalIdx) / 28) % 21;
  const initialIdx = Math.floor((code - finalIdx) / 588);

  const initial = CHOSEONG_LIST[initialIdx];
  const medial = JUNGSEONG_LIST[medialIdx];
  const final = JONGSEONG_LIST[finalIdx];
  const hasFinal = Boolean(final);
  const orientation = getVowelOrientation(medial);

  const strokes: RenderedStroke[] = [];
  const boxes: DecomposedChar['boxes'] = {};

  if (orientation === 'vertical') {
    if (!hasFinal) {
      boxes.initial = { x: 10, y: 14, w: 42, h: 72 };
      boxes.medial = { x: 54, y: 10, w: 36, h: 80 };
    } else {
      boxes.initial = { x: 12, y: 10, w: 40, h: 42 };
      boxes.medial = { x: 54, y: 8, w: 36, h: 46 };
      boxes.final = { x: 16, y: 58, w: 68, h: 34 };
    }
    strokes.push(...mapStrokesToBox(initial, boxes.initial, 'initial', strokes.length));
    strokes.push(...mapStrokesToBox(medial, boxes.medial, 'medial', strokes.length));
    if (final && boxes.final) {
      strokes.push(...mapStrokesToBox(final, boxes.final, 'final', strokes.length));
    }
  } else if (orientation === 'horizontal') {
    if (!hasFinal) {
      boxes.initial = { x: 20, y: 10, w: 60, h: 42 };
      boxes.medial = { x: 12, y: 54, w: 76, h: 36 };
    } else {
      boxes.initial = { x: 22, y: 8, w: 56, h: 28 };
      boxes.medial = { x: 14, y: 37, w: 72, h: 25 };
      boxes.final = { x: 18, y: 64, w: 64, h: 29 };
    }
    strokes.push(...mapStrokesToBox(initial, boxes.initial, 'initial', strokes.length));
    strokes.push(...mapStrokesToBox(medial, boxes.medial, 'medial', strokes.length));
    if (final && boxes.final) {
      strokes.push(...mapStrokesToBox(final, boxes.final, 'final', strokes.length));
    }
  } else {
    // Compound vowel: horizontal part sits under initial, vertical part runs down the right
    const parts = COMPOUND_VOWEL_PARTS[medial];
    if (!hasFinal) {
      boxes.initial = { x: 12, y: 11, w: 42, h: 39 };
      boxes.medial = { x: 10, y: 10, w: 80, h: 80 };
      const horizBox: Box = { x: 10, y: 52, w: 50, h: 36 };
      const vertBox: Box = { x: 58, y: 10, w: 32, h: 80 };
      strokes.push(...mapStrokesToBox(initial, boxes.initial, 'initial', strokes.length));
      strokes.push(...mapStrokesToBox(parts.horiz, horizBox, 'medial', strokes.length));
      strokes.push(...mapStrokesToBox(parts.vert, vertBox, 'medial', strokes.length));
    } else {
      boxes.initial = { x: 14, y: 9, w: 38, h: 27 };
      boxes.medial = { x: 12, y: 8, w: 76, h: 53 };
      boxes.final = { x: 18, y: 64, w: 64, h: 29 };
      const horizBox: Box = { x: 12, y: 37, w: 46, h: 24 };
      const vertBox: Box = { x: 58, y: 8, w: 30, h: 53 };
      strokes.push(...mapStrokesToBox(initial, boxes.initial, 'initial', strokes.length));
      strokes.push(...mapStrokesToBox(parts.horiz, horizBox, 'medial', strokes.length));
      strokes.push(...mapStrokesToBox(parts.vert, vertBox, 'medial', strokes.length));
      strokes.push(...mapStrokesToBox(final, boxes.final, 'final', strokes.length));
    }
  }

  return {
    char,
    isHangul: true,
    isSingleJamo: false,
    initial,
    medial,
    final: final || undefined,
    orientation,
    strokes,
    boxes,
  };
}

// Revised Romanization of Korean (deterministic syllable-by-syllable)
const INIT_ROMAN = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's',
  'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];

const MEDIAL_ROMAN = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa',
  'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui',
  'i',
];

const FINAL_ROMAN = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k',
  'm', 'p', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't',
  't', 'ng', 't', 't', 'k', 't', 'p', 't',
];

export function romanizeHangul(text: string): string {
  const syllables: string[] = [];
  for (const ch of Array.from(text)) {
    if (isHangulSyllable(ch)) {
      const code = ch.charCodeAt(0) - HANGUL_BASE;
      const finalIdx = code % 28;
      const medialIdx = Math.floor((code - finalIdx) / 28) % 21;
      const initialIdx = Math.floor((code - finalIdx) / 588);
      syllables.push(`${INIT_ROMAN[initialIdx]}${MEDIAL_ROMAN[medialIdx]}${FINAL_ROMAN[finalIdx]}`);
    } else if (JAMO_METADATA[ch]) {
      syllables.push(JAMO_METADATA[ch].romanization.split('/')[0].trim());
    } else if (ch === ' ') {
      syllables.push(' ');
    }
  }
  return syllables.join('-').replace(/- -/g, ' ').replace(/^-|-$/g, '');
}
