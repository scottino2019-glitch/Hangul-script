import {
  CHOSEONG_LIST,
  JONGSEONG_LIST,
  JUNGSEONG_LIST,
  composeHangulSyllable,
  isHangulSyllable,
} from '../data/hangulEngine';

const COMPOUND_VOWEL_COMBINE: Record<string, string> = {
  'ㅗ+ㅏ': 'ㅘ',
  'ㅗ+ㅐ': 'ㅙ',
  'ㅗ+ㅣ': 'ㅚ',
  'ㅜ+ㅓ': 'ㅝ',
  'ㅜ+ㅔ': 'ㅞ',
  'ㅜ+ㅣ': 'ㅟ',
  'ㅡ+ㅣ': 'ㅢ',
};

const COMPOUND_FINAL_COMBINE: Record<string, string> = {
  'ㄱ+ㅅ': 'ㄳ',
  'ㄴ+ㅈ': 'ㄵ',
  'ㄴ+ㅎ': 'ㄶ',
  'ㄹ+ㄱ': 'ㄺ',
  'ㄹ+ㅁ': 'ㄻ',
  'ㄹ+ㅂ': 'ㄼ',
  'ㄹ+ㅅ': 'ㄽ',
  'ㄹ+ㅌ': 'ㄾ',
  'ㄹ+ㅍ': 'ㄿ',
  'ㄹ+ㅎ': 'ㅀ',
  'ㅂ+ㅅ': 'ㅄ',
};

const SPLIT_COMPOUND_FINAL: Record<string, [string, string]> = {
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

const SPLIT_COMPOUND_VOWEL: Record<string, [string, string]> = {
  'ㅘ': ['ㅗ', 'ㅏ'],
  'ㅙ': ['ㅗ', 'ㅐ'],
  'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'],
  'ㅞ': ['ㅜ', 'ㅔ'],
  'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ'],
};

const isConsonant = (c: string) =>
  (CHOSEONG_LIST as readonly string[]).includes(c);
const isVowel = (c: string) =>
  (JUNGSEONG_LIST as readonly string[]).includes(c);

/**
 * Appends a single Korean Jamo character to an existing Hangul string
 * using standard Dubeolsik syllable composition rules.
 */
export function appendJamoToText(text: string, jamo: string): string {
  if (!text) return jamo;
  const chars = Array.from(text);
  const last = chars[chars.length - 1];
  const prefix = chars.slice(0, -1).join('');

  // Case 1: Last char is a single consonant and incoming is a vowel -> compose CV
  if (isConsonant(last) && isVowel(jamo)) {
    const iniIdx = (CHOSEONG_LIST as readonly string[]).indexOf(last);
    const medIdx = (JUNGSEONG_LIST as readonly string[]).indexOf(jamo);
    if (iniIdx >= 0 && medIdx >= 0) {
      return prefix + composeHangulSyllable(iniIdx, medIdx, 0);
    }
  }

  // Case 2: Last char is a composed Hangul syllable
  if (isHangulSyllable(last)) {
    const code = last.charCodeAt(0) - 0xac00;
    const finIdx = code % 28;
    const medIdx = Math.floor((code - finIdx) / 28) % 21;
    const iniIdx = Math.floor((code - finIdx) / 588);
    const currentMed = JUNGSEONG_LIST[medIdx];
    const currentFin = JONGSEONG_LIST[finIdx];

    // 2a: No final consonant yet
    if (finIdx === 0) {
      if (isVowel(jamo)) {
        const combinedVowel = COMPOUND_VOWEL_COMBINE[`${currentMed}+${jamo}`];
        if (combinedVowel) {
          const newMedIdx = (JUNGSEONG_LIST as readonly string[]).indexOf(combinedVowel);
          return prefix + composeHangulSyllable(iniIdx, newMedIdx, 0);
        }
      } else if (isConsonant(jamo)) {
        const newFinIdx = (JONGSEONG_LIST as readonly string[]).indexOf(jamo);
        if (newFinIdx > 0) {
          return prefix + composeHangulSyllable(iniIdx, medIdx, newFinIdx);
        }
      }
    } else {
      // 2b: Already has a final consonant
      if (isConsonant(jamo)) {
        const combinedFin = COMPOUND_FINAL_COMBINE[`${currentFin}+${jamo}`];
        if (combinedFin) {
          const newFinIdx = (JONGSEONG_LIST as readonly string[]).indexOf(combinedFin);
          return prefix + composeHangulSyllable(iniIdx, medIdx, newFinIdx);
        }
      } else if (isVowel(jamo)) {
        // Carry final consonant (or second half of compound final) as initial of next syllable
        const splitFin = SPLIT_COMPOUND_FINAL[currentFin];
        if (splitFin) {
          const remainFinIdx = (JONGSEONG_LIST as readonly string[]).indexOf(splitFin[0]);
          const nextIniIdx = (CHOSEONG_LIST as readonly string[]).indexOf(splitFin[1]);
          const nextMedIdx = (JUNGSEONG_LIST as readonly string[]).indexOf(jamo);
          if (remainFinIdx > 0 && nextIniIdx >= 0 && nextMedIdx >= 0) {
            return (
              prefix +
              composeHangulSyllable(iniIdx, medIdx, remainFinIdx) +
              composeHangulSyllable(nextIniIdx, nextMedIdx, 0)
            );
          }
        } else {
          const nextIniIdx = (CHOSEONG_LIST as readonly string[]).indexOf(currentFin);
          const nextMedIdx = (JUNGSEONG_LIST as readonly string[]).indexOf(jamo);
          if (nextIniIdx >= 0 && nextMedIdx >= 0) {
            return (
              prefix +
              composeHangulSyllable(iniIdx, medIdx, 0) +
              composeHangulSyllable(nextIniIdx, nextMedIdx, 0)
            );
          }
        }
      }
    }
  }

  return text + jamo;
}

/**
 * Backspace one Jamo step from a Hangul string.
 */
export function backspaceHangulText(text: string): string {
  if (!text) return '';
  const chars = Array.from(text);
  const last = chars[chars.length - 1];
  const prefix = chars.slice(0, -1).join('');

  if (isHangulSyllable(last)) {
    const code = last.charCodeAt(0) - 0xac00;
    const finIdx = code % 28;
    const medIdx = Math.floor((code - finIdx) / 28) % 21;
    const iniIdx = Math.floor((code - finIdx) / 588);

    if (finIdx > 0) {
      const finChar = JONGSEONG_LIST[finIdx];
      const splitFin = SPLIT_COMPOUND_FINAL[finChar];
      if (splitFin) {
        const prevFinIdx = (JONGSEONG_LIST as readonly string[]).indexOf(splitFin[0]);
        return prefix + composeHangulSyllable(iniIdx, medIdx, prevFinIdx);
      }
      return prefix + composeHangulSyllable(iniIdx, medIdx, 0);
    }

    const medChar = JUNGSEONG_LIST[medIdx];
    const splitMed = SPLIT_COMPOUND_VOWEL[medChar];
    if (splitMed) {
      const prevMedIdx = (JUNGSEONG_LIST as readonly string[]).indexOf(splitMed[0]);
      return prefix + composeHangulSyllable(iniIdx, prevMedIdx, 0);
    }

    return prefix + CHOSEONG_LIST[iniIdx];
  }

  return prefix;
}
