import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildLearningDigest,
  resolveDigestPeriodFromInput,
  type GlobalLearningEvent,
  type LearningDigestFrequency,
} from "@/lib/ai/globalLearningDigest";

export const runtime = "nodejs";

type DigestRequestBody = {
  frequency?: unknown;
  periodStart?: unknown;
  periodEnd?: unknown;
  sendEmail?: unknown;
  force?: unknown;
  dryRun?: unknown;
};

type DigestRow = {
  id: string;
  frequency: LearningDigestFrequency;
  period_start: string;
  period_end: string;
  source_event_count: number;
  edit_feedback_count: number;
  summary_markdown: string;
  summary_json: unknown;
  email_status: string;
  email_error: string | null;
  delivered_to: string[] | null;
  generated_at: string;
  created_at: string;
  updated_at: string;
};

type DigestSubscriberRow = {
  email: string | null;
};

type ResendResponse = {
  id?: string;
  error?: {
    message?: string;
  };
};

const DEFAULT_FREQUENCY: LearningDigestFrequency = "weekly";

function extractBearerToken(header: string | null) {
  if (!header) return null;
  const normalized = header.trim();
  if (!normalized.toLowerCase().startsWith("bearer ")) return null;
  const token = normalized.slice(7).trim();
  return token.length > 0 ? token : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const compact = value.trim().toLowerCase();
    if (compact === "true" || compact === "1" || compact === "yes" || compact === "si") {
      return true;
    }
    if (compact === "false" || compact === "0" || compact === "no") {
      return false;
    }
  }
  return fallback;
}

function parseFrequency(value: unknown): LearningDigestFrequency {
  if (typeof value !== "string") return DEFAULT_FREQUENCY;
  const compact = value.trim().toLowerCase();
  if (compact === "daily" || compact === "diario") return "daily";
  if (compact === "weekly" || compact === "semanal") return "weekly";
  return DEFAULT_FREQUENCY;
}

function parseCsvRecipients(value: string | undefined) {
  if (!value) return [] as string[];
  return value
    .split(/[;,]/)
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry));
}

function parseIsoDate(value: unknown) {
  if (typeof value !== "string") return undefined;
  const compact = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(compact) ? compact : undefined;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isMissingRelationError(error: unknown) {
  if (!isRecord(error)) return false;
  const code = typeof error.code === "string" ? error.code : "";
  if (code === "42P01") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("does not exist") && (message.includes("table") || message.includes("relation"));
}

function buildDigestEmailSubject(frequency: LearningDigestFrequency, periodStart: string, periodEnd: string) {
  const label = frequency === "weekly" ? "semanal" : "diario";
  return `[DND Manager] Digest ${label} IA (${periodStart} -> ${periodEnd})`;
}

async function sendDigestEmailViaResend({
  apiKey,
  from,
  to,
  subject,
  text,
}: {
  apiKey: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
}) {
  const html = `<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; line-height: 1.4;">${escapeHtml(
    text
  )}</pre>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html,
    }),
  });

  const payload = (await response.json().catch(() => null)) as ResendResponse | null;

  if (!response.ok) {
    const detail = payload?.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Resend error: ${detail}`);
  }

  return payload?.id ?? null;
}

function getDigestSecret(req: NextRequest) {
  const explicit = req.headers.get("x-ai-learning-secret")?.trim();
  if (explicit) return explicit;
  return extractBearerToken(req.headers.get("authorization"));
}

