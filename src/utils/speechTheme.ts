/**
 * Web Speech Synthesis Utility for Background Theme Name Announcement
 */

export function speakThemeName(themeCallName: string, enabled: boolean = true): void {
  if (!enabled || typeof window === 'undefined') return;

  try {
    if (!('speechSynthesis' in window)) {
      console.warn('Trình duyệt không hỗ trợ Web Speech Synthesis.');
      return;
    }

    // Cancel any running speech
    window.speechSynthesis.cancel();

    const textToSpeak = `Phông nền ${themeCallName}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    // Pick Vietnamese voice if available
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(
      (v) =>
        v.lang === 'vi-VN' ||
        v.lang === 'vi' ||
        v.name.toLowerCase().includes('vietnam') ||
        v.name.toLowerCase().includes('tiếng việt')
    );

    if (viVoice) {
      utterance.voice = viVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Không thể phát âm thanh đọc tên phông nền:', err);
  }
}

export function speakUserGreeting(userName: string, enabled: boolean = true): void {
  if (!enabled || typeof window === 'undefined') return;

  try {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const safeName = userName?.trim() || 'bạn';
    const textToSpeak = `Chào ${safeName}! Max10 rất vui được đồng hành cùng bạn săn điểm 10!`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(
      (v) =>
        v.lang === 'vi-VN' ||
        v.lang === 'vi' ||
        v.name.toLowerCase().includes('vietnam') ||
        v.name.toLowerCase().includes('tiếng việt')
    );

    if (viVoice) {
      utterance.voice = viVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Không thể phát âm thanh chào tên:', err);
  }
}
