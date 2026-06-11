# Teach2go — AI Teaching Pipeline Spike

Phase 1 spike for the Teach2go MVP (AI tutor for Nigerian JSS students): proves a real-time
teaching turn — streamed Claude lesson speech plus a live synchronized whiteboard animation —
within the 3-second latency budget. TTS and avatar vendors are stubbed behind swappable
interfaces; only a Claude API key is required.

## Run it

1. `npm install`
2. Put your key in `.env.local`: `ANTHROPIC_API_KEY=sk-ant-...`
3. `npm run dev` → http://localhost:3000
4. Click **Start lesson**. Toggle the latency HUD numbers bottom-right.

## What's real vs stubbed

| Piece | Status |
|---|---|
| LLM teaching turns (Claude Sonnet, streamed, tagged sections) | Real |
| Live canvas animations (react-konva, narration-synced) | Real |
| Check questions, lesson state, latency metrics | Real |
| Voice | Browser SpeechSynthesis stub (`SpeechEngine` interface → ElevenLabs later) |
| Avatar | Static persona card (`AvatarPane` → HeyGen stream later) |
| Prebuilt assets | Placeholder cards showing the chosen asset id |

## Tests

`npm test` — Vitest unit tests for the tagged-section parser, directive normalizer,
scene builder, lesson state/check matching, prompt builder, tutor engine, and SSE decoder.

## Spike go/no-go criteria

See `docs/superpowers/specs/2026-06-10-teach2go-pipeline-spike-design.md` in the parent
workspace repo (§7).
