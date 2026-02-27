import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import type { Attachment } from "nodemailer/lib/mailer";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

type ReportBody = {
    problemType?: unknown;
    subject?: unknown;
    description?: unknown;
    steps?: unknown;
    contactEmail?: unknown;
    pageUrl?: unknown;
    userAgent?: unknown;
};

type ParsedAttachment = {
    filename: string;
    contentType: string;
    content: Buffer;
    size: number;
};

type ParsedReportInput = {
    problemType: string;
    subject: string;
    description: string;
    steps: string;
    contactEmail: string;
    pageUrl: string;
    userAgent: string;
    attachments: ParsedAttachment[];
};

class ReportInputError extends Error {
    status: number;
    code: string;

    constructor(message: string, status = 400, code = "REPORT_INPUT_INVALID") {
        super(message);
        this.status = status;
        this.code = code;
    }
}

const DEFAULT_REPORT_TO = "marpuchydndmanager@gmail.com";
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const IMAGE_MIME_BY_EXTENSION = new Map<string, string>([
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".webp", "image/webp"],
    [".gif", "image/gif"],
    [".bmp", "image/bmp"],
]);

function extractBearerToken(header: string | null) {
    if (!header) return null;
    const normalized = header.trim();
    if (!normalized.toLowerCase().startsWith("bearer ")) return null;
    const token = normalized.slice(7).trim();
    return token.length > 0 ? token : null;
}

function asTrimmedString(value: unknown, maxLength: number): string {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseCsvRecipients(value: string | undefined) {
    if (!value) return [] as string[];
    return value
        .split(/[;,]/)
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => isValidEmail(entry));
}

