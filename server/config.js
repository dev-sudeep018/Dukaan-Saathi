import "dotenv/config";

/* Central config + feature flags. Every integration is optional; the flags let
   the rest of the app degrade gracefully when a key is missing. */
export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || "dev-insecure-secret-change-me",

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.CLAUDE_MODEL || "claude-sonnet-5",
  },

  sarvam: {
    apiKey: process.env.SARVAM_API_KEY || "",
    model: process.env.SARVAM_STT_MODEL || "saarika:v2.5",
    url: process.env.SARVAM_STT_URL || "https://api.sarvam.ai/speech-to-text",
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    from: process.env.TWILIO_WHATSAPP_FROM || "",
  },
};

/* A usable Anthropic key is a real API key ("sk-ant-api…"). OAuth / gateway
   tokens — e.g. the Claude Code client's "sk-ant-oat…" or "fe_oa_…" — are
   rejected by the Messages API with 403, so treat them as "no key" and fall
   back to the rule-based parser instead of failing a call on every message.
   (If you proxy through a custom gateway, set ANTHROPIC_API_KEY to a real
   sk-ant-api key or relax this check.) */
function usableAnthropicKey(key) {
  return (key || "").startsWith("sk-ant-api");
}

export const flags = {
  hasClaude: usableAnthropicKey(config.anthropic.apiKey),
  hasSarvam: Boolean(config.sarvam.apiKey),
  hasTwilio: Boolean(config.twilio.accountSid && config.twilio.authToken),
  // Verify Twilio's request signature on the webhook. Off by default so the
  // demo works without credentials; turn on in production (needs a public URL).
  validateTwilioSignature: process.env.VALIDATE_TWILIO_SIGNATURE === "true",
};

export function logStartupFlags() {
  console.log("  Dukaan Saathi backend — integration status:");
  console.log(
    `   • Claude parsing : ${flags.hasClaude ? "ON (" + config.anthropic.model + ")" : "OFF → rule-based mock parser"}`,
  );
  console.log(
    `   • Sarvam voice   : ${flags.hasSarvam ? "ON" : "OFF → voice notes disabled"}`,
  );
  console.log(
    `   • Twilio WhatsApp: ${flags.hasTwilio ? "ON" : "OFF → web simulator only"}`,
  );
  if (flags.hasTwilio) {
    console.log(
      `   • Twilio sig check: ${flags.validateTwilioSignature ? "ON" : "OFF → set VALIDATE_TWILIO_SIGNATURE=true in prod"}`,
    );
  }
}
