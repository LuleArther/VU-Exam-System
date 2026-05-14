import type { APIRoute } from 'astro';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

const VALID_ROLES = new Set(['student', 'lecturer', 'administrator', 'other']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESULTS_DIR = join(process.cwd(), 'survey-results');
const RESULTS_DIR_READY = mkdir(RESULTS_DIR, { recursive: true });

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();

    if (!payload?.fullName || !payload?.email || !payload?.role || !payload?.overallExperience) {
      return new Response(JSON.stringify({ error: 'Missing required survey fields.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!VALID_ROLES.has(payload.role)) {
      return new Response(JSON.stringify({ error: 'Invalid survey role.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!EMAIL_PATTERN.test(String(payload.email).trim())) {
      return new Response(JSON.stringify({ error: 'Invalid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await RESULTS_DIR_READY;

    const fileName = `survey-${randomUUID()}.json`;
    const filePath = join(RESULTS_DIR, fileName);

    const record = {
      submittedAt: new Date().toISOString(),
      ...payload
    };

    await writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');

    return new Response(JSON.stringify({ success: true, file: `survey-results/${fileName}` }), {
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
