import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

function extractText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts: string[] = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (
        content?.type === "output_text" &&
        typeof content?.text === "string"
      ) {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n").trim();
}

function catalogueSummary(context: any): string {
  const programmes = Array.isArray(context?.programmes) ? context.programmes : [];
  const faculties = Array.isArray(context?.faculties) ? context.faculties : [];
  const departments = Array.isArray(context?.departments) ? context.departments : [];

  const lines: string[] = [];

  if (context?.university) {
    lines.push(`University: ${JSON.stringify(context.university)}`);
  }

  if (faculties.length) {
    lines.push(
      `Faculties / academic areas: ${faculties
        .map((x: any) => `${x.name}${x.description ? ` — ${x.description}` : ""}`)
        .join("; ")}`,
    );
  }

  if (departments.length) {
    lines.push(
      `Departments: ${departments
        .map((x: any) => x.name)
        .filter(Boolean)
        .join("; ")}`,
    );
  }

  if (programmes.length) {
    lines.push(
      `Programmes in the supplied CUN catalogue: ${programmes
        .map((x: any) => x.name)
        .filter(Boolean)
        .join("; ")}`,
    );
  }

  return lines.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");

  if (!apiKey) {
    return json(
      {
        error: "AI service is not configured yet.",
        answer:
          "The CUN AI Concierge interface is ready, but the server-side AI service has not been configured yet. The website's built-in CUN knowledge search is still available.",
      },
      503,
    );
  }

  let body: any;

  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const question = String(
    body?.question ?? body?.message ?? body?.prompt ?? "",
  ).trim();

  const context = body?.context ?? {};

  if (!question) {
    return json(
      {
        error: "Invalid question",
        answer: "Please enter a question for the CUN AI Concierge.",
      },
      400,
    );
  }

  if (question.length > 1200) {
    return json({ error: "Question is too long" }, 400);
  }

  const system = `
You are the CUN AI Concierge for the Canadian University of Nigeria website.

Answer CUN-specific questions from the supplied CUN web catalogue only.

The catalogue contains structured information from the website's own public content. Treat those supplied programme, faculty, department, university and FAQ records as authoritative for this response.

Never invent CUN-specific facts.

Do not invent or guess:
- programmes
- faculties
- departments
- fees
- admission deadlines
- admission cut-offs
- accreditation claims
- rankings
- leadership names
- phone numbers
- email addresses
- addresses
- scholarships
- academic policies
- payment information

If the supplied catalogue contains the answer, answer it directly and clearly.

For programme questions, use the actual programme names supplied in the catalogue and group them by academic area/faculty when that information is available.

For fee questions, respect the site's stated policy that unpublished fee figures must not be invented.

If the supplied catalogue does not contain enough information, say so and direct the visitor to the relevant CUN page or authorised university office.

Never claim to be a human staff member.
Never claim to have contacted CUN.
Never claim that a payment, application, admission, document or account action was completed unless the supplied context explicitly confirms it.

Keep the answer concise, professional and useful.
`;

  const suppliedContext = JSON.stringify(context).slice(0, 50000);
  const structuredFacts = catalogueSummary(context);

  const input = `
CUN WEB CATALOGUE:
${suppliedContext}

DIRECT STRUCTURED CATALOGUE FACTS:
${structuredFacts || "No structured catalogue facts were supplied."}

VISITOR QUESTION:
${question}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        instructions: system,
        input,
        max_output_tokens: 700,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();

      console.error(
        "OpenAI request failed:",
        response.status,
        detail.slice(0, 1500),
      );

      return json({ error: "AI provider request failed" }, 502);
    }

    const data = await response.json();
    const answer = extractText(data);

    if (!answer) {
      console.error(
        "OpenAI provider returned no extractable text",
        JSON.stringify(data).slice(0, 2000),
      );

      return json({ error: "AI provider returned no answer" }, 502);
    }

    return json({ answer });
  } catch (error) {
    console.error(
      "CUN AI request error:",
      error instanceof Error ? error.message : String(error),
    );

    return json({ error: "AI service temporarily unavailable" }, 502);
  }
});
