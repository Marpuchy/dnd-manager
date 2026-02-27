"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    AlertTriangle,
    ArrowLeft,
    Copy,
    ExternalLink,
    Mail,
    Paperclip,
    Send,
    X,
} from "lucide-react";
import { useUserSettings } from "@/app/components/SettingsProvider";
import { supabase } from "@/lib/supabaseClient";
import { tr } from "@/lib/i18n/translate";

const SUPPORT_EMAIL = "marpuchydndmanager@gmail.com";
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_MB = 8;
const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;

type ProblemType = "bug" | "visual" | "data" | "performance" | "other";
type ManualEmailFallback = {
    mailto: string;
    gmailUrl: string;
    subject: string;
    body: string;
};
type ReportAttachment = {
    id: string;
    file: File;
    previewUrl: string;
};

function isImageFile(file: File) {
    const mime = file.type.trim().toLowerCase();
    if (mime.startsWith("image/")) return true;
    return /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);
}

function normalizeAttachmentFile(file: File, index: number) {
    if (file.name.trim()) return file;
    const mime = file.type.trim().toLowerCase();
    const extension = mime.startsWith("image/") ? mime.slice(6).replace("jpeg", "jpg") : "png";
    const safeExtension = /^[a-z0-9]+$/i.test(extension) ? extension : "png";
    return new File([file], `captura-${Date.now()}-${index}.${safeExtension}`, {
        type: mime || "image/png",
    });
}

