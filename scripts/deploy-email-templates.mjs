#!/usr/bin/env node
/**
 * Deploys all Supabase auth email templates from supabase/email-templates/
 * Uses the Supabase Management API (requires SUPABASE_ACCESS_TOKEN env var).
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/deploy-email-templates.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const PROJECT_ID = "dncivkcrhoypbvvpmfgi";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  console.error("❌  SUPABASE_ACCESS_TOKEN is not set.");
  console.error("    Get it from: https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}

const TEMPLATES = [
  {
    type: "confirmation",
    subject: "Confirm your FineClause account",
    file: "supabase/email-templates/confirmation.html",
  },
  {
    type: "recovery",
    subject: "Reset your FineClause password",
    file: "supabase/email-templates/reset-password.html",
  },
  {
    type: "magic_link",
    subject: "Your FineClause sign-in link",
    file: "supabase/email-templates/magic-link.html",
  },
  {
    type: "email_change",
    subject: "Confirm your new FineClause email",
    file: "supabase/email-templates/email-change.html",
  },
];

async function deploy(template) {
  const html = readFileSync(join(ROOT, template.file), "utf8");

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_ID}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        [`mailer_subjects_${template.type}`]: template.subject,
        [`email_template_${template.type}`]: html,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json();
}

let ok = 0;
for (const t of TEMPLATES) {
  try {
    await deploy(t);
    console.log(`✅  ${t.type}`);
    ok++;
  } catch (err) {
    console.error(`❌  ${t.type}: ${err.message}`);
  }
}
console.log(`\n${ok}/${TEMPLATES.length} templates deployed.`);
if (ok < TEMPLATES.length) process.exit(1);
