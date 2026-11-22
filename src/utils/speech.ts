export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakKorean(text: string, rate = 0.82): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isSpeechSupported() || !text.trim()) {
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = rate;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const koreanVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith('ko-kr')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('ko'));

      if (koreanVoice) {
        utterance.voice = koreanVoice;
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve(false);
    }
  });
}
