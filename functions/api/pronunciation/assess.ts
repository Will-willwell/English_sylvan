import { createClient } from "@supabase/supabase-js";

type Env = { SUPABASE_URL: string; SUPABASE_SECRET_KEY?: string; SUPABASE_SERVICE_ROLE_KEY?: string; AZURE_SPEECH_KEY?: string; AZURE_SPEECH_REGION?: string };
type PagesContext = { request: Request; env: Env };

function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }); }

async function requireUser(context: PagesContext, client: ReturnType<typeof createClient>) {
  const token = (context.request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: json({ error: "Sign in before using pronunciation assessment." }, 401) };
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: json({ error: "Your session has expired. Sign in again." }, 401) };
  return { user: data.user };
}

export async function onRequest(context: PagesContext) {
  try {
    const adminKey = context.env.SUPABASE_SECRET_KEY || context.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!context.env.SUPABASE_URL || !adminKey) return json({ error: "Pronunciation API is missing Supabase server configuration." }, 500);
    if (!context.env.AZURE_SPEECH_KEY || !context.env.AZURE_SPEECH_REGION) return json({ error: "Pronunciation assessment is not configured yet. Add AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in Cloudflare." }, 503);
    const client = createClient(context.env.SUPABASE_URL, adminKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const auth = await requireUser(context, client);
    if (auth.error) return auth.error;
    const form = await context.request.formData();
    const target = typeof form.get("target") === "string" ? String(form.get("target")).trim() : "";
    const audio = form.get("audio");
    if (!target || target.length > 500) return json({ error: "A target sentence is required." }, 400);
    if (!(audio instanceof File)) return json({ error: "A WAV recording is required." }, 400);
    if (audio.size > 10 * 1024 * 1024) return json({ error: "The recording is too large. Keep it under 10 MB." }, 413);

    const assessment = {
      ReferenceText: target,
      GradingSystem: "HundredMark",
      Granularity: "Phoneme",
      Dimension: "Comprehensive",
      EnableMiscue: true,
      EnableProsodyAssessment: true,
    };
    const header = btoa(JSON.stringify(assessment));
    const endpoint = `https://${context.env.AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
    const response = await fetch(endpoint, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": context.env.AZURE_SPEECH_KEY, "Pronunciation-Assessment": header, "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000" }, body: await audio.arrayBuffer() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return json({ error: data?.error?.message || data?.message || "Azure pronunciation assessment failed." }, 502);
    const best = data?.NBest?.[0] || {};
    const scores = best?.PronunciationAssessment || {};
    const words = (best?.Words || []).map((item: any) => ({ word: item.Word || "", accuracyScore: Math.round(item.PronunciationAssessment?.AccuracyScore || 0), errorType: item.PronunciationAssessment?.ErrorType || "None", phonemes: (item.Phonemes || []).map((phoneme: any) => ({ phoneme: phoneme.Phoneme || "", accuracyScore: Math.round(phoneme.PronunciationAssessment?.AccuracyScore || 0) })) }));
    return json({ recognizedText: best.Display || data.Display || "", pronunciationScore: Math.round(scores.PronScore || 0), accuracyScore: Math.round(scores.AccuracyScore || 0), fluencyScore: Math.round(scores.FluencyScore || 0), completenessScore: Math.round(scores.CompletenessScore || 0), prosodyScore: scores.ProsodyScore == null ? null : Math.round(scores.ProsodyScore), words });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Pronunciation assessment failed." }, 500);
  }
}
