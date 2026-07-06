import { config, flags } from "../config.js";

/* Sarvam AI speech-to-text. Auto-detects Telugu / Hindi / English.
   Docs: https://docs.sarvam.ai (endpoint + params overridable via env in case
   the API surface changes). Returns { transcript, language }.

   `audio` is a Buffer; `contentType` like "audio/ogg" or "audio/webm". */
export async function transcribe(audio, contentType = "audio/ogg", filename = "note.ogg") {
  if (!flags.hasSarvam) {
    return { transcript: "", language: null, disabled: true };
  }

  const form = new FormData();
  form.append("file", new Blob([audio], { type: contentType }), filename);
  form.append("model", config.sarvam.model);
  form.append("language_code", "unknown"); // let Sarvam auto-detect the language

  const resp = await fetch(config.sarvam.url, {
    method: "POST",
    headers: { "api-subscription-key": config.sarvam.apiKey },
    body: form,
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`Sarvam STT ${resp.status}: ${detail.slice(0, 200)}`);
  }

  const data = await resp.json();
  // Sarvam returns { transcript, language_code, request_id, ... }
  const transcript = data.transcript || data.text || "";
  const language = mapLang(data.language_code);
  return { transcript, language };
}

function mapLang(code) {
  if (!code) return null;
  const c = String(code).toLowerCase();
  if (c.startsWith("te")) return "te";
  if (c.startsWith("hi")) return "hi";
  if (c.startsWith("en")) return "en";
  return null;
}
