const VOICE_KEY = "lingodesk-voice-v1";

export type SpeechVoice = { name: string; lang: string; voiceURI: string };

export function getEnglishVoices(): SpeechVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices()
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

export function speakEnglish(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.86;
  utterance.pitch = 1;
  const selected = getSelectedVoiceUri();
  const voice = getEnglishVoices().find((candidate) => candidate.voiceURI === selected) || getEnglishVoices()[0];
  if (voice) {
    const nativeVoice = window.speechSynthesis.getVoices().find((candidate) => candidate.voiceURI === voice.voiceURI);
    if (nativeVoice) utterance.voice = nativeVoice;
    utterance.lang = voice.lang;
  }
  window.speechSynthesis.speak(utterance);
}
