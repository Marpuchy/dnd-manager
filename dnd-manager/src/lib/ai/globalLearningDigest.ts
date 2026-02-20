export type LearningDigestFrequency = "daily" | "weekly";

export type GlobalLearningEvent = {
  id?: string | null;
  created_at?: string | null;
  instruction?: string | null;
  context_hint?: string | null;
  assistant_mode?: string | null;
  training_submode?: string | null;
  role?: string | null;
};

export type LearningDigestCountEntry = {
  label: string;
  count: number;
};

export type LearningDigestRuleEntry = {
  rule: string;
  count: number;
};

export type LearningDigestSummaryJson = {
  generatedAt: string;
  frequency: LearningDigestFrequency;
  periodStart: string;
  periodEnd: string;
  totals: {
    sourceEvents: number;
    editFeedbackEvents: number;
  };
  topContextHints: LearningDigestCountEntry[];
  topCorrections: LearningDigestCountEntry[];
  consolidatedRules: LearningDigestRuleEntry[];
};

export type BuiltLearningDigest = {
  sourceEventCount: number;
  editFeedbackCount: number;
  summaryMarkdown: string;
  summaryJson: LearningDigestSummaryJson;
};

const DEFAULT_TOP_CONTEXTS = 8;
const DEFAULT_TOP_CORRECTIONS = 12;
const DEFAULT_TOP_RULES = 10;

const FEEDBACK_HINT_KEYS = new Set(["user-edit-feedback"]);

const RULE_PATTERNS: Array<{ pattern: RegExp; rule: string }> = [
  {
    pattern: /\b(cr|challenge|desafio|xp|pb|proficiency|proficiencia)\b/,
    rule: "Inferir CR, XP y PB coherentes con HP, CA y dano cuando falten.",
  },
  {
    pattern: /\b(accion|acciones|reaccion|reacciones|bonus action|ataque|ataques|habilidad|habilidades)\b/,
    rule: "No perder acciones, reacciones ni habilidades explicitas al crear o editar criaturas.",
  },
  {
    pattern: /\b(debilidad|debilidades|weakness|resistencia|resistencias|resistance|vulnerabilidad)\b/,
    rule: "Mapear debilidades y resistencias en rasgos estructurados, no solo en notas.",
  },
  {
    pattern: /\b(swim|nado|velocidad|speed|fly|vuelo|burrow|trepar|climb)\b/,
    rule: "Conservar todos los modos de velocidad detectados (walk, swim, fly, etc.).",
  },
  {
    pattern: /\b(duplicad|duplicar|crear|edita|editar|update|nombre)\b/,
    rule: "Si ya existe una criatura con el mismo nombre, priorizar edicion frente a creacion duplicada.",
  },
  {
    pattern: /\b(emoji|emoticon|encabezado|combate|manifestacion|manifestacion|forma incompleta)\b/,
    rule: "Filtrar encabezados narrativos y emojis para no contaminar bloques de acciones/rasgos.",
  },
  {
    pattern: /\b(hit dice|dados de golpe|hp|vida|constitucion|con)\b/,
    rule: "Ajustar dados de golpe y Constitucion de forma coherente con los HP declarados.",
  },
  {
    pattern: /\b(notas|rasgos|traits|trait|notes)\b/,
    rule: "Evitar duplicaciones entre notas y rasgos; priorizar rasgos para mecanicas.",
  },
  {
    pattern: /\b(letania|letania maldita|maldita|susurro|cd\s*\d+)\b/,
    rule: "Detectar texto de habilidad con pista de tipo (accion/reaccion/pasiva) y convertirlo en bloque estructurado.",
  },
];