export async function POST(req: NextRequest) {
  try {
    const configuredSecret = process.env.AI_LEARNING_DIGEST_SECRET?.trim();
    if (!configuredSecret) {
      return NextResponse.json(
        { error: "Falta AI_LEARNING_DIGEST_SECRET en el servidor." },
        { status: 500 }
      );
    }

    const providedSecret = getDigestSecret(req);
    if (!providedSecret || providedSecret !== configuredSecret) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Faltan variables de Supabase en el servidor." },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => null)) as DigestRequestBody | null;
    const frequency = parseFrequency(body?.frequency);
    const force = asBoolean(body?.force, false);
    const dryRun = asBoolean(body?.dryRun, false);
    const sendEmail =
      body?.sendEmail === undefined
        ? frequency === "weekly"
        : asBoolean(body?.sendEmail, false);

    const period = resolveDigestPeriodFromInput({
      frequency,
      periodStart: parseIsoDate(body?.periodStart),
      periodEnd: parseIsoDate(body?.periodEnd),
      now: new Date(),
    });

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const eventsRes = await adminClient
      .from("ai_global_training_events")
      .select("id, created_at, instruction, context_hint, assistant_mode, training_submode, role")
      .gte("created_at", period.periodStartIso)
      .lt("created_at", period.periodEndIso)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (eventsRes.error) {
      if (isMissingRelationError(eventsRes.error)) {
        return NextResponse.json(
          {
            error:
              "Falta la tabla ai_global_training_events. Ejecuta las migraciones de aprendizaje global.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: eventsRes.error.message }, { status: 500 });
    }

    const events = (Array.isArray(eventsRes.data) ? eventsRes.data : []) as GlobalLearningEvent[];

    const digest = buildLearningDigest({
      frequency,
      periodStart: period.periodStartDate,
      periodEnd: period.periodEndDate,
      events,
    });

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        frequency,
        periodStart: period.periodStartDate,
        periodEnd: period.periodEndDate,
        sourceEventCount: digest.sourceEventCount,
        editFeedbackCount: digest.editFeedbackCount,
        summaryMarkdown: digest.summaryMarkdown,
        summaryJson: digest.summaryJson,
      });
    }

    if (!force) {
      const existingRes = await adminClient
        .from("ai_global_learning_digests")
        .select(
          "id, frequency, period_start, period_end, source_event_count, edit_feedback_count, summary_markdown, summary_json, email_status, email_error, delivered_to, generated_at, created_at, updated_at"
        )
        .eq("frequency", frequency)
        .eq("period_start", period.periodStartDate)
        .eq("period_end", period.periodEndDate)
        .maybeSingle();

      if (existingRes.error && !isMissingRelationError(existingRes.error)) {
        return NextResponse.json({ error: existingRes.error.message }, { status: 500 });
      }

      if (existingRes.data && !sendEmail) {
        return NextResponse.json({
          reused: true,
          digest: existingRes.data,
        });
      }
    }

    const upsertPayload = {
      frequency,
      period_start: period.periodStartDate,
      period_end: period.periodEndDate,
      source_event_count: digest.sourceEventCount,
      edit_feedback_count: digest.editFeedbackCount,
      summary_markdown: digest.summaryMarkdown,
      summary_json: digest.summaryJson,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email_status: sendEmail ? "pending" : "skipped",
      email_error: null as string | null,
    };

    const upsertRes = await adminClient
      .from("ai_global_learning_digests")
      .upsert(upsertPayload, { onConflict: "frequency,period_start,period_end" })
      .select(
        "id, frequency, period_start, period_end, source_event_count, edit_feedback_count, summary_markdown, summary_json, email_status, email_error, delivered_to, generated_at, created_at, updated_at"
      )
      .maybeSingle();

    if (upsertRes.error) {
      if (isMissingRelationError(upsertRes.error)) {
        return NextResponse.json(
          {
            error:
              "Falta la tabla ai_global_learning_digests. Ejecuta la migracion 2026-02-20-ai-global-learning-digests.sql.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: upsertRes.error.message }, { status: 500 });
    }

    const digestRow = upsertRes.data as DigestRow | null;
    if (!digestRow?.id) {
      return NextResponse.json({ error: "No se pudo persistir el digest." }, { status: 500 });
    }

    if (!sendEmail) {
      return NextResponse.json({
        digest: digestRow,
        email: {
          attempted: false,
          status: "skipped",
          reason: "sendEmail=false",
          recipients: [],
        },
      });
    }

    const recipientSet = new Set<string>();

    for (const mail of parseCsvRecipients(process.env.AI_LEARNING_DIGEST_TO_EMAIL)) {
      recipientSet.add(mail);
    }

    const subscribersRes = await adminClient
      .from("ai_global_learning_subscribers")
      .select("email")
      .eq("is_active", true)
      .eq("frequency", frequency);

    if (subscribersRes.error && !isMissingRelationError(subscribersRes.error)) {
      return NextResponse.json({ error: subscribersRes.error.message }, { status: 500 });
    }

    if (!subscribersRes.error && Array.isArray(subscribersRes.data)) {
      for (const row of subscribersRes.data as DigestSubscriberRow[]) {
        const email = typeof row.email === "string" ? row.email.trim().toLowerCase() : "";
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          recipientSet.add(email);
        }
      }
    }

    const recipients = [...recipientSet];

    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const resendFrom = process.env.AI_LEARNING_DIGEST_FROM_EMAIL?.trim();

    let emailStatus: "sent" | "failed" | "skipped" = "skipped";
    let emailError: string | null = null;
    let deliveryId: string | null = null;

    if (recipients.length === 0) {
      emailStatus = "skipped";
      emailError = "No hay destinatarios configurados para digest.";
    } else if (!resendApiKey || !resendFrom) {
      emailStatus = "skipped";
      emailError = "Faltan RESEND_API_KEY o AI_LEARNING_DIGEST_FROM_EMAIL.";
    } else {
      try {
        deliveryId = await sendDigestEmailViaResend({
          apiKey: resendApiKey,
          from: resendFrom,
          to: recipients,
          subject: buildDigestEmailSubject(
            digestRow.frequency,
            digestRow.period_start,
            digestRow.period_end
          ),
          text: digestRow.summary_markdown,
        });
        emailStatus = "sent";
      } catch (error) {
        emailStatus = "failed";
        emailError = error instanceof Error ? error.message : "Error enviando digest por email.";
      }
    }

    const updateRes = await adminClient
      .from("ai_global_learning_digests")
      .update({
        updated_at: new Date().toISOString(),
        delivered_to: recipients,
        email_status: emailStatus,
        email_error: emailError,
      })
      .eq("id", digestRow.id);

    if (updateRes.error) {
      return NextResponse.json({ error: updateRes.error.message }, { status: 500 });
    }

    const refreshedRes = await adminClient
      .from("ai_global_learning_digests")
      .select(
        "id, frequency, period_start, period_end, source_event_count, edit_feedback_count, summary_markdown, summary_json, email_status, email_error, delivered_to, generated_at, created_at, updated_at"
      )
      .eq("id", digestRow.id)
      .maybeSingle();

    if (refreshedRes.error) {
      return NextResponse.json({ error: refreshedRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      digest: refreshedRes.data,
      email: {
        attempted: true,
        status: emailStatus,
        error: emailError,
        recipients,
        deliveryId,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error generando digest de aprendizaje.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const configuredSecret = process.env.AI_LEARNING_DIGEST_SECRET?.trim();
    if (!configuredSecret) {
      return NextResponse.json(
        { error: "Falta AI_LEARNING_DIGEST_SECRET en el servidor." },
        { status: 500 }
      );
    }

    const providedSecret = getDigestSecret(req);
    if (!providedSecret || providedSecret !== configuredSecret) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Faltan variables de Supabase en el servidor." },
        { status: 500 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const frequencyRaw = req.nextUrl.searchParams.get("frequency");
    const frequency = frequencyRaw ? parseFrequency(frequencyRaw) : null;

    let latestQuery = adminClient
      .from("ai_global_learning_digests")
      .select(
        "id, frequency, period_start, period_end, source_event_count, edit_feedback_count, summary_markdown, summary_json, email_status, email_error, delivered_to, generated_at, created_at, updated_at"
      )
      .order("period_end", { ascending: false })
      .limit(1);

    if (frequency) {
      latestQuery = latestQuery.eq("frequency", frequency);
    }

    const latestRes = await latestQuery.maybeSingle();

    if (latestRes.error) {
      if (isMissingRelationError(latestRes.error)) {
        return NextResponse.json(
          {
            error:
              "Falta la tabla ai_global_learning_digests. Ejecuta la migracion 2026-02-20-ai-global-learning-digests.sql.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: latestRes.error.message }, { status: 500 });
    }

    if (!latestRes.data) {
      return NextResponse.json({ digest: null });
    }

    return NextResponse.json({ digest: latestRes.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error leyendo digest de aprendizaje.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