export default function ReportProblemPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const campaignId = String(params.id);
    const { settings } = useUserSettings();
    const locale = settings?.locale ?? "es";
    const t = (es: string, en: string) => tr(locale, es, en);

    const [problemType, setProblemType] = React.useState<ProblemType>("bug");
    const [subject, setSubject] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [steps, setSteps] = React.useState("");
    const [contactEmail, setContactEmail] = React.useState("");
    const [attachments, setAttachments] = React.useState<ReportAttachment[]>([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [manualFallback, setManualFallback] = React.useState<ManualEmailFallback | null>(
        null
    );
    const [manualCopied, setManualCopied] = React.useState(false);
    const [manualOpenHint, setManualOpenHint] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const attachmentsRef = React.useRef<ReportAttachment[]>([]);

    React.useEffect(() => {
        attachmentsRef.current = attachments;
    }, [attachments]);

    React.useEffect(() => {
        return () => {
            for (const attachment of attachmentsRef.current) {
                URL.revokeObjectURL(attachment.previewUrl);
            }
        };
    }, []);

    function clearAttachments() {
        setAttachments((current) => {
            for (const attachment of current) {
                URL.revokeObjectURL(attachment.previewUrl);
            }
            return [];
        });
    }

    function removeAttachment(attachmentId: string) {
        setAttachments((current) =>
            current.filter((attachment) => {
                if (attachment.id !== attachmentId) return true;
                URL.revokeObjectURL(attachment.previewUrl);
                return false;
            })
        );
    }

    function addAttachmentFiles(rawFiles: File[]) {
        if (rawFiles.length === 0) return;

        setError(null);
        const nextAttachments: ReportAttachment[] = [];
        let firstError: string | null = null;
        let nextIndex = attachments.length + 1;

        for (const rawFile of rawFiles) {
            if (attachments.length + nextAttachments.length >= MAX_ATTACHMENTS) {
                firstError =
                    firstError ??
                    t(
                        `Máximo ${MAX_ATTACHMENTS} imágenes adjuntas.`,
                        `Maximum ${MAX_ATTACHMENTS} attached images.`
                    );
                break;
            }

            if (!isImageFile(rawFile)) {
                firstError =
                    firstError ??
                    t(
                        "Solo se permiten imágenes (PNG, JPG, WEBP, GIF o BMP).",
                        "Only image files are allowed (PNG, JPG, WEBP, GIF or BMP)."
                    );
                continue;
            }

            if (rawFile.size > MAX_ATTACHMENT_BYTES) {
                firstError =
                    firstError ??
                    t(
                        `Cada imagen debe pesar ${MAX_ATTACHMENT_MB} MB o menos.`,
                        `Each image must be ${MAX_ATTACHMENT_MB} MB or less.`
                    );
                continue;
            }

            const file = normalizeAttachmentFile(rawFile, nextIndex);
            nextIndex += 1;
            nextAttachments.push({
                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                file,
                previewUrl: URL.createObjectURL(file),
            });
        }

        if (nextAttachments.length > 0) {
            setAttachments((current) => [...current, ...nextAttachments]);
        }
        if (firstError) {
            setError(firstError);
        }
    }

    function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        const selected = event.target.files ? Array.from(event.target.files) : [];
        if (selected.length > 0) {
            addAttachmentFiles(selected);
        }
        event.target.value = "";
    }

    function handlePasteCapture(event: React.ClipboardEvent<HTMLDivElement>) {
        const items = Array.from(event.clipboardData.items ?? []);
        const pastedFiles: File[] = [];
        for (const item of items) {
            if (item.kind !== "file") continue;
            const file = item.getAsFile();
            if (file) pastedFiles.push(file);
        }
        if (pastedFiles.length > 0) {
            event.preventDefault();
            addAttachmentFiles(pastedFiles);
        }
    }

    function buildManualFallback(): ManualEmailFallback {
        const manualSubject = subject.trim() || t("Reporte de problema", "Problem report");
        const manualBody = [
            `Campaña: ${campaignId}`,
            `Tipo: ${problemType}`,
            `Email de contacto: ${contactEmail.trim() || "(no indicado)"}`,
            "",
            "Descripción:",
            description.trim(),
            "",
            "Pasos para reproducir:",
            steps.trim() || "(no indicados)",
        ].join("\n");
        const encodedSubject = encodeURIComponent(manualSubject);
        const encodedBody = encodeURIComponent(manualBody);
        return {
            subject: manualSubject,
            body: manualBody,
            mailto: `mailto:${SUPPORT_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`,
            gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                SUPPORT_EMAIL
            )}&su=${encodedSubject}&body=${encodedBody}`,
        };
    }

    function openManualMailClient() {
        if (!manualFallback || typeof window === "undefined") return;
        setManualOpenHint(false);
        window.location.href = manualFallback.mailto;
        window.setTimeout(() => {
            setManualOpenHint(true);
        }, 900);
    }

    function openManualGmail() {
        if (!manualFallback || typeof window === "undefined") return;
        window.open(manualFallback.gmailUrl, "_blank", "noopener,noreferrer");
    }

    async function copyManualReport() {
        if (!manualFallback || typeof window === "undefined") return;
        try {
            const fullText = `Asunto: ${manualFallback.subject}\n\n${manualFallback.body}`;
            await window.navigator.clipboard.writeText(fullText);
            setManualCopied(true);
            window.setTimeout(() => setManualCopied(false), 1800);
        } catch {
            setError(
                t(
                    "No se pudo copiar automáticamente. Copia el texto manualmente.",
                    "Could not copy automatically. Please copy the text manually."
                )
            );
        }
    }

    React.useEffect(() => {
        let active = true;
        async function prefillEmail() {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const email = session?.user?.email?.trim() ?? "";
            if (!active) return;
            if (email) setContactEmail(email);
        }
        void prefillEmail();
        return () => {
            active = false;
        };
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setManualFallback(null);
        setManualCopied(false);
        setManualOpenHint(false);

        if (!subject.trim()) {
            setError(t("Escribe un asunto.", "Please add a subject."));
            return;
        }
        if (!description.trim()) {
            setError(t("Describe el problema.", "Please describe the problem."));
            return;
        }

        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
            setError(
                t(
                    "No hay una sesión válida para enviar el reporte.",
                    "No valid session to send the report."
                )
            );
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.set("problemType", problemType);
            formData.set("subject", subject.trim());
            formData.set("description", description.trim());
            formData.set("steps", steps.trim());
            formData.set("contactEmail", contactEmail.trim());
            formData.set("pageUrl", typeof window !== "undefined" ? window.location.href : "");
            formData.set(
                "userAgent",
                typeof window !== "undefined" ? window.navigator.userAgent : ""
            );
            for (const attachment of attachments) {
                formData.append("attachments", attachment.file, attachment.file.name);
            }

            const response = await fetch(`/api/dnd/campaigns/${campaignId}/report-problem`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: formData,
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                const providerIssueCodes = new Set([
                    "RESEND_SANDBOX",
                    "SMTP_NOT_CONFIGURED",
                    "SMTP_SEND_FAILED",
                ]);
                if (providerIssueCodes.has(String(payload?.code ?? ""))) {
                    setManualFallback(buildManualFallback());
                }
                throw new Error(
                    String(
                        payload?.error ??
                            payload?.message ??
                            t("No se pudo enviar el reporte.", "Could not send report.")
                    )
                );
            }

            setSuccess(
                t(
                    "Reporte enviado correctamente. Gracias por avisar.",
                    "Report sent successfully. Thanks for the feedback."
                )
            );
            setSubject("");
            setDescription("");
            setSteps("");
            clearAttachments();
            setManualFallback(null);
            setManualCopied(false);
            setManualOpenHint(false);
        } catch (submitError) {
            setError(
                String(
                    (submitError as { message?: unknown } | null | undefined)?.message ??
                        t("No se pudo enviar el reporte.", "Could not send report.")
                )
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-surface text-ink">
            <div className="mx-auto w-full max-w-3xl px-4 py-5 space-y-4">
                <header className="rounded-2xl border border-ring bg-panel/90 p-4 shadow-[0_16px_40px_rgba(45,29,12,0.14)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold text-ink inline-flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                {t("Reportar algún problema", "Report a problem")}
                            </h1>
                            <p className="text-sm text-ink-muted mt-1">
                                {t(
                                    `Este formulario envía el reporte a ${SUPPORT_EMAIL}.`,
                                    `This form sends the report to ${SUPPORT_EMAIL}.`
                                )}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push(`/campaigns/${campaignId}/settings`)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-ring bg-white/80 px-3 py-2 text-sm text-ink hover:bg-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t("Volver a Ajustes", "Back to settings")}
                        </button>
                    </div>
                </header>

                <section className="rounded-2xl border border-ring bg-panel/90 p-5">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-[0.12em] text-ink-muted">
                                    {t("Tipo de problema", "Problem type")}
                                </label>
                                <select
                                    value={problemType}
                                    onChange={(event) =>
                                        setProblemType(event.target.value as ProblemType)
                                    }
                                    className="w-full rounded-lg border border-ring bg-white/80 px-3 py-2 text-sm text-ink focus:border-accent"
                                >
                                    <option value="bug">{t("Error/Bug", "Error/Bug")}</option>
                                    <option value="visual">{t("Visual/UI", "Visual/UI")}</option>
                                    <option value="data">{t("Datos/Guardado", "Data/Save")}</option>
                                    <option value="performance">
                                        {t("Rendimiento", "Performance")}
                                    </option>
                                    <option value="other">{t("Otro", "Other")}</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-[0.12em] text-ink-muted">
                                    {t("Email de contacto (opcional)", "Contact email (optional)")}
                                </label>
                                <input
                                    type="email"
                                    value={contactEmail}
                                    onChange={(event) => setContactEmail(event.target.value)}
                                    className="w-full rounded-lg border border-ring bg-white/80 px-3 py-2 text-sm text-ink focus:border-accent"
                                    placeholder={t("tuemail@ejemplo.com", "you@example.com")}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-[0.12em] text-ink-muted">
                                {t("Asunto", "Subject")}
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(event) => setSubject(event.target.value)}
                                className="w-full rounded-lg border border-ring bg-white/80 px-3 py-2 text-sm text-ink focus:border-accent"
                                placeholder={t(
                                    "Ej: No se guarda la subclase al bajar nivel",
                                    "Ex: Subclass is not saved when lowering level"
                                )}
                                maxLength={140}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-[0.12em] text-ink-muted">
                                {t("Descripción", "Description")}
                            </label>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                className="min-h-[150px] w-full rounded-lg border border-ring bg-white/80 px-3 py-2 text-sm text-ink focus:border-accent"
                                placeholder={t(
                                    "Describe qué ocurre y qué esperabas que ocurriera.",
                                    "Describe what happens and what you expected."
                                )}
                                maxLength={6000}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-[0.12em] text-ink-muted">
                                {t("Pasos para reproducir (opcional)", "Steps to reproduce (optional)")}
                            </label>
                            <textarea
                                value={steps}
                                onChange={(event) => setSteps(event.target.value)}
                                className="min-h-[110px] w-full rounded-lg border border-ring bg-white/80 px-3 py-2 text-sm text-ink focus:border-accent"
                                placeholder={t(
                                    "1. Abrir...\n2. Pulsar...\n3. Guardar...",
                                    "1. Open...\n2. Click...\n3. Save..."
                                )}
                                maxLength={4000}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-[0.12em] text-ink-muted">
                                {t("Capturas (opcional)", "Screenshots (optional)")}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 rounded-md border border-ring bg-white/80 px-3 py-1.5 text-xs text-ink hover:bg-white"
                                >
                                    <Paperclip className="h-3.5 w-3.5" />
                                    {t("Adjuntar imagen", "Attach image")}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileInputChange}
                                />
                                <div
                                    tabIndex={0}
                                    onPaste={handlePasteCapture}
                                    className="rounded-md border border-dashed border-ring bg-white/70 px-3 py-1.5 text-xs text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                                >
                                    {t("Pegar captura (Ctrl+V)", "Paste screenshot (Ctrl+V)")}
                                </div>
                            </div>
                            <p className="text-[11px] text-ink-muted">
                                {t(
                                    `Hasta ${MAX_ATTACHMENTS} imágenes, ${MAX_ATTACHMENT_MB} MB por imagen.`,
                                    `Up to ${MAX_ATTACHMENTS} images, ${MAX_ATTACHMENT_MB} MB each.`
                                )}
                            </p>
                            {attachments.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {attachments.map((attachment) => (
                                        <div
                                            key={attachment.id}
                                            className="relative overflow-hidden rounded-lg border border-ring bg-white/85"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={attachment.previewUrl}
                                                alt={attachment.file.name}
                                                className="h-24 w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(attachment.id)}
                                                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/70 bg-black/55 text-white hover:bg-black/70"
                                                aria-label={t("Quitar captura", "Remove screenshot")}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="px-2 py-1 text-[11px] text-ink-muted truncate">
                                                {attachment.file.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && (
                            <p className="rounded-lg border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-700">
                                {error}
                            </p>
                        )}

                        {manualFallback && (
                            <div className="rounded-lg border border-amber-200 bg-amber-100 px-3 py-2 text-sm text-amber-900 space-y-2">
                                <p>
                                    {t(
                                        "Puedes enviarlo manualmente por correo si el envío automático falla.",
                                        "You can send it manually by email if automatic delivery fails."
                                    )}
                                </p>
                                {attachments.length > 0 && (
                                    <p className="text-xs text-amber-900/80">
                                        {t(
                                            "Adjunta también las capturas manualmente desde tu correo.",
                                            "Please also attach the screenshots manually from your email app."
                                        )}
                                    </p>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={openManualMailClient}
                                        className="inline-flex items-center gap-2 rounded-md border border-amber-400/70 bg-amber-50 px-3 py-1.5 text-xs hover:bg-amber-100"
                                    >
                                        <Mail className="h-3.5 w-3.5" />
                                        {t("Enviar por correo manualmente", "Send manually by email")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={openManualGmail}
                                        className="inline-flex items-center gap-2 rounded-md border border-amber-400/70 bg-amber-50 px-3 py-1.5 text-xs hover:bg-amber-100"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        {t("Abrir en Gmail", "Open in Gmail")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={copyManualReport}
                                        className="inline-flex items-center gap-2 rounded-md border border-amber-400/70 bg-amber-50 px-3 py-1.5 text-xs hover:bg-amber-100"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        {manualCopied
                                            ? t("Copiado", "Copied")
                                            : t("Copiar reporte", "Copy report")}
                                    </button>
                                </div>
                                {manualOpenHint && (
                                    <p className="text-xs text-amber-900/80">
                                        {t(
                                            "Si no se abrió ninguna app de correo, usa Gmail o pega el texto copiado en tu gestor de correo.",
                                            "If no mail app opened, use Gmail or paste the copied text in your email client."
                                        )}
                                    </p>
                                )}
                            </div>
                        )}

                        {success && (
                            <p className="rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-2 text-sm text-emerald-700">
                                {success}
                            </p>
                        )}

                        <div className="flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-lg border border-accent/70 bg-accent/10 px-4 py-2 text-sm text-ink hover:bg-accent/20 disabled:opacity-60"
                            >
                                <Send className="h-4 w-4" />
                                {submitting
                                    ? t("Enviando...", "Sending...")
                                    : t("Enviar reporte", "Send report")}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}
