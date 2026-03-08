import { AuditData } from "../utils/scoring";

export interface AIFix {
  title: string;
  description: string;
  code: string;
  impact: "high" | "medium" | "low";
}

const SYSTEM_PROMPT = `You are azkal-pulse, an AI web audit assistant. Given audit data about a webpage, generate actionable fix suggestions with copy-paste code snippets.

Your response must be ONLY valid JSON (no markdown, no code fences) — an array of fix objects:
[
  {
    "title": "string — short fix title",
    "description": "string — what this fixes and why it matters",
    "code": "string — actual code snippet to implement the fix",
    "impact": "high" | "medium" | "low"
  }
]

Rules:
- Provide 3-6 fixes, prioritized by impact
- Code must be real, copy-pasteable HTML/CSS/JS
- Focus on the most impactful issues first
- Be specific to the actual issues found`;

export async function getAIFixes(auditData: AuditData): Promise<AIFix[]> {
  const apiKey = await getStoredApiKey();
  if (!apiKey) {
    throw new Error("Anthropic API key not configured. Set it in extension options.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      // Required for browser extensions — there's no server to proxy through
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Generate fixes for this audit:\nURL: ${auditData.url}\nScores: Performance ${auditData.scores.performance}, SEO ${auditData.scores.seo}, Accessibility ${auditData.scores.accessibility}\nIssues:\n${auditData.issues.map((i) => `- [${i.severity}] ${i.message}`).join("\n")}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(err.error?.message || `API request failed (${response.status})`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "[]";

  try {
    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

async function getStoredApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get("anthropic_api_key");
  return result.anthropic_api_key || null;
}