function toUtcMidnight(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clip(value: string, max = 260) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3).trimEnd()}...`;
}

function countToSortedEntries(counter: Map<string, number>, limit: number): LearningDigestCountEntry[] {
  return [...counter.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function countRulesToSortedEntries(counter: Map<string, number>, limit: number): LearningDigestRuleEntry[] {
  return [...counter.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([rule, count]) => ({ rule, count }));
}

function extractFeedbackSummaryLine(instruction: string) {
  const lines = instruction
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const summaryMatch = line.match(/^resumen\s*:\s*(.+)$/i);
    if (summaryMatch?.[1]) {
      return clip(compactText(summaryMatch[1]));
    }
  }

  const filtered = lines.filter((line) => {
    if (/^correccion\s+de\s+propuesta\s+ia/i.test(line)) return false;
    if (/^(instruccion|antes|despues)\s*:/i.test(line)) return false;
    if (/^prompt\s*:/i.test(line)) return false;
    return true;
  });

  if (filtered.length === 0) {
    return clip(compactText(instruction));
  }

  const merged = compactText(filtered.join(" "));
  const firstSentence = merged.split(/(?<=[.!?])\s+/)[0] ?? merged;
  return clip(compactText(firstSentence));
}

function isFeedbackEvent(event: GlobalLearningEvent) {
  const hint = compactText(String(event.context_hint ?? "")).toLowerCase();
  if (FEEDBACK_HINT_KEYS.has(hint)) return true;
  const instruction = compactText(String(event.instruction ?? "")).toLowerCase();
  return instruction.includes("correccion de propuesta ia");
}

function inferRulesFromFeedbackText(value: string) {
  const normalized = normalizeText(value);
  const out = new Set<string>();
  for (const entry of RULE_PATTERNS) {
    if (entry.pattern.test(normalized)) out.add(entry.rule);
  }
  return out;
}

function asValidDate(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return toUtcMidnight(parsed);
}

export function resolveDigestPeriod({
  frequency,
  now = new Date(),
}: {
  frequency: LearningDigestFrequency;
  now?: Date;
}) {
  const todayStart = toUtcMidnight(now);

  if (frequency === "daily") {
    const periodEnd = todayStart;
    const periodStart = new Date(periodEnd.getTime() - 24 * 60 * 60 * 1000);
    return {
      periodStart,
      periodEnd,
      periodStartDate: isoDate(periodStart),
      periodEndDate: isoDate(periodEnd),
      periodStartIso: periodStart.toISOString(),
      periodEndIso: periodEnd.toISOString(),
    };
  }

  const day = todayStart.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const currentWeekStart = new Date(todayStart.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
  const periodEnd = currentWeekStart;
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    periodStart,
    periodEnd,
    periodStartDate: isoDate(periodStart),
    periodEndDate: isoDate(periodEnd),
    periodStartIso: periodStart.toISOString(),
    periodEndIso: periodEnd.toISOString(),
  };
}

export function resolveDigestPeriodFromInput({
  frequency,
  periodStart,
  periodEnd,
  now = new Date(),
}: {
  frequency: LearningDigestFrequency;
  periodStart?: string;
  periodEnd?: string;
  now?: Date;
}) {
  const startParsed = asValidDate(periodStart);
  const endParsed = asValidDate(periodEnd);

  if (!startParsed || !endParsed) {
    return resolveDigestPeriod({ frequency, now });
  }

  if (startParsed.getTime() >= endParsed.getTime()) {
    return resolveDigestPeriod({ frequency, now });
  }

  return {
    periodStart: startParsed,
    periodEnd: endParsed,
    periodStartDate: isoDate(startParsed),
    periodEndDate: isoDate(endParsed),
    periodStartIso: startParsed.toISOString(),
    periodEndIso: endParsed.toISOString(),
  };
}

export function buildLearningDigest({
  frequency,
  periodStart,
  periodEnd,
  events,
}: {
  frequency: LearningDigestFrequency;
  periodStart: string;
  periodEnd: string;
  events: GlobalLearningEvent[];
}): BuiltLearningDigest {
  const sourceEvents = Array.isArray(events) ? events : [];
  const sourceEventCount = sourceEvents.length;

  const contextCounter = new Map<string, number>();
  const correctionCounter = new Map<string, number>();
  const ruleCounter = new Map<string, number>();

  let editFeedbackCount = 0;

  for (const event of sourceEvents) {
    const contextLabel = compactText(String(event.context_hint ?? "")) || "sin-contexto";
    contextCounter.set(contextLabel, (contextCounter.get(contextLabel) ?? 0) + 1);

    if (!isFeedbackEvent(event)) continue;
    editFeedbackCount += 1;

    const instruction = compactText(String(event.instruction ?? ""));
    if (!instruction) continue;

    const correction = extractFeedbackSummaryLine(instruction);
    const correctionKey = normalizeText(correction);
    if (correctionKey) {
      const current = correctionCounter.get(correction) ?? 0;
      correctionCounter.set(correction, current + 1);
    }

    for (const rule of inferRulesFromFeedbackText(correction)) {
      ruleCounter.set(rule, (ruleCounter.get(rule) ?? 0) + 1);
    }
  }

  const topContextHints = countToSortedEntries(contextCounter, DEFAULT_TOP_CONTEXTS);
  const topCorrections = countToSortedEntries(correctionCounter, DEFAULT_TOP_CORRECTIONS);
  const consolidatedRules = countRulesToSortedEntries(ruleCounter, DEFAULT_TOP_RULES);

  const frequencyLabel = frequency === "weekly" ? "semanal" : "diario";
  const markdownLines: string[] = [
    `# Digest ${frequencyLabel} de aprendizaje IA`,
    `Periodo UTC: ${periodStart} -> ${periodEnd}`,
    "",
    "## Metricas",
    `- Eventos analizados: ${sourceEventCount}`,
    `- Correcciones por edicion del usuario: ${editFeedbackCount}`,
    "",
  ];

  if (topCorrections.length > 0) {
    markdownLines.push("## Correcciones repetidas");
    topCorrections.forEach((entry, index) => {
      markdownLines.push(`${index + 1}. (${entry.count}) ${entry.label}`);
    });
    markdownLines.push("");
  }

  if (consolidatedRules.length > 0) {
    markdownLines.push("## Reglas consolidadas");
    consolidatedRules.forEach((entry, index) => {
      markdownLines.push(`${index + 1}. (${entry.count}) ${entry.rule}`);
    });
    markdownLines.push("");
  }

  if (topContextHints.length > 0) {
    markdownLines.push("## Contextos frecuentes");
    topContextHints.forEach((entry) => {
      markdownLines.push(`- ${entry.label}: ${entry.count}`);
    });
    markdownLines.push("");
  }

  if (topCorrections.length === 0) {
    markdownLines.push("Sin correcciones de edicion registradas en este periodo.");
  }

  const summaryJson: LearningDigestSummaryJson = {
    generatedAt: new Date().toISOString(),
    frequency,
    periodStart,
    periodEnd,
    totals: {
      sourceEvents: sourceEventCount,
      editFeedbackEvents: editFeedbackCount,
    },
    topContextHints,
    topCorrections,
    consolidatedRules,
  };

  return {
    sourceEventCount,
    editFeedbackCount,
    summaryMarkdown: markdownLines.join("\n").trim(),
    summaryJson,
  };
}

export function buildLearningDigestRagText(summary: LearningDigestSummaryJson) {
  const lines: string[] = [];

  lines.push(`Periodo: ${summary.periodStart} -> ${summary.periodEnd}`);
  lines.push(`Eventos: ${summary.totals.sourceEvents}`);
  lines.push(`Correcciones: ${summary.totals.editFeedbackEvents}`);

  if (summary.consolidatedRules.length > 0) {
    lines.push("Reglas prioritarias:");
    for (const entry of summary.consolidatedRules.slice(0, 8)) {
      lines.push(`- ${entry.rule} (x${entry.count})`);
    }
  }

  if (summary.topCorrections.length > 0) {
    lines.push("Errores frecuentes recientes:");
    for (const entry of summary.topCorrections.slice(0, 5)) {
      lines.push(`- ${entry.label} (x${entry.count})`);
    }
  }

  return lines.join("\n");
}

