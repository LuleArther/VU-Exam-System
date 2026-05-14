import type { APIRoute } from 'astro';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const VALID_ROLES = new Set(['student', 'lecturer', 'administrator', 'other']);

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

    const resultsDir = join(process.cwd(), 'survey-results');
    await mkdir(resultsDir, { recursive: true });

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const fileName = `survey-${timestamp}-${randomSuffix}.json`;
    const filePath = join(resultsDir, fileName);

    const record = {
      submittedAt: new Date().toISOString(),
      ...payload
    };

    await writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');

    return new Response(JSON.stringify({ success: true, file: `survey-results/${fileName}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to save survey response.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
