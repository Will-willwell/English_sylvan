import { useState } from "react";
import { Volume2 } from "lucide-react";
import { speakEnglish, speechSupported } from "../lib/speech";

export function AudioTestButton() {
  const [tested, setTested] = useState(false);
  if (!speechSupported()) return null;
  return <button className={`audio-test-button ${tested ? "tested" : ""}`} onClick={() => { speakEnglish("Sound is on"); setTested(true); }} title="Test pronunciation audio" aria-label="Test pronunciation audio"><Volume2 size={14} /><span>{tested ? "Sound on" : "Test sound"}</span></button>;
}
