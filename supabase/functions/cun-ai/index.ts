import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" }
  });

function extractText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const parts: string[] = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content?.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return json({
      error: "AI service is not configured yet.",
      answer: "The CUN AI Concierge interface is ready, but the server-side AI service has not been configured yet. The website's built-in CUN knowledge search is still available."
    }, 503);
  }

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const question = String(body?.question || "").trim();
  const context = body?.context || {};
  if (!question || question.length > 1200) return json({ error: "Invalid question" }, 400);

  const system = `You are the CUN AI Concierge for the Canadian University of Nigeria website.
Answer only from the supplied CUN web context and generally safe conversational guidance.
Do not invent fees, deadlines, accreditation claims, leadership names, contact details, rankings, programme availability, legal requirements, or academic decisions.
If the supplied context does not contain an answer, say that the information is not available in the current web catalogue and direct the visitor to the relevant CUN page or authorised office.
Keep answers concise, useful and professional.
When a page in the supplied context is relevant, mention its filename.
Never claim to be a human CUN staff member.`;

  const userInput = `CUN web context:
${JSON.stringify(context).slice(0, 50000)}

Visitor question:
${question}`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      instructions: system,
      input: userInput,
      max_output_tokens: 700
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("OpenAI request failed", response.status, detail.slice(0, 1000));
    return json({ error: "AI provider request failed" }, 502);
  }

  const data = await response.json();
  const answer = extractText(data);
  if (!answer) return json({ error: "AI provider returned no answer" }, 502);
  return json({ answer });
});
