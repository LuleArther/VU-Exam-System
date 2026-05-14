import type { APIRoute } from 'astro';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

const VALID_ROLES = new Set(['student', 'lecturer', 'administrator', 'other']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESULTS_DIR = join(process.cwd(), 'survey-results');
let resultsDirReady: Promise<void> | null = null;

const ensureResultsDir = async () => {
  if (!resultsDirReady) {
    resultsDirReady = mkdir(RESULTS_DIR, { recursive: true }).catch((error) => {
      resultsDirReady = null;
      throw error;
    });
  }

  await resultsDirReady;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();
    const fullName = String(payload?.fullName ?? '').trim();
    const email = String(payload?.email ?? '').trim();
    const role = String(payload?.role ?? '').trim();
    const overallExperience = String(payload?.overallExperience ?? '').trim();
    const comments = String(payload?.comments ?? '').trim();

    if (!fullName || !email || !role || !overallExperience) {
      return new Response(JSON.stringify({ error: 'Missing required survey fields.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!VALID_ROLES.has(role)) {
      return new Response(JSON.stringify({ error: 'Invalid survey role.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await ensureResultsDir();

    const submissionId = randomUUID();
    const fileName = `survey-${submissionId}.json`;
    const filePath = join(RESULTS_DIR, fileName);

    const record = {
      submittedAt: new Date().toISOString(),
      fullName,
      email,
      role,
      overallExperience,
      comments,
      roleAnswers: payload?.roleAnswers ?? {}
    };

    await writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');

    return new Response(JSON.stringify({ success: true, submissionId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to save survey response:', error);
    return new Response(JSON.stringify({ error: 'Failed to save survey response.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
