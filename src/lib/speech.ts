const VOICE_KEY = "lingodesk-voice-v1";

export type SpeechVoice = { name: string; lang: string; voiceURI: string };

function speechApi() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
}

export function getEnglishVoices(): SpeechVoice[] {
  const synthesis = speechApi();
  if (!synthesis) return [];
  return synthesis.getVoices()
    .filter((voice) => /^en(-|_)/i.test(voice.lang))
    .map((voice) => ({ name: voice.name, lang: voice.lang, voiceURI: voice.voiceURI }))
    .sort((a, b) => {
      const score = (voice: SpeechVoice) => voice.lang.toLowerCase().startsWith("en-us") ? 0 : voice.lang.toLowerCase().startsWith("en-gb") ? 1 : 2;
      return score(a) - score(b) || a.name.localeCompare(b.name);
    });
}

export function getSelectedVoiceUri() {
  return localStorage.getItem(VOICE_KEY) || "";
}

export function setSelectedVoiceUri(uri: string) {
  localStorage.setItem(VOICE_KEY, uri);
}

export function speechSupported() {
  return Boolean(speechApi() && typeof SpeechSynthesisUtterance !== "undefined");
}

export function resumeSpeech() {
  speechApi()?.resume();
}

export function speakEnglish(text: string) {
  const synthesis = speechApi();
  if (!synthesis || typeof SpeechSynthesisUtterance === "undefined") return false;

  synthesis.cancel();
  synthesis.resume();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.86;
  utterance.pitch = 1;
  const nativeVoices = synthesis.getVoices();
  const selected = getSelectedVoiceUri();
  const nativeVoice = nativeVoices.find((voice) => voice.voiceURI === selected)
    || nativeVoices.find((voice) => /^en(-|_)/i.test(voice.lang) && /^en(-|_)us/i.test(voice.lang))
    || nativeVoices.find((voice) => /^en(-|_)/i.test(voice.lang));
  if (nativeVoice) {
    utterance.voice = nativeVoice;
    utterance.lang = nativeVoice.lang;
  }

  // iOS Safari can return an empty voice list until after a user gesture.
  // Speaking after a short task-queue turn lets the engine finish resuming.
  window.setTimeout(() => {
    synthesis.resume();
    synthesis.speak(utterance);
  }, 0);
  return true;
}
