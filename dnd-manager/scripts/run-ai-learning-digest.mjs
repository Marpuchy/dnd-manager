#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");

function parseEnvText(raw) {
  const out = {};
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex <= 0) continue;
    const key = trimmed.slice(0, equalIndex).trim();
    if (!key || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = trimmed.slice(equalIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadProjectEnv() {
  const files = [".env", ".env.local"];
  for (const name of files) {
    const fullPath = resolve(PROJECT_ROOT, name);
    if (!existsSync(fullPath)) continue;
    const parsed = parseEnvText(readFileSync(fullPath, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadProjectEnv();

const DEFAULT_BASE_URL = process.env.AI_LEARNING_DIGEST_BASE_URL || "http://127.0.0.1:3000";

function readArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((entry) => entry.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

function normalizeFrequency(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "daily" || raw === "diario") return "daily";
  if (raw === "weekly" || raw === "semanal") return "weekly";
  return "weekly";
}

function parseBoolean(value) {
  if (typeof value !== "string") return undefined;
  const raw = value.trim().toLowerCase();
  if (["1", "true", "yes", "si"].includes(raw)) return true;
  if (["0", "false", "no"].includes(raw)) return false;
  return undefined;
}

async function main() {
  const baseUrl = readArg("base-url") || process.env.AI_LEARNING_DIGEST_BASE_URL || DEFAULT_BASE_URL;
  const secret = readArg("secret") || process.env.AI_LEARNING_DIGEST_SECRET;
  if (!secret) {
    throw new Error("Missing AI_LEARNING_DIGEST_SECRET (or --secret=...).");
  }

  const frequency = normalizeFrequency(
    readArg("frequency") || process.env.AI_LEARNING_DIGEST_FREQUENCY || "weekly"
  );

  const explicitSend = parseBoolean(
    readArg("send-email") || process.env.AI_LEARNING_DIGEST_SEND_EMAIL
  );
  const sendEmail = explicitSend ?? frequency === "weekly";

  const periodStart = readArg("period-start") || process.env.AI_LEARNING_DIGEST_PERIOD_START;
  const periodEnd = readArg("period-end") || process.env.AI_LEARNING_DIGEST_PERIOD_END;

  const payload = {
    frequency,
    sendEmail,
    ...(periodStart ? { periodStart } : {}),
    ...(periodEnd ? { periodEnd } : {}),
  };

  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/ai/learning/digest`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ai-learning-secret": secret,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : `HTTP ${response.status}`;
    throw new Error(message);
  }

  const digestId = data?.digest?.id || "(sin id)";
  const emailStatus = data?.email?.status || "n/a";
  console.log(`Digest generated: ${digestId}`);
  console.log(`Frequency: ${frequency}`);
  console.log(`Email status: ${emailStatus}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ai:digest failed: ${message}`);
  process.exit(1);
});
