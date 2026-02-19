import type { AbilityKey, ItemAttachmentEntry } from "@/lib/types/dnd";
import { getLocalizedText } from "@/lib/character/items";
import { tr } from "@/lib/i18n/translate";

export function getItemAttachmentTypeLabel(type: string, locale: string) {
  const map: Record<string, { es: string; en: string }> = {
    action: { es: "Accion", en: "Action" },
    ability: { es: "Habilidad", en: "Ability" },
    trait: { es: "Rasgo", en: "Trait" },
    spell: { es: "Hechizo", en: "Spell" },
    cantrip: { es: "Truco", en: "Cantrip" },
    classFeature: { es: "Rasgo de clase", en: "Class feature" },
    other: { es: "Otro", en: "Other" },
  };
  const entry = map[type];
  if (!entry) return type;
  return locale === "en" ? entry.en : entry.es;
}

function getActionTypeLabel(
  value: ItemAttachmentEntry["actionType"] | undefined,
  locale: string
) {
  if (!value) return "";
  if (value === "action") return tr(locale, "Accion", "Action");
  if (value === "bonus") return tr(locale, "Accion bonus", "Bonus action");
  if (value === "reaction") return tr(locale, "Reaccion", "Reaction");
  return tr(locale, "Pasiva", "Passive");
}

function getAbilityLabel(ability: AbilityKey, locale: string) {
  const labels: Record<AbilityKey, { es: string; en: string }> = {
    STR: { es: "Fuerza", en: "Strength" },
    DEX: { es: "Destreza", en: "Dexterity" },
    CON: { es: "Constitucion", en: "Constitution" },
    INT: { es: "Inteligencia", en: "Intelligence" },
    WIS: { es: "Sabiduria", en: "Wisdom" },
    CHA: { es: "Carisma", en: "Charisma" },
  };
  const entry = labels[ability];
  return locale === "en" ? entry.en : entry.es;
}

function inferAbilityFromText(text: string): AbilityKey | undefined {
  const normalized = normalizeAttachmentCompareText(text);
  if (!normalized) return undefined;

  if (/\b(fuerza|strength|str)\b/.test(normalized)) return "STR";
  if (/\b(destreza|dexterity|dex)\b/.test(normalized)) return "DEX";
  if (/\b(constitucion|constitution|con)\b/.test(normalized)) return "CON";
  if (/\b(inteligencia|intelligence|int)\b/.test(normalized)) return "INT";
  if (/\b(sabiduria|wisdom|wis)\b/.test(normalized)) return "WIS";
  if (/\b(carisma|charisma|cha)\b/.test(normalized)) return "CHA";
  return undefined;
}

function pushMarkdownField(
  lines: string[],
  label: string,
  value: string | number | null | undefined
) {
  const text = value == null ? "" : String(value).trim();
  if (!text) return;
  lines.push(`**${label}:**\n\n${text}`);
}

