import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("❌ Missing OPENAI_API_KEY in .env");
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export type ComputerCallAction =
  | { type: "click"; x: number; y: number; button?: "left" | "right" | "middle" }
  | { type: "scroll"; x?: number; y?: number; scroll_x?: number; scroll_y?: number }
  | { type: "keypress"; keys: string[] }
  | { type: "type"; text: string }
  | { type: "wait" };

export type AutomationUpdate =
  | { type: "reasoning"; data: { text: string }[] }
  | { type: "screenshot"; data: string }
  | { type: "final_output"; data: any }
  | { type: "safety_check"; data: any };

export async function sendCUARequest(opts: {
  input: any[];
  tools: any[];
  previousResponseId?: string;
  callId?: string;
  screenshotBase64?: string;
  safetyChecks?: any[];
}) {
  const openai = getOpenAIClient();
  return openai.responses.create({
    model: "computer-use-preview",
    tools: opts.tools,
    previous_response_id: opts.previousResponseId,
    input: opts.input,
    reasoning: { summary: "concise" },
    truncation: "auto",
    ...(opts.safetyChecks ? { acknowledged_safety_checks: opts.safetyChecks } : {}),
  });
}
