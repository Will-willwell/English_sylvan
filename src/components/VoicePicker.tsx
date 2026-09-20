import { useEffect, useState } from "react";
import { AudioLines } from "lucide-react";
import { getEnglishVoices, getSelectedVoiceUri, setSelectedVoiceUri, type SpeechVoice } from "../lib/speech";

export function VoicePicker() {
  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const [selected, setSelected] = useState("");

  function loadVoices() {
    const next = getEnglishVoices();
    setVoices(next);
    setSelected(getSelectedVoiceUri() || next[0]?.voiceURI || "");
  }

  useEffect(() => {
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  if (!voices.length) return null;
  return <label className="voice-picker" title="Choose an English pronunciation voice"><AudioLines size={14} /><select value={selected} onChange={(event) => { setSelected(event.target.value); setSelectedVoiceUri(event.target.value); }} aria-label="English pronunciation voice">{voices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.lang.toUpperCase()} - {voice.name}</option>)}</select></label>;
}
