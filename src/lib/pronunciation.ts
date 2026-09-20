import { supabase } from "./supabase";

export type WordAssessment = {
  word: string;
  accuracyScore: number;
  errorType: string;
  phonemes: Array<{ phoneme: string; accuracyScore: number }>;
};

export type PronunciationAssessment = {
  recognizedText: string;
  pronunciationScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore: number | null;
  words: WordAssessment[];
};

export async function blobToWav(blob: Blob) {
  const context = new AudioContext();
  try {
    const source = await context.decodeAudioData(await blob.arrayBuffer());
    const channel = source.getChannelData(0);
    const sampleRate = 16000;
    const length = Math.max(1, Math.floor(channel.length * sampleRate / source.sampleRate));
    const pcm = new Float32Array(length);
    for (let i = 0; i < length; i += 1) pcm[i] = channel[Math.min(channel.length - 1, Math.floor(i * source.sampleRate / sampleRate))];
    return encodeWav(pcm, sampleRate);
  } finally {
    await context.close();
  }
}

function encodeWav(samples: Float32Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
}

export async function assessPronunciation(audio: Blob, target: string) {
  const body = new FormData();
  body.append("target", target);
  body.append("audio", audio, "pronunciation.wav");
  const headers: HeadersInit = {};
  const { data: sessionData } = await supabase?.auth.getSession() ?? { data: { session: null } };
  if (sessionData.session?.access_token) headers.Authorization = `Bearer ${sessionData.session.access_token}`;
  const response = await fetch("/api/pronunciation/assess", { method: "POST", headers, body });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Pronunciation assessment failed.");
  return payload as PronunciationAssessment;
}
