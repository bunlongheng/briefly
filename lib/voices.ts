// Curated realistic, clear narrator voices (ElevenLabs premade).
// Pure data only (no env) so it is safe to import in client components.
export type Voice = { id: string; name: string; desc: string };

export const VOICES: Voice[] = [
  { id: "CiFCWMnwjJGp46Pc0F6e", name: "Bunlong", desc: "My cloned voice" },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", desc: "Clear, natural, realistic" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", desc: "Soft, warm, gentle" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", desc: "Warm friendly narrator" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", desc: "Clear British female" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", desc: "Soft, cozy female" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", desc: "Deep, calm male" },
];

// Pure default (no env read here - this module is imported client-side too).
// The server resolves BRIEFLY_VOICE_ID over this in the API route.
export const FALLBACK_VOICE = VOICES[0].id;
export const voiceName = (id: string) => VOICES.find((v) => v.id === id)?.name || "Custom";