function parseIntEnv(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(String(value ?? ""), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBooleanEnv(value: string | undefined, fallback: boolean) {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (!normalized) return fallback;
    if (["1", "true", "yes", "on", "si", "sí"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return fallback;
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizeProblemType(value: string) {
    const normalized = value
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (["error", "bug", "fallo"].includes(normalized)) return "Error/Bug";
    if (["visual", "ui", "interfaz"].includes(normalized)) return "Visual/UI";
    if (["datos", "data", "guardado", "save"].includes(normalized)) return "Datos";
    if (["rendimiento", "performance", "lento", "slow"].includes(normalized)) {
        return "Rendimiento";
    }
    return "Otro";
}

function getFormDataString(formData: FormData, key: string, maxLength: number) {
    const value = formData.get(key);
    if (typeof value !== "string") return "";
    return asTrimmedString(value, maxLength);
}

function extractExtensionFromFileName(fileName: string) {
    const normalized = fileName.trim().toLowerCase();
    const extensionMatch = normalized.match(/\.[a-z0-9]+$/);
    return extensionMatch?.[0] ?? "";
}

function resolveImageMimeType(file: File) {
    const mime = file.type.trim().toLowerCase();
    if (mime.startsWith("image/")) return mime;

    const extension = extractExtensionFromFileName(file.name);
    return IMAGE_MIME_BY_EXTENSION.get(extension) ?? "";
}

function sanitizeAttachmentFileName(rawName: string, fallbackIndex: number, mimeType: string) {
    const extensionFromName = extractExtensionFromFileName(rawName);
    const extension =
        extensionFromName ||
        [...IMAGE_MIME_BY_EXTENSION.entries()].find((entry) => entry[1] === mimeType)?.[0] ||
        ".png";
    const baseName = rawName
        .trim()
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\s+/g, " ")
        .replace(/\.[a-z0-9]+$/i, "")
        .slice(0, 80);
    const safeBase = baseName || `captura-${fallbackIndex}`;
    return `${safeBase}${extension}`;
}

async function parseAttachmentsFromFormData(entries: FormDataEntryValue[]) {
    const attachments: ParsedAttachment[] = [];
    let totalBytes = 0;

    for (const entry of entries) {
        if (!(entry instanceof File)) continue;
        if (entry.size <= 0) continue;

        if (attachments.length >= MAX_ATTACHMENTS) {
            throw new ReportInputError(
                `Solo se permiten ${MAX_ATTACHMENTS} imágenes adjuntas.`,
                400,
                "ATTACHMENT_LIMIT"
            );
        }

        const mimeType = resolveImageMimeType(entry);
        if (!mimeType) {
            throw new ReportInputError(
                "Solo se permiten adjuntos de imagen (PNG, JPG, WEBP, GIF o BMP).",
                400,
                "ATTACHMENT_INVALID_TYPE"
            );
        }

        if (entry.size > MAX_ATTACHMENT_BYTES) {
            throw new ReportInputError(
                `Cada imagen debe pesar como máximo ${Math.floor(
                    MAX_ATTACHMENT_BYTES / (1024 * 1024)
                )} MB.`,
                400,
                "ATTACHMENT_TOO_LARGE"
            );
        }

        totalBytes += entry.size;
        if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
            throw new ReportInputError(
                `El total de adjuntos supera el límite de ${Math.floor(
                    MAX_TOTAL_ATTACHMENT_BYTES / (1024 * 1024)
                )} MB.`,
                400,
                "ATTACHMENT_TOTAL_TOO_LARGE"
            );
        }

        const content = Buffer.from(await entry.arrayBuffer());
        attachments.push({
            filename: sanitizeAttachmentFileName(entry.name, attachments.length + 1, mimeType),
            contentType: mimeType,
            content,
            size: entry.size,
        });
    }

    return attachments;
}

async function parseReportInput(req: NextRequest): Promise<ParsedReportInput> {
    const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const attachments = await parseAttachmentsFromFormData(formData.getAll("attachments"));
        const contactEmailRaw = getFormDataString(formData, "contactEmail", 180).toLowerCase();

        return {
            problemType: normalizeProblemType(getFormDataString(formData, "problemType", 40)),
            subject: getFormDataString(formData, "subject", 140),
            description: getFormDataString(formData, "description", 6000),
            steps: getFormDataString(formData, "steps", 4000),
            contactEmail: contactEmailRaw && isValidEmail(contactEmailRaw) ? contactEmailRaw : "",
            pageUrl: getFormDataString(formData, "pageUrl", 400),
            userAgent: getFormDataString(formData, "userAgent", 300),
            attachments,
        };
    }

    const body = (await req.json().catch(() => null)) as ReportBody | null;
    const contactEmailRaw = asTrimmedString(body?.contactEmail, 180).toLowerCase();

    return {
        problemType: normalizeProblemType(asTrimmedString(body?.problemType, 40)),
        subject: asTrimmedString(body?.subject, 140),
        description: asTrimmedString(body?.description, 6000),
        steps: asTrimmedString(body?.steps, 4000),
        contactEmail: contactEmailRaw && isValidEmail(contactEmailRaw) ? contactEmailRaw : "",
        pageUrl: asTrimmedString(body?.pageUrl, 400),
        userAgent: asTrimmedString(body?.userAgent, 300),
        attachments: [],
    };
}

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const params = await context.params;
        const campaignId = String(params?.id ?? "").trim();
        if (!campaignId) {
            return NextResponse.json({ error: "campaignId inválido." }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !anonKey || !serviceKey) {
            return NextResponse.json(
                { error: "Faltan variables de entorno de Supabase en el servidor." },
                { status: 500 }
            );
        }

        const accessToken = extractBearerToken(req.headers.get("authorization"));
        if (!accessToken) {
            return NextResponse.json({ error: "No autenticado." }, { status: 401 });
        }

        const authedClient = createClient(supabaseUrl, anonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        });
        const adminClient = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        const {
            data: { user },
            error: userError,
        } = await authedClient.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
        }

        const [campaignRes, membershipRes] = await Promise.all([
            adminClient
                .from("campaigns")
                .select("id, name, owner_id")
                .eq("id", campaignId)
                .maybeSingle(),
            adminClient
                .from("campaign_members")
                .select("user_id")
                .eq("campaign_id", campaignId)
                .eq("user_id", user.id)
                .maybeSingle(),
        ]);

        if (campaignRes.error) {
            return NextResponse.json({ error: campaignRes.error.message }, { status: 500 });
        }
        if (membershipRes.error) {
            return NextResponse.json({ error: membershipRes.error.message }, { status: 500 });
        }

        if (!campaignRes.data?.id) {
            return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
        }

        const isOwner = campaignRes.data.owner_id === user.id;
        const isMember = Boolean(membershipRes.data?.user_id);
        if (!isOwner && !isMember) {
            return NextResponse.json(
                { error: "No tienes acceso a esta campaña." },
                { status: 403 }
            );
        }

        let parsedInput: ParsedReportInput;
        try {
            parsedInput = await parseReportInput(req);
        } catch (parseError) {
            if (parseError instanceof ReportInputError) {
                return NextResponse.json(
                    { error: parseError.message, code: parseError.code },
                    { status: parseError.status }
                );
            }
            throw parseError;
        }

        if (!parsedInput.subject) {
            return NextResponse.json({ error: "El asunto es obligatorio." }, { status: 400 });
        }
        if (!parsedInput.description) {
            return NextResponse.json({ error: "La descripción es obligatoria." }, { status: 400 });
        }

        const recipients = parseCsvRecipients(process.env.SUPPORT_REPORT_TO_EMAIL?.trim());
        if (!recipients.includes(DEFAULT_REPORT_TO)) {
            recipients.push(DEFAULT_REPORT_TO);
        }

        const smtpHost = process.env.SUPPORT_SMTP_HOST?.trim() || "smtp.gmail.com";
        const smtpPort = parseIntEnv(process.env.SUPPORT_SMTP_PORT, 465);
        const smtpSecure = parseBooleanEnv(process.env.SUPPORT_SMTP_SECURE, smtpPort === 465);
        const smtpUser = process.env.SUPPORT_SMTP_USER?.trim() || "";
        const smtpPass = process.env.SUPPORT_SMTP_PASS?.trim() || "";
        const fromAddress =
            process.env.SUPPORT_REPORT_FROM_EMAIL?.trim() || `DND Manager <${smtpUser}>`;

        if (!smtpUser || !smtpPass) {
            return NextResponse.json(
                {
                    error:
                        "No está configurado el envío de correo SMTP (SUPPORT_SMTP_USER y SUPPORT_SMTP_PASS).",
                    code: "SMTP_NOT_CONFIGURED",
                },
                { status: 503 }
            );
        }

        const campaignName =
            typeof campaignRes.data.name === "string" && campaignRes.data.name.trim().length > 0
                ? campaignRes.data.name.trim()
                : "(Sin nombre)";
        const createdAt = new Date().toISOString();
        const attachmentSummary =
            parsedInput.attachments.length > 0
                ? parsedInput.attachments
                      .map(
                          (attachment, index) =>
                              `${index + 1}. ${attachment.filename} (${Math.max(
                                  1,
                                  Math.round(attachment.size / 1024)
                              )} KB)`
                      )
                      .join("\n")
                : "(sin adjuntos)";

        const reportText = [
            "[DND Manager] Reporte de problema",
            `Fecha: ${createdAt}`,
            `Campaña: ${campaignName} (${campaignId})`,
            `Usuario: ${user.email ?? "(sin email)"} (${user.id})`,
            `Email de contacto: ${parsedInput.contactEmail || "(no indicado)"}`,
            `Tipo: ${parsedInput.problemType}`,
            `Asunto: ${parsedInput.subject}`,
            `Página: ${parsedInput.pageUrl || "(no indicada)"}`,
            `User-Agent: ${parsedInput.userAgent || "(no indicado)"}`,
            "",
            "Descripción:",
            parsedInput.description,
            "",
            "Pasos para reproducir:",
            parsedInput.steps || "(no indicados)",
            "",
            "Adjuntos:",
            attachmentSummary,
        ].join("\n");

        const attachments: Attachment[] = parsedInput.attachments.map((attachment) => ({
            filename: attachment.filename,
            content: attachment.content,
            contentType: attachment.contentType,
        }));

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        let sendInfo: nodemailer.SentMessageInfo;
        try {
            sendInfo = await transporter.sendMail({
                from: fromAddress,
                to: recipients,
                subject: `[DND Manager] Reporte: ${parsedInput.subject}`,
                text: reportText,
                html: `<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; line-height: 1.4;">${escapeHtml(
                    reportText
                )}</pre>`,
                replyTo: parsedInput.contactEmail || undefined,
                attachments,
            });
        } catch (sendError: any) {
            const detail = String(sendError?.message ?? "No se pudo enviar el correo.");
            return NextResponse.json(
                {
                    error: `No se pudo enviar el correo por SMTP: ${detail}`,
                    code: "SMTP_SEND_FAILED",
                },
                { status: 502 }
            );
        }

        return NextResponse.json({
            ok: true,
            deliveryId: sendInfo.messageId ?? null,
            accepted: Array.isArray(sendInfo.accepted) ? sendInfo.accepted : [],
            rejected: Array.isArray(sendInfo.rejected) ? sendInfo.rejected : [],
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message ?? "No se pudo enviar el reporte." },
            { status: 500 }
        );
    }
}
