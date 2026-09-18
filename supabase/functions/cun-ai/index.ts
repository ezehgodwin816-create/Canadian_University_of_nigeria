import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json",
    },
  });

function extractText(data: any): string {
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return json(
      {
        error: "Method not allowed",
      },
      405,
    );
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
    return json(
      {
        error: "Invalid JSON",
      },
      400,
    );
  }

  /*
   * Accept both formats:
   *
   * { "question": "..." }
   *
   * and
   *
   * { "message": "..." }
   *
   * This keeps the Edge Function compatible with the current
   * CUN website frontend and Supabase testing tools.
   */
  const question = String(
    body?.question ??
      body?.message ??
      body?.prompt ??
      "",
  ).trim();

  const context = body?.context ?? {};

  if (!question) {
    return json(
      {
        error: "Invalid question",
        answer:
          "Please enter a question for the CUN AI Concierge.",
      },
      400,
    );
  }

  if (question.length > 1200) {
    return json(
      {
        error: "Question is too long",
      },
      400,
    );
  }

  const system = `
You are the CUN AI Concierge for the Canadian University of Nigeria website.

Your job is to help visitors understand information contained in the supplied CUN web context.

IMPORTANT RULES:

1. Use the supplied CUN web context as the primary source.
2. Do not invent CUN-specific information.
3. Do not invent:
   - fees
   - admission requirements
   - deadlines
   - programmes
   - faculties
   - departments
   - accreditation claims
   - rankings
   - leadership names
   - contact details
   - addresses
   - phone numbers
   - scholarships
   - academic policies
   - legal requirements
   - payment information
4. If the supplied context does not contain the requested CUN-specific information, clearly say that the information is not available in the current web catalogue.
5. When appropriate, direct the visitor to the relevant CUN page or authorised university office.
6. You may provide general educational or conversational guidance when it is clearly not being presented as an official CUN fact.
7. Never claim to be a human CUN staff member.
8. Never claim that you have personally contacted CUN.
9. Never claim that an application, payment, admission, document, result, or account action has been completed unless the supplied system context explicitly confirms it.
10. Keep responses concise, professional and useful.
11. When a relevant page/file is present in the supplied context, mention its filename where useful.
12. If several pieces of context are relevant, combine them carefully without creating facts that are not present.
13. If the visitor asks a question unrelated to CUN, answer briefly when safe, but make clear that you are the CUN AI Concierge.
`;

  const contextText = JSON.stringify(context).slice(0, 50000);

  const userInput = `
CUN WEB CONTEXT:
${contextText}

VISITOR QUESTION:
${question}
`;

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          instructions: system,
          input: userInput,
          max_output_tokens: 700,
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();

      console.error(
        "OpenAI request failed:",
        response.status,
        detail.slice(0, 1500),
      );

      return json(
        {
          error: "AI provider request failed",
        },
        502,
      );
    }

    const data = await response.json();

    const answer = extractText(data);

    if (!answer) {
      console.error(
        "OpenAI provider returned no extractable text",
        JSON.stringify(data).slice(0, 2000),
      );

      return json(
        {
          error: "AI provider returned no answer",
        },
        502,
      );
    }

    return json({
      answer,
    });
  } catch (error) {
    console.error(
      "CUN AI request error:",
      error instanceof Error
        ? error.message
        : String(error),
    );

    return json(
      {
        error: "AI service temporarily unavailable",
      },
      502,
    );
  }
});