function normalizeAttachmentCompareText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isMarkdownFormattedLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return (
    /^[-*+]\s/.test(trimmed) ||
    /^\d+\.\s/.test(trimmed) ||
    /^#{1,6}\s/.test(trimmed) ||
    /^>\s/.test(trimmed) ||
    /^`{3,}/.test(trimmed) ||
    /^\|/.test(trimmed)
  );
}

function hasAttachmentStructuredData(attachment: ItemAttachmentEntry) {
  return (
    !!attachment.school ||
    !!attachment.castingTime?.value ||
    !!attachment.castingTime?.note ||
    !!attachment.range ||
    !!attachment.duration ||
    !!attachment.materials ||
    !!attachment.components?.verbal ||
    !!attachment.components?.somatic ||
    !!attachment.components?.material ||
    !!attachment.concentration ||
    !!attachment.ritual ||
    !!attachment.actionType ||
    !!attachment.requirements ||
    !!attachment.effect ||
    !!attachment.resourceCost ||
    (attachment.save?.type != null && attachment.save.type !== "none") ||
    !!attachment.damage?.damageType ||
    !!attachment.damage?.dice ||
    !!attachment.damage?.scaling
  );
}

function isDuplicateMetadataLine(
  line: string,
  attachment: ItemAttachmentEntry
) {
  const normalized = normalizeAttachmentCompareText(line);
  if (!normalized) return true;

  if (
    attachment.range &&
    (normalized.startsWith("alcance:") ||
      normalized.startsWith("range:") ||
      normalized.startsWith("area:"))
  ) {
    return true;
  }

  if (
    attachment.duration &&
    (normalized.startsWith("duracion:") || normalized.startsWith("duration:"))
  ) {
    return true;
  }

  if (
    (attachment.castingTime?.value || attachment.castingTime?.note) &&
    (normalized.startsWith("tiempo de lanzamiento:") ||
      normalized.startsWith("casting time:"))
  ) {
    return true;
  }

  if (
    (attachment.components?.verbal ||
      attachment.components?.somatic ||
      attachment.components?.material) &&
    (normalized.startsWith("componentes:") || normalized.startsWith("components:"))
  ) {
    return true;
  }

  if (
    attachment.materials &&
    (normalized.startsWith("materiales:") || normalized.startsWith("materials:"))
  ) {
    return true;
  }

  if (
    attachment.save &&
    attachment.save.type &&
    attachment.save.type !== "none" &&
    (normalized.startsWith("salvacion:") ||
      normalized.startsWith("saving throw:"))
  ) {
    return true;
  }

  if (
    attachment.damage &&
    (attachment.damage.damageType ||
      attachment.damage.dice ||
      attachment.damage.scaling) &&
    (normalized.startsWith("dano:") ||
      normalized.startsWith("damage:") ||
      (/\b\d+d\d+(?:\s*[+\-]\s*\d+)?\b/.test(normalized) &&
        (normalized.includes("dano") || normalized.includes("damage"))))
  ) {
    return true;
  }

  if (
    (attachment.actionType || attachment.resourceCost) &&
    (normalized.startsWith("uso:") || normalized.includes("como accion"))
  ) {
    return true;
  }

  return false;
}

function splitDescriptionIntoLines(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(
      /\s+(?=(?:alcance|range|area|[áa]rea|salvaci[oó]n|saving throw|duraci[oó]n|duration|componentes|components|materiales|materials|tiempo de lanzamiento|casting time|da[nñ]o|damage|efecto inicial|uso)\s*:)/giu,
      "\n"
    )
    .replace(
      /\s+(?=(?:[eé]xito|fallo)\s*:)/giu,
      "\n"
    )
    .replace(
      /\s+(?=(?:criaturas ya corruptas|realizan la salvaci[oó]n|el da[nñ]o aumenta)\b)/giu,
      "\n"
    )
    .replace(
      /\s+(?=\d+d\d+(?:\s*[+\-]\s*\d+)?\s+(?:de\s+)?(?:da[nñ]o|damage)\b)/giu,
      "\n"
    )
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function toFormattedListItem(line: string) {
  const collapsed = line.replace(/\s+/g, " ").trim();
  const match = collapsed.match(/^([^:]{2,40}):\s*(.+)$/);
  if (!match) return collapsed;
  const label = match[1]?.trim() ?? "";
  const value = match[2]?.trim() ?? "";
  if (!label || !value) return collapsed;
  return `**${label}:** ${value}`;
}

function countWords(value: string) {
  const normalized = value
    .replace(/[^\p{L}\p{N}\s'-]+/gu, " ")
    .trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).length;
}

function shouldMergeLabelWithNextLine(label: string) {
  const normalized = normalizeAttachmentCompareText(label);
  if (!normalized) return false;
  if (normalized.startsWith("al final de cada turno")) return false;
  if (normalized.startsWith("criaturas ")) return false;
  return countWords(label) <= 3;
}

function mergeDanglingLabelLines(lines: string[]) {
  const merged: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const current = (lines[index] ?? "").trim();
    const next = (lines[index + 1] ?? "").trim();
    const currentMatch = current.match(/^([^:]{1,80}):\s*$/);
    const nextLooksLikeLabelOnly = /^[^:]{1,80}:\s*$/.test(next);
    const nextLooksLikeMarkdown = isMarkdownFormattedLine(next);

    if (
      currentMatch &&
      next &&
      !nextLooksLikeLabelOnly &&
      !nextLooksLikeMarkdown &&
      shouldMergeLabelWithNextLine(currentMatch[1] ?? "")
    ) {
      merged.push(`${current} ${next}`.replace(/\s+/g, " ").trim());
      index += 2;
      continue;
    }

    merged.push(current);
    index += 1;
  }

  return merged;
}

function parseNumberedListItem(line: string) {
  const match = line
    .trim()
    .match(/^(\d{1,3})\s*(?:[.)\]:-])\s*(.+)$/);
  if (!match) return undefined;
  return {
    index: Number(match[1]),
    content: (match[2] ?? "").trim(),
  };
}

function shouldUseNumberedList(lines: string[]) {
  if (lines.length < 2) return false;
  if (lines.some(isMarkdownFormattedLine)) return false;
  const numberedCount = lines.filter((line) => !!parseNumberedListItem(line)).length;
  return numberedCount >= 2 && numberedCount >= Math.ceil(lines.length * 0.6);
}

function shouldUseBulletList(lines: string[]) {
  if (lines.length < 3) return false;
  if (lines.some(isMarkdownFormattedLine)) return false;

  const shortCount = lines.filter((line) => line.length <= 120).length;
  const compactSignals = lines.filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.includes(":") ||
      !/[.!?]$/.test(trimmed) ||
      /^no\b/i.test(trimmed) ||
      /^sin\b/i.test(trimmed)
    );
  }).length;
  const hasVeryLong = lines.some((line) => line.length > 220);

  return (
    !hasVeryLong &&
    shortCount >= Math.ceil(lines.length * 0.7) &&
    compactSignals >= Math.ceil(lines.length * 0.5)
  );
}

function shouldUseIndentedBlock(lines: string[]) {
  if (lines.length < 4) return false;
  const normalized = lines.map((line) => normalizeAttachmentCompareText(line));
  const hasTurnHeader = normalized.some((line) =>
    line.startsWith("al final de cada turno")
  );
  const hasOutcome = normalized.some(
    (line) => line.startsWith("exito:") || line.startsWith("fallo:")
  );
  const hasConditional = normalized.some((line) =>
    line.startsWith("criaturas")
  );
  return hasTurnHeader && hasOutcome && hasConditional;
}

function renderNumberedList(lines: string[]) {
  return lines
    .map((line, index) => {
      const parsed = parseNumberedListItem(line);
      const item = toFormattedListItem(parsed?.content ?? line);
      const number = parsed?.index && parsed.index > 0 ? parsed.index : index + 1;
      return `${number}. ${item}`;
    })
    .join("\n");
}

function renderBulletList(lines: string[]) {
  return lines.map((line) => `- ${toFormattedListItem(line)}`).join("\n");
}

function renderIndentedBlock(lines: string[]) {
  if (lines.length === 0) return "";
  const [first, ...rest] = lines;
  return [first, ...rest.map((line) => `> ${toFormattedListItem(line)}`)].join(
    "\n"
  );
}

function paragraphize(text: string) {
  return text
    .replace(/([.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ0-9(])/g, "$1\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatAttachmentDescription(
  rawDescription: string,
  attachment: ItemAttachmentEntry
) {
  const text = rawDescription.trim();
  if (!text) return "";

  const splitLines = splitDescriptionIntoLines(text);
  if (splitLines.length === 0) return "";
  const mergedLines = mergeDanglingLabelLines(splitLines);

  const filteredLines =
    hasAttachmentStructuredData(attachment) && mergedLines.length > 0
      ? mergedLines.filter((line) => !isDuplicateMetadataLine(line, attachment))
      : mergedLines;
  const lines = filteredLines.length > 0 ? filteredLines : mergedLines;
  if (lines.length === 0) return "";

  if (shouldUseIndentedBlock(lines)) return renderIndentedBlock(lines);
  if (shouldUseNumberedList(lines)) return renderNumberedList(lines);
  if (shouldUseBulletList(lines)) return renderBulletList(lines);

  const markdownAwareJoin = lines.some(isMarkdownFormattedLine)
    ? lines.join("\n")
    : lines.join("\n\n");
  return paragraphize(markdownAwareJoin);
}

export function formatItemAttachmentMarkdown(
  attachment: ItemAttachmentEntry,
  locale: string
) {
  const lines: string[] = [];
  const rawDescription = getLocalizedText(attachment.description, locale)?.trim() ?? "";
  const description = formatAttachmentDescription(rawDescription, attachment);
  const isSpellLike =
    attachment.type === "spell" || attachment.type === "cantrip";
  const isAbilityLike =
    attachment.type === "action" ||
    attachment.type === "ability" ||
    attachment.type === "classFeature";

  if (isSpellLike) {
    pushMarkdownField(lines, tr(locale, "Escuela", "School"), attachment.school);

    if (attachment.castingTime?.value) {
      const castingText = `${attachment.castingTime.value}${
        attachment.castingTime.note ? ` (${attachment.castingTime.note})` : ""
      }`;
      pushMarkdownField(
        lines,
        tr(locale, "Tiempo de lanzamiento", "Casting time"),
        castingText
      );
    }

    pushMarkdownField(lines, tr(locale, "Alcance", "Range"), attachment.range);
    pushMarkdownField(lines, tr(locale, "Duracion", "Duration"), attachment.duration);

    const components: string[] = [];
    if (attachment.components?.verbal) components.push("V");
    if (attachment.components?.somatic) components.push("S");
    if (attachment.components?.material) components.push("M");
    if (components.length > 0) {
      pushMarkdownField(
        lines,
        tr(locale, "Componentes", "Components"),
        components.join(", ")
      );
    }
    pushMarkdownField(lines, tr(locale, "Materiales", "Materials"), attachment.materials);
    if (attachment.concentration) {
      pushMarkdownField(lines, tr(locale, "Concentracion", "Concentration"), tr(locale, "Si", "Yes"));
    }
    if (attachment.ritual) {
      pushMarkdownField(lines, tr(locale, "Ritual", "Ritual"), tr(locale, "Si", "Yes"));
    }

    if (attachment.resourceCost) {
      const parts: string[] = [];
      if (attachment.resourceCost.usesSpellSlot) {
        parts.push(
          tr(locale, "Gasta espacio de conjuro", "Uses spell slot") +
            (attachment.resourceCost.slotLevel
              ? ` (${tr(locale, "nivel", "level")} ${attachment.resourceCost.slotLevel})`
              : "")
        );
      }
      if (attachment.resourceCost.charges != null) {
        parts.push(
          `${attachment.resourceCost.charges} ${tr(
            locale,
            attachment.resourceCost.charges === 1 ? "carga" : "cargas",
            attachment.resourceCost.charges === 1 ? "charge" : "charges"
          )}`
        );
      }
      if (attachment.resourceCost.points != null) {
        parts.push(
          `${attachment.resourceCost.points} ${
            attachment.resourceCost.pointsLabel || tr(locale, "puntos", "points")
          }`
        );
      }
      if (parts.length > 0) {
        pushMarkdownField(lines, tr(locale, "Coste", "Cost"), parts.join(", "));
      }
    }

    if (attachment.save && attachment.save.type && attachment.save.type !== "none") {
      const saveType =
        attachment.save.type === "attack"
          ? tr(locale, "Ataque", "Attack")
          : tr(locale, "Salvacion", "Saving throw");
      const resolvedAbility =
        attachment.save.saveAbility ??
        attachment.save.dcStat ??
        inferAbilityFromText(description || rawDescription);
      const detail = [
        resolvedAbility
          ? `${tr(locale, "Atributo", "Ability")}: ${getAbilityLabel(
              resolvedAbility,
              locale
            )}`
          : "",
        attachment.save.dcType === "fixed" && attachment.save.dcValue != null
          ? `CD ${attachment.save.dcValue}`
          : "",
        attachment.save.dcType === "stat" && attachment.save.dcStat
          ? `${tr(locale, "CD por", "DC by")} ${attachment.save.dcStat}`
          : "",
      ]
        .filter(Boolean)
        .join(" - ");
      pushMarkdownField(
        lines,
        tr(locale, "Tirada / salvacion", "Roll / save"),
        `${saveType}${detail ? ` (${detail})` : ""}`
      );
    }

    if (
      attachment.damage &&
      (attachment.damage.damageType ||
        attachment.damage.dice ||
        attachment.damage.scaling)
    ) {
      const parts = [
        attachment.damage.damageType
          ? `${tr(locale, "Tipo", "Type")}: ${attachment.damage.damageType}`
          : "",
        attachment.damage.dice
          ? `${tr(locale, "Dados", "Dice")}: ${attachment.damage.dice}`
          : "",
        attachment.damage.scaling
          ? `${tr(locale, "Escalado", "Scaling")}: ${attachment.damage.scaling}`
          : "",
      ]
        .filter(Boolean)
        .join(" - ");
      if (parts) {
        pushMarkdownField(lines, tr(locale, "Dano", "Damage"), parts);
      }
    }
  }

  if (isAbilityLike) {
    pushMarkdownField(
      lines,
      tr(locale, "Tipo", "Type"),
      getActionTypeLabel(attachment.actionType, locale)
    );
    pushMarkdownField(
      lines,
      tr(locale, "Requisitos", "Requirements"),
      attachment.requirements
    );
    pushMarkdownField(lines, tr(locale, "Efecto", "Effect"), attachment.effect);

    if (attachment.resourceCost) {
      const parts: string[] = [];
      if (attachment.resourceCost.usesSpellSlot) {
        parts.push(
          tr(locale, "Gasta espacio de conjuro", "Uses spell slot") +
            (attachment.resourceCost.slotLevel
              ? ` (${tr(locale, "nivel", "level")} ${attachment.resourceCost.slotLevel})`
              : "")
        );
      }
      if (attachment.resourceCost.charges != null) {
        const rechargeText =
          attachment.resourceCost.recharge === "long"
            ? tr(locale, "descanso largo", "long rest")
            : tr(locale, "descanso corto", "short rest");
        parts.push(
          `${attachment.resourceCost.charges} ${tr(
            locale,
            attachment.resourceCost.charges === 1 ? "carga" : "cargas",
            attachment.resourceCost.charges === 1 ? "charge" : "charges"
          )}${attachment.resourceCost.recharge ? ` / ${rechargeText}` : ""}`
        );
      }
      if (attachment.resourceCost.points != null) {
        parts.push(
          `${attachment.resourceCost.points} ${
            attachment.resourceCost.pointsLabel || tr(locale, "puntos", "points")
          }`
        );
      }
      if (parts.length > 0) {
        pushMarkdownField(lines, tr(locale, "Coste", "Cost"), parts.join(", "));
      }
    }
  }

  pushMarkdownField(lines, tr(locale, "Descripcion", "Description"), description);
  return lines.join("\n\n");
}
