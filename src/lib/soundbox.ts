/**
 * Web Audio API synthesizer for the iconic Paytm Soundbox chime
 * Followed by SpeechSynthesis announcement in Hindi/English
 */
export function playPaytmChime(amount?: number) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Notes: Paytm Soundbox chime sequence (C5, G4, C5, E5, G5)
    const notes = [523.25, 392.00, 523.25, 659.25, 783.99];
    const startTime = ctx.currentTime + 0.05;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.12);

      gain.gain.setValueAtTime(0.001, startTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.12 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.12);
      osc.stop(startTime + idx * 0.12 + 0.2);
    });

    // Follow with verbal Soundbox voice notification
    if (amount && 'speechSynthesis' in window) {
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(`Paytm par ${amount.toLocaleString('en-IN')} rupaye prapt hue`);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        // Check for Hindi or Indian English voice if available
        const voices = window.speechSynthesis.getVoices();
        const indianVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
        if (indianVoice) utterance.voice = indianVoice;
        window.speechSynthesis.speak(utterance);
      }, 700);
    }
  } catch (e) {
    console.warn('AudioContext playback error:', e);
  }
}

/**
 * Synthesizes KFS speech using Web Speech Synthesis API
 */
export function speakKFS(
  text: string,
  onProgress?: (percent: number) => void,
  onEnd?: () => void
): { stop: () => void } {
  if (!('speechSynthesis' in window)) {
    // Fallback timer if speech synthesis is not supported in environment
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (onProgress) onProgress(Math.min(100, progress));
      if (progress >= 100) {
        clearInterval(interval);
        if (onEnd) onEnd();
      }
    }, 800);

    return {
      stop: () => clearInterval(interval)
    };
  }

  window.speechSynthesis.cancel(); // cancel any ongoing speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const indianVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
  if (indianVoice) utterance.voice = indianVoice;

  const totalWords = text.split(/\s+/).length;
  let wordsSpoken = 0;

  utterance.onboundary = (e) => {
    if (e.name === 'word') {
      wordsSpoken++;
      const pct = Math.min(99, Math.round((wordsSpoken / totalWords) * 100));
      if (onProgress) onProgress(pct);
    }
  };

  utterance.onend = () => {
    if (onProgress) onProgress(100);
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (onProgress) onProgress(100);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);

  return {
    stop: () => {
      window.speechSynthesis.cancel();
    }
  };
}
