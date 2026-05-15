import { Router, type Request, type Response } from 'express';
import OpenAI from 'openai';
import { z } from 'zod';

const router = Router();

// ── MiniMax client (OpenAI-compatible) ────────────────────────────────────────

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.MINIMAX_API_KEY ?? '',
    baseURL: process.env.MINIMAX_BASE_URL ?? 'https://api.minimax.chat/v1',
  });
}

// ── Zod schema — mirrors SceneNode exactly (id added client-side) ─────────────

const SceneNodeSchema = z.object({
  type:    z.enum(['rect', 'circle']),
  x:       z.number(),
  y:       z.number(),
  width:   z.number().positive(),
  height:  z.number().positive(),
  fill:    z.string().min(1),
  opacity: z.number().min(0).max(1),
});

const SceneNodesArraySchema = z.array(SceneNodeSchema).min(1).max(24);

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert UI/UX designer and creative director specialising in premium digital interfaces.

OUTPUT RULES (strictly enforced):
- Output ONLY a raw JSON array. Start with [ and end with ]. Nothing else.
- No markdown, no code fences, no backticks, no prose, no comments.
- Every element must exactly match this TypeScript type:
  { type: "rect"|"circle"; x: number; y: number; width: number; height: number; fill: string; opacity: number }

CANVAS: 800×800. Centre region is x:150–650, y:100–600. Keep elements inside the canvas.

VISUAL STYLE — "Viscosity":
- Deep, translucent layers: rgba(99,102,241,0.08), rgba(255,255,255,0.04)
- Vivid accent shapes: "#6366f1", "#8b5cf6", "#06b6d4", "#f43f5e", "#10b981"
- Mix large soft backgrounds (low opacity) with small crisp accents (high opacity)
- Vary element sizes deliberately — some large containers, some small details
- Compose 5–10 elements that form a coherent, layered design

Respond with the JSON array only.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripMarkdown(raw: string): string {
  return raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^[^[]*/, '')   // strip leading non-JSON text
    .replace(/[^\]]*$/, '')  // strip trailing non-JSON text
    .trim();
}

// ── POST /api/ai/generate ─────────────────────────────────────────────────────

const RequestSchema = z.object({
  prompt: z.string().min(1).max(600).trim(),
});

router.post('/ai/generate', async (req: Request, res: Response) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'prompt (string, 1–600 chars) is required' });
    return;
  }

  if (!process.env.MINIMAX_API_KEY) {
    res.status(503).json({ error: 'AI service not configured — set MINIMAX_API_KEY' });
    return;
  }

  try {
    const client = getClient();
    const model  = process.env.MINIMAX_MODEL ?? 'MiniMax-Text-01';

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: parsed.data.prompt },
      ],
      temperature: 0.85,
      max_tokens:  2048,
    });

    const rawText = completion.choices[0]?.message?.content ?? '';
    const cleaned = stripMarkdown(rawText);

    let jsonData: unknown;
    try {
      jsonData = JSON.parse(cleaned);
    } catch {
      console.error('[ai/generate] raw response was:', rawText);
      res.status(422).json({ error: 'AI returned malformed JSON — try a different prompt' });
      return;
    }

    const nodes = SceneNodesArraySchema.parse(jsonData);
    res.json({ nodes });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('[ai/generate] schema mismatch:', err.flatten());
      res.status(422).json({ error: 'AI returned unexpected structure — try a different prompt' });
      return;
    }
    console.error('[ai/generate] unexpected error:', err);
    res.status(500).json({ error: 'AI generation failed — please try again' });
  }
});

export default router;
