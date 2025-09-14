// NOTE: Set GOOGLE_GENERATIVE_AI_API_KEY in Project Settings (server-side only). No edge runtime.
import type { NextRequest } from "next/server"
import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { redactPayloadForAI } from "@/lib/redact"

export async function POST(req: NextRequest) {
  try {
    const { prompt, grants, grantedData, memorySnippets = [], preferences = {} } = await req.json()

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "Missing GOOGLE_GENERATIVE_AI_API_KEY. Add it in Project Settings. We do not store or log any keys or data.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    // sanitize user-supplied pieces before sending to model
    const sanitized = {
      prompt: typeof prompt === "string" ? prompt : "",
      grants: redactPayloadForAI(grants),
      grantedData: redactPayloadForAI(grantedData),
      memorySnippets: Array.isArray(memorySnippets)
        ? memorySnippets.map((s: any) => (typeof s === "string" ? s : JSON.stringify(s))).slice(0, 50)
        : [],
      preferences: redactPayloadForAI(preferences),
    }

    const system =
      "You are a senior MongoDB expert and safe AI assistant. " +
      "Rules: 1) Use ONLY the data the user granted. 2) NEVER infer or fabricate collections or fields. " +
      "3) Prefer read-only analysis unless the user explicitly enabled auto-execution. " +
      "4) When proposing write operations, include a concise plan. " +
      "Output format: Start with a concise, helpful explanation. Then, if relevant, include a JSON plan in a fenced code block " +
      'with the language "json" and the heading AI_PLAN that the UI can parse. ' +
      "The AI_PLAN must be a JSON object with optional keys: actions[], each action has: " +
      '{ "type": "find|aggregate|insertMany|updateMany|deleteMany|command", "db": "...", "collection": "...", "params": {...}, "reason": "..." }. ' +
      "When actions affect specific documents, include an `ids` array with stringified _id values when available. " +
      "Keep JSON small and safe (no secrets)."

    // create the model via the Google provider (the provider reads GOOGLE_GENERATIVE_AI_API_KEY automatically)
    // NOTE: the model id is the provider-style id (e.g. 'gemini-1.5-pro-latest') — not 'models/...' path.
    const model = google("gemini-1.5-pro-latest")

    // compact context for the model
    const context = [
      "Context: MongoDB Manager (browser-first). Stateless APIs. User controls all permissions.",
      "User preferences: " + JSON.stringify(sanitized.preferences || {}),
      "Memory snippets (private client-provided): " + JSON.stringify(sanitized.memorySnippets || []),
      "Grants: " + JSON.stringify(sanitized.grants || {}),
      "Granted data (summarized): " + JSON.stringify(sanitized.grantedData || {}),
      "Instruction: Respond step-by-step and produce an optional AI_PLAN JSON for executable actions.",
    ].join("\n\n")

    // streamText returns a StreamTextResult. Do NOT await the streaming result; return its toDataStreamResponse()
    const result = streamText({
      model,
      system,
      prompt: `${context}\n\nUser: ${sanitized.prompt}`,
    })

    // Modern AI SDK: send the streaming response back to the client using toDataStreamResponse().
    // This replaces older helpers like toAIStreamResponse / pipeAIStreamToResponse.
    return result.toTextStreamResponse()
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
