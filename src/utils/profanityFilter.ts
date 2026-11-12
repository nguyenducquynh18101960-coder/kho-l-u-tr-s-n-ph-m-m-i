/**
 * Profanity filter for THCS Nguyen Du study group chats.
 *
 * SPECIAL REQUIREMENT:
 * - "mày", "tao", "chúng mày", "bọn tao" ARE EXPLICITLY ALLOWED (not forbidden).
 * - Severe vulgarities, insults, and curse words trigger warnings and bans (5m up to 1h).
 */

// Normalized bad root words without diacritics for matching
const FORBIDDEN_ROOTS = [
  'dm',
  'dmm',
  'dcm',
  'dcmm',
  'vcl',
  'vcll',
  'vl',
  'cl',
  'cc',
  'vcc',
  'lon',
  'buoi',
  'cac',
  'chim',
  'deo',
  'dech',
  'du ma',
  'du me',
  'dit me',
  'dit me may',
  'dit me m',
  'dit ba',
  'dit cu',
  'djt me',
  'con me may',
  'ba gia may',
  'thang cho',
  'con cho',
  'cho chet',
  'cut di',
  'an cut',
  'ngu nhu cho',
  'oc cho',
  'fuck',
  'fucking',
  'bitch',
  'asshole',
  'bastard',
  'shit',
  'cunt',
  'dick',
];

// Explicitly banned exact Vietnamese phrases (with accents)
const EXACT_VI_BAD_WORDS = [
  'đm',
  'đcm',
  'đcmm',
  'đmm',
  'vcl',
  'vãi lồn',
  'vãi l',
  'vãi cặc',
  'vãi đái',
  'đụ má',
  'đụ mẹ',
  'đụ',
  'địt mẹ',
  'địt mẹ mày',
  'địt mạ',
  'địt con mẹ',
  'đĩ mẹ mày',
  'cặc',
  'buồi',
  'lồn',
  'lồl',
  'đéo',
  'đếch',
  'mẹ kiếp',
  'con mẹ nó',
  'đồ chó',
  'chó chết',
  'ăn cứt',
  'ngu như chó',
  'óc chó',
  'não chó',
  'thằng ngu',
  'con đĩ',
  'con phò',
  'thằng chó đẻ',
  'chó đẻ',
  'đồ khốn nạn',
  'khốn nạn',
];

// Whitelist patterns: "mày", "tao" are explicitly permitted
const ALLOWED_FRIENDLY_PRONOUNS = [
  'mày',
  'tao',
  'may',
  'tao',
  'chúng mày',
  'chung may',
  'bọn tao',
  'bon tao',
  'bọn mày',
  'bon may',
  'm',
  't',
];

function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export interface ProfanityCheckResult {
  hasProfanity: boolean;
  detectedWords: string[];
  cleanedText: string;
  isFriendlyMayTao: boolean;
}

export function checkProfanity(text: string): ProfanityCheckResult {
  if (!text || !text.trim()) {
    return {
      hasProfanity: false,
      detectedWords: [],
      cleanedText: text,
      isFriendlyMayTao: false,
    };
  }

  const rawLower = text.toLowerCase();
  const normalized = removeVietnameseDiacritics(rawLower);

  // Check if text has allowed "mày / tao"
  const hasMayTao = ALLOWED_FRIENDLY_PRONOUNS.some((p) => {
    const regex = new RegExp(`\\b${p}\\b`, 'i');
    return regex.test(rawLower) || regex.test(normalized);
  });

  const detectedWords: string[] = [];

  // Check exact Vietnamese bad words
  for (const bad of EXACT_VI_BAD_WORDS) {
    const escaped = bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s|[.,!?;])${escaped}($|\\s|[.,!?;])`, 'i');
    if (regex.test(rawLower)) {
      if (!detectedWords.includes(bad)) {
        detectedWords.push(bad);
      }
    }
  }

  // Check normalized roots
  // Tokenize words
  const words = normalized.split(/[\s,.;:!?+*&^%$#@~`/\-_=<>'"()[\]{}]+/);
  for (const word of words) {
    if (!word) continue;
    // Skip if word is in friendly pronoun list
    if (ALLOWED_FRIENDLY_PRONOUNS.includes(word)) {
      continue;
    }
    for (const root of FORBIDDEN_ROOTS) {
      if (word === root) {
        if (!detectedWords.includes(word)) {
          detectedWords.push(word);
        }
      }
    }
  }

  // Also check two-word combos in normalized text like "du ma", "dit me"
  for (const root of FORBIDDEN_ROOTS) {
    if (root.includes(' ')) {
      const escaped = root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\s)${escaped}($|\\s)`, 'i');
      if (regex.test(normalized)) {
        if (!detectedWords.includes(root)) {
          detectedWords.push(root);
        }
      }
    }
  }

  let cleanedText = text;
  for (const word of detectedWords) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mask = '*'.repeat(word.length);
    cleanedText = cleanedText.replace(new RegExp(escaped, 'gi'), mask);
  }

  return {
    hasProfanity: detectedWords.length > 0,
    detectedWords,
    cleanedText,
    isFriendlyMayTao: hasMayTao,
  };
}

/**
 * Calculate penalty duration in minutes based on previous violation count
 * - Strike 1: Warning only (0 minutes)
 * - Strike 2: 5 minutes
 * - Strike 3: 15 minutes
 * - Strike 4: 30 minutes
 * - Strike 5+: 60 minutes (1 hour max)
 */
export function calculateMuteDurationMinutes(violationCount: number): number {
  if (violationCount <= 1) return 0; // Strike 1 is reminder/warning
  if (violationCount === 2) return 5; // 5 minutes
  if (violationCount === 3) return 15; // 15 minutes
  if (violationCount === 4) return 30; // 30 minutes
  return 60; // Max 1 hour
}
